"""Results drawn on a map, as MCP Apps views: a page the host shows next to the answer.

Each map tool returns what its plain counterpart returns, so a host that does not show
views still gets the figures. What only the page needs (the clipped shapes, the raster
image) goes in the result's _meta, which the host hands to the page and not to the
model. The pages use MapLibre and the front end's look; the evaluation that led here is
docs/superpowers/evaluations/2026-09-28-mcp-map-spike.md.
"""

import base64
from collections.abc import Callable
from dataclasses import asdict
from pathlib import Path
from typing import Annotated, Any

import pydantic_core
from mcp.server.mcpserver import MCPServer
from mcp.types import CallToolResult, TextContent
from pydantic import BaseModel

from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.result import Result
from mcp_server.measurement.call_log import CallLog
from mcp_server.tools.area import QUERY, Area, IndicatorId, logged_call

_HERE = Path(__file__).parent
MIME = "text/html;profile=mcp-app"
CATEGORIES_URI = "ui://amazonia360/maps/categories.html"
RASTER_URI = "ui://amazonia360/maps/raster.html"
# A light grey vector basemap with no key, close to the front end's Esri gray-vector.
# Chosen over Esri's own style, which needs a key in the page; see the evaluation.
_OPENFREEMAP = "https://tiles.openfreemap.org"
_JSDELIVR = "https://cdn.jsdelivr.net"
# About 50 times a 20 km box on the densest layer tried (82 KB on 214). Past it the
# page shows the figures and says the shapes were left out.
MAX_SHAPES_BYTES = 4_000_000
CSP = {
    "resourceDomains": [_JSDELIVR, _OPENFREEMAP],
    "connectDomains": [_JSDELIVR, _OPENFREEMAP],
}


def _fonts() -> str:
    # Embedded, so the page needs no font domain in its CSP.
    faces = []
    for weight in (500, 600, 700):
        data = (
            _HERE / "fonts" / f"montserrat-latin-{weight}-normal.woff2"
        ).read_bytes()
        faces.append(
            "@font-face { font-family: 'Montserrat'; font-style: normal; "
            f"font-weight: {weight}; font-display: swap; src: url("
            f"data:font/woff2;base64,{base64.b64encode(data).decode()}) "
            "format('woff2'); }"
        )
    return "\n".join(faces)


def page(name: str) -> str:
    theme = (_HERE / "theme.css").read_text().replace("/*FONTS*/", _fonts())
    html = (_HERE / f"{name}.html").read_text()
    parts = {
        "/*THEME*/": theme,
        "/*LEGEND*/": (_HERE / "legend.css").read_text(),
        "/*COMMON*/": (_HERE / "common.js").read_text(),
        "/*BRIDGE*/": (_HERE / "bridge.js").read_text(),
    }
    for marker, text in parts.items():
        html = html.replace(marker, text)
    return html


def _view(name: str) -> Callable[[], str]:
    # A static resource takes no parameters, so each view closes over its page.
    def view() -> str:
        return page(name)

    return view


def _tool_result(structured: BaseModel, meta: dict[str, Any]) -> CallToolResult:
    # The same text a plain tool returns, so the model reads the same answer.
    text = pydantic_core.to_json(structured, indent=2).decode()
    return CallToolResult(
        content=[TextContent(type="text", text=text)],
        structured_content=structured.model_dump(mode="json"),
        _meta={"map": meta},
    )


def register_map_tools(
    server: MCPServer,
    handlers: AreaHandlers,
    call_log: CallLog,
) -> None:
    for uri, name in ((CATEGORIES_URI, "categories"), (RASTER_URI, "raster")):
        server.resource(
            uri, name=f"map-{name}", mime_type=MIME, meta={"ui": {"csp": CSP}}
        )(_view(name))

    async def map_area_by_category(
        indicator_id: IndicatorId, area: Area
    ) -> Annotated[CallToolResult, Result]:
        """The same figures as area_by_category, from the same query, with the classes
        drawn on an interactive map shown to the user.

        Use it instead of area_by_category when the user asks to see the result on a
        map. As slow as area_by_category. Hosts that do not show maps get the figures
        alone.
        """
        result, drawn = await logged_call(
            call_log,
            "map_area_by_category",
            indicator_id,
            handlers.area_by_category_map(indicator_id, area),
            lambda out: out[0],
        )
        size = len(pydantic_core.to_json(drawn.shapes))
        # The colours stay either way: the legend needs them.
        meta: dict[str, Any] = {"styles": drawn.styles}
        if size > MAX_SHAPES_BYTES:
            meta["shapes_omitted_bytes"] = size
        else:
            meta["shapes"] = drawn.shapes
        return _tool_result(result, meta)

    server.add_tool(
        map_area_by_category,
        annotations=QUERY,
        meta={"ui": {"resourceUri": CATEGORIES_URI}},
    )

    async def map_class_shares_in_area(
        indicator_id: IndicatorId, area: Area
    ) -> Annotated[CallToolResult, Result]:
        """The same shares as class_shares_in_area, with the raster drawn over the
        area on a map shown to the user.

        Use it instead of class_shares_in_area when the user asks to see the result
        on a map. Hosts that do not show maps get the shares alone.
        """
        result, drawn = await logged_call(
            call_log,
            "map_class_shares_in_area",
            indicator_id,
            handlers.class_shares_map(indicator_id, area),
            lambda out: out[0],
        )
        return _tool_result(result, asdict(drawn))

    server.add_tool(
        map_class_shares_in_area,
        annotations=QUERY,
        meta={"ui": {"resourceUri": RASTER_URI}},
    )
