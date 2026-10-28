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
from mcp.server.mcpserver import Context, MCPServer
from mcp.types import CallToolResult, TextContent
from pydantic import BaseModel

from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.result import Result
from mcp_server.maps.encoding import BUDGET_BYTES, fit, grid_for, side_of
from mcp_server.measurement.call_log import CallLog
from mcp_server.tools.area import QUERY, Area, IndicatorId, PlaceId, logged_call

_HERE = Path(__file__).parent
MIME = "text/html;profile=mcp-app"
CATEGORIES_URI = "ui://amazonia360/maps/categories.html"
RASTER_URI = "ui://amazonia360/maps/raster.html"
# A light grey vector basemap with no key, close to the front end's Esri gray-vector.
# Chosen over Esri's own style, which needs a key in the page; see the evaluation.
_OPENFREEMAP = "https://tiles.openfreemap.org"
_JSDELIVR = "https://cdn.jsdelivr.net"
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


def shapes_room(result: CallToolResult) -> int:
    """What the shapes may take: the budget less the result built without them."""
    # The key that will hold them, with its quotes and separators.
    return BUDGET_BYTES - len(result.model_dump_json(by_alias=True)) - len('"shapes":,')


def fitted_meta(
    result: BaseModel, meta: dict[str, Any], collections: dict[str, Any]
) -> dict[str, Any]:
    """`meta` with each layer's shapes encoded and fitted to what the budget leaves.

    `collections` maps a key of `meta` (or "" for `meta` itself) to that layer's
    GeoJSON shapes. Each layer gets `shapes` or `shapes_omitted_bytes`, and
    `simplified`."""
    area = meta["area"]
    grid = grid_for(area)
    meta = {**meta, "grid": grid.to_json()}
    room = shapes_room(_tool_result(result, meta)) - 40 * len(collections)
    fitted = fit(list(collections.values()), grid, side_of(area), room)
    for key, layer in zip(collections, fitted, strict=True):
        target = meta if key == "" else meta[key]
        target["simplified"] = layer.simplified
        if layer.shapes is None:
            target["shapes_omitted_bytes"] = layer.omitted_bytes
        else:
            target["shapes"] = layer.shapes
    return meta


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
        indicator_id: IndicatorId,
        ctx: Context,
        area: Area = None,
        place_id: PlaceId = None,
    ) -> Annotated[CallToolResult, Result]:
        """The same figures as area_by_category, from the same query, with the classes
        drawn on an interactive map shown to the user.

        Use it instead of area_by_category when the user asks to see the result on a
        map. As slow as area_by_category. Hosts that do not show maps get the figures
        alone.

        The user sees the map and you do not: never describe it or say that you cannot
        see it. The answer still needs the figures; comment on them.
        """
        result, drawn = await logged_call(
            call_log,
            "map_area_by_category",
            indicator_id,
            handlers.area_by_category_map(indicator_id, area, place_id=place_id),
            lambda out: out[0],
            place_id,
            ctx,
        )
        # The colours stay either way: the legend needs them.
        meta: dict[str, Any] = {"area": drawn.area, "styles": drawn.styles}
        return _tool_result(result, fitted_meta(result, meta, {"": drawn.shapes}))

    server.add_tool(
        map_area_by_category,
        annotations=QUERY,
        meta={"ui": {"resourceUri": CATEGORIES_URI}},
    )

    async def map_class_shares_in_area(
        indicator_id: IndicatorId,
        ctx: Context,
        area: Area = None,
        place_id: PlaceId = None,
    ) -> Annotated[CallToolResult, Result]:
        """The same shares as class_shares_in_area, with the raster drawn over the
        area on a map shown to the user.

        Use it instead of class_shares_in_area when the user asks to see the result
        on a map. Hosts that do not show maps get the shares alone.

        The user sees the map and you do not: never describe it or say that you cannot
        see it. The answer still needs the figures; comment on them.
        """
        result, drawn = await logged_call(
            call_log,
            "map_class_shares_in_area",
            indicator_id,
            handlers.class_shares_map(indicator_id, area, place_id=place_id),
            lambda out: out[0],
            place_id,
            ctx,
        )
        return _tool_result(result, asdict(drawn))

    server.add_tool(
        map_class_shares_in_area,
        annotations=QUERY,
        meta={"ui": {"resourceUri": RASTER_URI}},
    )
