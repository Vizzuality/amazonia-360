from datetime import UTC, datetime
from typing import Any

import httpx
import pytest

from mcp_server import places
from mcp_server.catalogue import cli
from mcp_server.places.models import PlacesSnapshot
from mcp_server.places.sync import (
    SOURCES,
    PlacesSyncError,
    quote,
    sync_places,
)

NOW = datetime(2026, 9, 30, 10, 0, tzinfo=UTC)


def square(x: float, y: float, size: float = 0.1) -> dict[str, Any]:
    ring = [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]
    return {"type": "Polygon", "coordinates": [ring]}


FEATURES: dict[str, list[dict[str, Any]]] = {
    "province": [
        {"properties": {"NAME_1": "Napo"}, "geometry": square(-78.0, -1.0)},
    ],
    "canton": [
        {
            "properties": {"NAME_1": "Napo", "NAME_2": "Tena"},
            "geometry": square(-78.0, -1.0),
        },
        {
            "properties": {"NAME_1": "Pastaza", "NAME_2": "Mejía"},
            "geometry": square(-77.0, -2.0),
        },
        {
            "properties": {"NAME_1": "Pichincha", "NAME_2": "Mejía"},
            "geometry": square(-78.6, -0.5),
        },
    ],
    "protected_area": [
        # Two features with one name become one place.
        {
            "properties": {"Nombre": "Yasuní", "Categoria": "Parque Nacional"},
            "geometry": square(-76.0, -1.0),
        },
        {
            "properties": {"Nombre": "Yasuní", "Categoria": "Parque Nacional"},
            "geometry": square(-75.9, -1.0),
        },
    ],
}


def transport(
    fail: str | None = None,
    truncate: str | None = None,
    malformed: dict[str, Any] | None = None,
) -> httpx.MockTransport:
    urls = {f"{s.url}/{s.layer_id}/query": s.kind for s in SOURCES}

    def handler(request: httpx.Request) -> httpx.Response:
        kind = urls.get(str(request.url).split("?")[0])
        if kind is None:
            return httpx.Response(404)
        if kind == fail:
            return httpx.Response(200, json={"error": {"code": 400, "message": "x"}})
        body: dict[str, Any] = {
            "type": "FeatureCollection",
            "features": FEATURES[kind],
        }
        if malformed is not None and kind == "canton":
            feature = {"properties": {"NAME_1": "Napo", "NAME_2": "Archidona"}}
            body["features"] = [*FEATURES[kind], {**feature, "geometry": malformed}]
        if kind == truncate:
            body["exceededTransferLimit"] = True
        return httpx.Response(200, json=body)

    return httpx.MockTransport(handler)


async def run(
    fail: str | None = None,
    truncate: str | None = None,
    malformed: dict[str, Any] | None = None,
) -> dict[str, Any]:
    async with httpx.AsyncClient(
        transport=transport(fail, truncate, malformed)
    ) as http:
        return await sync_places(http, NOW)


@pytest.mark.anyio
async def test_writes_every_kind_with_its_id() -> None:
    snapshot = PlacesSnapshot.model_validate(await run())
    ids = [p.id for p in snapshot.places]
    assert ids == [
        "province:Napo",
        "canton:Napo/Tena",
        "canton:Pastaza/Mejía",
        "canton:Pichincha/Mejía",
        "protected_area:Yasuní",
    ]
    assert snapshot.generated_at == "2026-09-30T10:00:00Z"


@pytest.mark.anyio
async def test_a_canton_carries_its_province_and_a_where_that_finds_it() -> None:
    snapshot = PlacesSnapshot.model_validate(await run())
    tena = next(p for p in snapshot.places if p.id == "canton:Napo/Tena")
    assert tena.province == "Napo"
    assert tena.source.where == "GID_0 = 'ECU' AND NAME_1 = 'Napo' AND NAME_2 = 'Tena'"
    assert tena.source.layer_id == 6


@pytest.mark.anyio
async def test_features_with_one_name_are_one_place_with_the_joint_area() -> None:
    snapshot = PlacesSnapshot.model_validate(await run())
    yasuni = next(p for p in snapshot.places if p.kind == "protected_area")
    napo = next(p for p in snapshot.places if p.kind == "province")
    assert yasuni.category == "Parque Nacional"
    # Two 0.1-degree squares, side by side: 2 squares.
    assert yasuni.area_ha == pytest.approx(napo.area_ha * 2, rel=0.01)
    assert yasuni.bbox == pytest.approx([-76.0, -1.0, -75.8, -0.9])


@pytest.mark.anyio
async def test_a_source_that_fails_fails_the_sync() -> None:
    with pytest.raises(PlacesSyncError):
        await run(fail="canton")


@pytest.mark.anyio
@pytest.mark.parametrize(
    "geometry",
    [
        {"type": "Polygon"},
        {"type": "Polygon", "coordinates": 5},
        {"type": "Polygon", "coordinates": [[[0, 0], [1, 1]]]},
        {"coordinates": []},
        "not a geometry",
    ],
)
async def test_a_malformed_geometry_fails_the_sync(geometry: Any) -> None:
    with pytest.raises(PlacesSyncError):
        await run(malformed=geometry)


def test_where_doubles_quotes() -> None:
    assert quote("Vírgen del Rosario") == "'Vírgen del Rosario'"
    assert quote("O'Neil") == "'O''Neil'"


@pytest.mark.anyio
async def test_a_truncated_response_fails_the_sync() -> None:
    with pytest.raises(PlacesSyncError, match="truncated"):
        await run(truncate="canton")


def test_a_places_sync_that_fails_leaves_the_snapshot_as_it_was(
    tmp_path: Any, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    (tmp_path / "__init__.py").touch()
    snapshot = tmp_path / places.SNAPSHOT_FILE
    snapshot.write_text('{"previous": true}\n', "utf-8")

    async def catalogue() -> dict[str, Any]:
        return {"indicators": {}}

    async def failing(timeout_s: float) -> dict[str, Any]:
        raise PlacesSyncError("canton: truncated")

    monkeypatch.setattr(cli, "HERE", tmp_path)
    monkeypatch.setattr(cli, "EXAMPLE_FILE", tmp_path / "catalogue.json")
    monkeypatch.setattr(cli, "_sync", lambda timeout_s: catalogue())
    monkeypatch.setattr(cli, "nothing_read", lambda snapshot: False)
    monkeypatch.setattr(cli, "local_document", lambda: None)
    monkeypatch.setattr(cli.local_document, "cache_clear", lambda: None, raising=False)
    monkeypatch.setattr(cli, "exported_catalogue", lambda: {})
    monkeypatch.setattr(cli, "_sync_places", failing)
    monkeypatch.setattr(places, "__file__", str(tmp_path / "__init__.py"))
    monkeypatch.setattr("sys.argv", ["amazonia360-mcp-catalogue", "sync"])

    cli.main()

    assert snapshot.read_text("utf-8") == '{"previous": true}\n'
    assert "left as it was" in capsys.readouterr().out
