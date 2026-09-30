import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs

import httpx
import pytest
from shapely.geometry import Polygon, shape

from mcp_server import places
from mcp_server.catalogue import cli
from mcp_server.catalogue.models import Layer
from mcp_server.geometry import aoi
from mcp_server.geometry.area import geodesic_area_ha
from mcp_server.geometry.module_sync import (
    ModuleSyncError,
    derive_outline,
    dump_outline,
    sync_module,
)

NOW = datetime(2026, 9, 30, 10, 0, tzinfo=UTC)
LAYER = Layer(
    service_url="https://example.com/arcgis/rest/services/geomorfologia/FeatureServer",
    layer_id=0,
    category_field="Relieve",
)
QUERY = f"{LAYER.service_url}/{LAYER.layer_id}/query"


def ring(x: float, y: float, size: float) -> list[list[float]]:
    # Clockwise: an outer ring in Esri JSON.
    return [[x, y], [x, y + size], [x + size, y + size], [x + size, y], [x, y]]


def feature(oid: int, x: float, y: float, size: float = 0.5) -> dict[str, Any]:
    return {"attributes": {"OBJECTID": oid}, "geometry": {"rings": [ring(x, y, size)]}}


# Two adjacent features whose union is one rectangle, served one per page.
PAGES = [[feature(1, -78.0, -1.0)], [feature(2, -77.5, -1.0)]]


def transport(
    pages: list[list[dict[str, Any]]] = PAGES, fail: bool = False
) -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) != QUERY:
            return httpx.Response(404)
        if fail:
            return httpx.Response(200, json={"error": {"code": 500, "message": "x"}})
        form = parse_qs(request.content.decode())
        assert form["f"] == ["json"]
        offset = int(form["resultOffset"][0])
        starts = [sum(len(p) for p in pages[:i]) for i in range(len(pages))]
        index = starts.index(offset)
        body: dict[str, Any] = {
            "objectIdFieldName": "OBJECTID",
            "features": pages[index],
        }
        if index < len(pages) - 1:
            body["exceededTransferLimit"] = True
        return httpx.Response(200, json=body)

    return httpx.MockTransport(handler)


async def run(**kwargs: Any) -> dict[str, Any]:
    async with httpx.AsyncClient(transport=transport(**kwargs)) as http:
        return await sync_module(http, LAYER, NOW)


@pytest.mark.anyio
async def test_adjacent_features_become_one_outline() -> None:
    outline = await run()
    geom = shape(outline["geometry"])
    assert isinstance(geom, Polygon)
    assert len(geom.interiors) == 0
    assert geom.bounds == pytest.approx((-78.0, -1.0, -77.0, -0.5))
    assert outline["properties"]["source"] == f"{LAYER.service_url}/0"
    assert outline["properties"]["generated_at"] == "2026-09-30T10:00:00Z"
    assert outline["properties"]["area_ha"] == pytest.approx(
        geodesic_area_ha(geom), abs=1
    )


@pytest.mark.anyio
async def test_a_source_that_cannot_be_read_fails_the_sync() -> None:
    with pytest.raises(ModuleSyncError):
        await run(fail=True)


@pytest.mark.anyio
async def test_a_layer_with_no_features_fails_the_sync() -> None:
    with pytest.raises(ModuleSyncError, match="no area"):
        await run(pages=[[]])


@pytest.mark.anyio
async def test_a_service_that_repeats_a_page_fails_the_sync() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "objectIdFieldName": "OBJECTID",
                "features": PAGES[0],
                "exceededTransferLimit": True,
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
        with pytest.raises(ModuleSyncError, match="repeats a page"):
            await sync_module(http, LAYER, NOW)


def test_the_outline_keeps_only_polygons_and_is_simplified() -> None:
    from shapely.geometry import LineString, Point

    wiggly = Point(-77.5, -1.0).buffer(0.2, quad_segs=500)
    line = LineString([(-70, 0), (-69, 0)])
    outline = derive_outline([wiggly, line])
    assert isinstance(outline, Polygon)
    assert len(outline.exterior.coords) < len(wiggly.exterior.coords)


def test_dumped_coordinates_have_six_decimals() -> None:
    from shapely.geometry import box, mapping

    geometry = mapping(box(0.1234567, 0, 1, 1))
    text = dump_outline({"type": "Feature", "properties": {}, "geometry": geometry})
    coords = json.loads(text)["geometry"]["coordinates"][0]
    assert all(round(v, 6) == v for point in coords for v in point)
    assert "0.123457" in text


def _cli_catalogue_stubs(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    async def catalogue(timeout_s: float) -> dict[str, Any]:
        return {"indicators": {}}

    async def no_places(timeout_s: float) -> dict[str, Any]:
        return {"generated_at": "x", "places": []}

    (tmp_path / "__init__.py").touch()
    monkeypatch.setattr(cli, "HERE", tmp_path)
    monkeypatch.setattr(cli, "EXAMPLE_FILE", tmp_path / "catalogue.json")
    monkeypatch.setattr(cli, "_sync", catalogue)
    monkeypatch.setattr(cli, "nothing_read", lambda snapshot: False)
    monkeypatch.setattr(cli, "local_document", lambda: None)
    monkeypatch.setattr(cli.local_document, "cache_clear", lambda: None, raising=False)
    monkeypatch.setattr(cli, "exported_catalogue", lambda: {})
    monkeypatch.setattr(cli, "_sync_places", no_places)
    monkeypatch.setattr(places, "__file__", str(tmp_path / "__init__.py"))
    monkeypatch.setattr("sys.argv", ["amazonia360-mcp-catalogue", "sync"])


def test_a_module_sync_that_fails_leaves_the_outline_as_it_was(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    _cli_catalogue_stubs(monkeypatch, tmp_path)
    outline = tmp_path / "module.geojson"
    outline.write_text('{"previous": true}\n', "utf-8")

    async def failing(timeout_s: float) -> dict[str, Any]:
        raise ModuleSyncError("geomorfologia: truncated")

    monkeypatch.setattr(cli, "_sync_module", failing)
    monkeypatch.setattr(aoi, "MODULE_FILE", outline)

    cli.main()

    assert outline.read_text("utf-8") == '{"previous": true}\n'
    assert "left as it was" in capsys.readouterr().out


def test_a_module_sync_writes_the_outline(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from shapely.geometry import box, mapping

    _cli_catalogue_stubs(monkeypatch, tmp_path)
    outline = tmp_path / "module.geojson"

    async def derived(timeout_s: float) -> dict[str, Any]:
        return {
            "type": "Feature",
            "properties": {"area_ha": 1.0},
            "geometry": mapping(box(-78, -1, -77, 0)),
        }

    monkeypatch.setattr(cli, "_sync_module", derived)
    monkeypatch.setattr(aoi, "MODULE_FILE", outline)

    cli.main()

    written = json.loads(outline.read_text("utf-8"))
    assert shape(written["geometry"]).equals(box(-78, -1, -77, 0))
