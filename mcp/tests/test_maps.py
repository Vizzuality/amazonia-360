import base64
from pathlib import Path
from typing import Any

import pytest
from mcp import Client
from mcp.types import TextResourceContents

from mcp_server.handlers.area import AreaHandlers
from mcp_server.maps import CATEGORIES_URI, RASTER_URI
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server
from tests.test_handlers import TENA, FakeClient

pytestmark = pytest.mark.usefixtures("fixed_catalogue")

VIEWS = {
    "map_area_by_category": CATEGORIES_URI,
    "map_class_shares_in_area": RASTER_URI,
}


def server(tmp_path: Path) -> Any:
    return create_mcp_server(
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )


@pytest.mark.anyio
async def test_each_map_tool_points_at_its_view(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        tools = {t.name: t for t in (await client.list_tools()).tools}
    for name, uri in VIEWS.items():
        assert tools[name].meta == {"ui": {"resourceUri": uri}}
    assert (
        tools["map_area_by_category"].output_schema
        == tools["area_by_category"].output_schema
    )


@pytest.mark.anyio
async def test_each_view_is_a_complete_page_with_its_csp(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        for uri in VIEWS.values():
            content = (await client.read_resource(uri)).contents[0]
            assert isinstance(content, TextResourceContents)
            assert content.mime_type == "text/html;profile=mcp-app"
            assert content.meta is not None
            domains = content.meta["ui"]["csp"]["resourceDomains"]
            assert "https://tiles.openfreemap.org" in domains
            for marker in (
                "/*THEME*/",
                "/*LEGEND*/",
                "/*COMMON*/",
                "/*BRIDGE*/",
                "/*FONTS*/",
            ):
                assert marker not in content.text


@pytest.mark.anyio
async def test_the_map_tool_answers_what_area_by_category_answers(
    tmp_path: Path,
) -> None:
    async with Client(server(tmp_path)) as client:
        args = {"indicator_id": 210, "area": TENA}
        plain = await client.call_tool("area_by_category", args)
        mapped = await client.call_tool("map_area_by_category", args)
    assert plain.structured_content is not None
    assert mapped.structured_content is not None
    for key in ("value", "aoi_ha", "coverage", "caveats", "provenance"):
        assert mapped.structured_content[key] == plain.structured_content[key]
    # The shapes are for the page, not for the model.
    assert "shapes" not in mapped.content[0].text  # type: ignore[union-attr]
    assert mapped.meta is not None
    drawn = mapped.meta["map"]
    assert drawn["shapes"]["type"] == "FeatureCollection"
    assert set(drawn["styles"]) == {"Bosque"}
    logged = (tmp_path / "calls.jsonl").read_text()
    assert '"tool": "map_area_by_category"' in logged


@pytest.mark.anyio
async def test_the_raster_map_answers_what_class_shares_in_area_answers(
    tmp_path: Path,
) -> None:
    async with Client(server(tmp_path)) as client:
        args = {"indicator_id": 129, "area": TENA}
        plain = await client.call_tool("class_shares_in_area", args)
        mapped = await client.call_tool("map_class_shares_in_area", args)
    assert plain.structured_content is not None
    assert mapped.structured_content is not None
    assert mapped.structured_content["value"] == plain.structured_content["value"]
    assert mapped.meta is not None
    drawn = mapped.meta["map"]
    assert base64.b64decode(drawn["image"].split(",", 1)[1]) == b"\x89PNG"
    assert drawn["name"] == "Canopy height"
    assert "image" not in mapped.content[0].text  # type: ignore[union-attr]


@pytest.mark.anyio
async def test_shapes_too_large_for_the_page_are_left_out_with_their_size(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from mcp_server import maps

    monkeypatch.setattr(maps, "MAX_SHAPES_BYTES", 10)
    async with Client(server(tmp_path)) as client:
        mapped = await client.call_tool(
            "map_area_by_category", {"indicator_id": 210, "area": TENA}
        )
    assert mapped.meta is not None
    drawn = mapped.meta["map"]
    assert "shapes" not in drawn
    assert drawn["shapes_omitted_bytes"] > 10
    # The legend still has its colours.
    assert set(drawn["styles"]) == {"Bosque"}
