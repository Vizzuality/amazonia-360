from pathlib import Path
from typing import Any

import pytest
from mcp import Client
from mcp.types import TextResourceContents

from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server
from tests.test_handlers import FakeClient

pytestmark = pytest.mark.usefixtures("fixed_catalogue")

VIEWS = {
    "show_area_map_maplibre": "ui://amazonia360/spike/maplibre.html",
    "show_area_map_arcgis": "ui://amazonia360/spike/arcgis.html",
    "show_area_by_category_map": "ui://amazonia360/spike/categories.html",
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
    for name in ("category_shapes", "report_map_diagnostics"):
        assert tools[name].meta == {"ui": {"visibility": ["app"]}}


@pytest.mark.anyio
async def test_each_view_is_a_complete_page_with_its_csp(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        for uri in VIEWS.values():
            content = (await client.read_resource(uri)).contents[0]
            assert isinstance(content, TextResourceContents)
            assert content.mime_type == "text/html;profile=mcp-app"
            assert content.meta is not None
            basemap = (
                "https://tile.openstreetmap.org"
                if "arcgis" in uri
                else "https://tiles.openfreemap.org"
            )
            assert basemap in content.meta["ui"]["csp"]["resourceDomains"]
            assert "/*DIAGNOSTICS*/" not in content.text
            assert "/*BRIDGE*/" not in content.text
            assert "/*THEME*/" not in content.text
