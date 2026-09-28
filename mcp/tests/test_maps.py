import base64
from pathlib import Path
from typing import Any

import httpx
import pytest
from mcp import Client
from mcp.server.mcpserver import MCPServer
from mcp.types import TextResourceContents

from mcp_server.handlers.area import AreaHandlers
from mcp_server.maps import CATEGORIES_URI, RASTER_URI, register_map_tools
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server
from tests.test_handlers import TENA, FakeClient

pytestmark = pytest.mark.usefixtures("fixed_catalogue")

VIEWS = {"map_area_by_category": CATEGORIES_URI, "map_raster": RASTER_URI}


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
            for marker in ("/*THEME*/", "/*COMMON*/", "/*BRIDGE*/", "/*FONTS*/"):
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
async def test_the_raster_map_counts_and_draws_from_one_call(tmp_path: Path) -> None:
    png = b"\x89PNG\r\n\x1a\n"

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/computeHistograms"):
            histogram = {
                "size": 6,
                "min": -0.5,
                "max": 5.5,
                "counts": [0, 1, 1, 2, 0, 0],
            }
            return httpx.Response(200, json={"histograms": [histogram]})
        return httpx.Response(200, content=png, headers={"content-type": "image/png"})

    mcp_server = MCPServer(name="t")
    register_map_tools(
        mcp_server,
        AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        CallLog(tmp_path / "calls.jsonl"),
        httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "map_raster", {"raster": "canopy_height", "area": TENA}
        )
    assert result.structured_content is not None
    shares = [c["share"] for c in result.structured_content["classes"]]
    assert shares == [0.25, 0.25, 0.5, 0, 0]
    assert result.meta is not None
    image = result.meta["map"]["image"]
    assert base64.b64decode(image.split(",", 1)[1]) == png
    assert len(result.meta["map"]["corners"]) == 4
