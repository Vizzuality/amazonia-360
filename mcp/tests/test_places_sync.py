import copy
from datetime import UTC, datetime
from typing import Any
from urllib.parse import parse_qs

import httpx
import pytest

from mcp_server.places.models import PlacesSnapshot
from mcp_server.places.sync import (
    SOURCES,
    PlacesSyncError,
    quote,
    sync_places,
)

NOW = datetime(2026, 9, 30, 10, 0, tzinfo=UTC)


def ring(x: float, y: float, size: float) -> list[list[float]]:
    # Clockwise: an outer ring in Esri JSON.
    return [[x, y], [x, y + size], [x + size, y + size], [x + size, y], [x, y]]


def square(x: float, y: float, size: float = 0.1) -> dict[str, Any]:
    return {"rings": [ring(x, y, size)]}


FEATURES: dict[str, list[dict[str, Any]]] = {
    "province": [
        {"attributes": {"NAME_1": "Napo"}, "geometry": square(-78.0, -1.0)},
    ],
    "canton": [
        {
            "attributes": {"NAME_1": "Napo", "NAME_2": "Tena"},
            "geometry": square(-78.0, -1.0),
        },
        {
            "attributes": {"NAME_1": "Pastaza", "NAME_2": "Mejía"},
            "geometry": square(-77.0, -2.0),
        },
        {
            "attributes": {"NAME_1": "Pichincha", "NAME_2": "Mejía"},
            "geometry": square(-78.6, -0.5),
        },
    ],
    "protected_area": [
        # Two features with one name become one place.
        {
            "attributes": {"Nombre": "Yasuní", "Categoria": "Parque Nacional"},
            "geometry": square(-76.0, -1.0),
        },
        {
            "attributes": {"Nombre": "Yasuní", "Categoria": "Parque Nacional"},
            "geometry": square(-75.9, -1.0),
        },
    ],
}


def transport(
    fail: str | None = None,
    truncate: str | None = None,
    malformed: dict[str, Any] | None = None,
    features: dict[str, list[dict[str, Any]]] = FEATURES,
) -> httpx.MockTransport:
    urls = {f"{s.url}/{s.layer_id}/query": s.kind for s in SOURCES}

    def handler(request: httpx.Request) -> httpx.Response:
        kind = urls.get(str(request.url).split("?")[0])
        if kind is None:
            return httpx.Response(404)
        if kind == fail:
            return httpx.Response(200, json={"error": {"code": 400, "message": "x"}})
        assert parse_qs(request.content.decode())["f"] == ["json"]
        body: dict[str, Any] = {"features": features[kind]}
        if malformed is not None and kind == "canton":
            feature = {"attributes": {"NAME_1": "Napo", "NAME_2": "Archidona"}}
            body["features"] = [*features[kind], {**feature, "geometry": malformed}]
        if kind == truncate:
            body["exceededTransferLimit"] = True
        return httpx.Response(200, json=body)

    return httpx.MockTransport(handler)


async def run(
    fail: str | None = None,
    truncate: str | None = None,
    malformed: dict[str, Any] | None = None,
    features: dict[str, list[dict[str, Any]]] = FEATURES,
) -> dict[str, Any]:
    async with httpx.AsyncClient(
        transport=transport(fail, truncate, malformed, features)
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
async def test_an_enclave_is_left_out_of_the_area() -> None:
    enclave = list(reversed(ring(-77.97, -0.97, 0.04)))
    features = copy.deepcopy(FEATURES)
    features["canton"][0]["geometry"]["rings"].append(enclave)
    snapshot = PlacesSnapshot.model_validate(await run(features=features))
    tena = next(p for p in snapshot.places if p.id == "canton:Napo/Tena")
    napo = next(p for p in snapshot.places if p.kind == "province")
    assert tena.area_ha == pytest.approx(napo.area_ha * (1 - 0.16), rel=0.01)


@pytest.mark.anyio
async def test_features_without_a_name_or_a_geometry_are_skipped() -> None:
    features = copy.deepcopy(FEATURES)
    features["province"] += [
        {"attributes": {"NAME_1": None}, "geometry": square(-79.0, -1.0)},
        {"attributes": {"NAME_1": "Orellana"}, "geometry": None},
    ]
    snapshot = PlacesSnapshot.model_validate(await run(features=features))
    assert [p.id for p in snapshot.places if p.kind == "province"] == ["province:Napo"]


@pytest.mark.anyio
async def test_a_source_that_fails_fails_the_sync() -> None:
    with pytest.raises(PlacesSyncError):
        await run(fail="canton")


@pytest.mark.anyio
@pytest.mark.parametrize(
    "geometry",
    [
        {},
        {"rings": 5},
        {"rings": [[[0, 0], [1, 1]]]},
        # Only a hole, which Esri draws as nothing.
        {"rings": [list(reversed(ring(0, 0, 1)))]},
        {"paths": []},
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
