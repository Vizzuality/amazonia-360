"""Results drawn on a map, as MCP Apps views: a page the host shows next to the answer.

Each map tool returns what its plain counterpart returns, so a host that does not show
views still gets the figures. What only the page needs (the clipped shapes, the raster
image) goes in the result's _meta, which the host hands to the page and not to the
model. The pages use MapLibre and the front end's look; the evaluation that led here is
docs/superpowers/evaluations/2026-09-28-mcp-map-spike.md.
"""

import asyncio
import base64
from collections.abc import Callable
from pathlib import Path
from typing import Annotated, Any, Literal

import httpx
import pydantic_core
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import CallToolResult, TextContent
from pydantic import BaseModel, Field

from mcp_server.arcgis.client import ArcGISError
from mcp_server.arcgis.raster import RASTERS, area_image, class_pixels
from mcp_server.geometry.aoi import AOIError, parse_aoi
from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.result import Result
from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.stopwatch import Stopwatch
from mcp_server.tools.area import QUERY, Area, IndicatorId, logged_call

_HERE = Path(__file__).parent
MIME = "text/html;profile=mcp-app"
CATEGORIES_URI = "ui://amazonia360/maps/categories.html"
RASTER_URI = "ui://amazonia360/maps/raster.html"
# A light grey vector basemap with no key, close to the front end's Esri gray-vector.
# A third-party service: see "What staging needs first" in the evaluation.
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


class RasterClass(BaseModel):
    label: str
    color: str
    pixels: int
    share: float = Field(description="Share of the area's pixels, from 0 to 1.")


class RasterResult(BaseModel):
    raster: str
    classes: list[RasterClass]
    pixels: int = Field(description="Pixels of the raster counted inside the area.")
    note: str
    timing: dict[str, int]


def register_map_tools(
    server: MCPServer,
    handlers: AreaHandlers,
    call_log: CallLog,
    raster_http: httpx.AsyncClient,
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
        return _tool_result(result, {"shapes": drawn.shapes, "styles": drawn.styles})

    server.add_tool(
        map_area_by_category,
        annotations=QUERY,
        meta={"ui": {"resourceUri": CATEGORIES_URI}},
    )

    async def map_raster(
        raster: Literal["canopy_height"], area: Area
    ) -> Annotated[CallToolResult, RasterResult]:
        """Share of the area's pixels in each class of a regional raster, drawn over
        the area on a map shown to the user.

        Only canopy_height for now, as the front end classes it. Hosts that do not
        show maps get the shares alone.
        """
        spec = RASTERS[raster]
        try:
            aoi = parse_aoi(area)
        except AOIError as exc:
            raise ToolError(str(exc)) from exc
        watch = Stopwatch()
        try:
            with watch.lap("arcgis"):
                pixels, image = await asyncio.gather(
                    class_pixels(raster_http, spec, aoi),
                    area_image(raster_http, spec, aoi),
                )
        except ArcGISError as exc:
            raise ToolError(str(exc)) from exc
        total = sum(pixels)
        result = RasterResult(
            raster=spec["name"],
            classes=[
                RasterClass(
                    label=item["label"],
                    color=item["color"],
                    pixels=n,
                    share=round(n / total, 4) if total else 0,
                )
                for item, n in zip(spec["legend"], pixels, strict=True)
            ],
            pixels=total,
            note=(
                "Shares of the image server's pixels counted inside the area, about 1 "
                "km each; an area of a few km has only a few pixels."
            ),
            timing={"arcgis_ms": watch.ms("arcgis"), "image_bytes": image["bytes"]},
        )
        return _tool_result(
            result, {"image": image["image"], "corners": image["corners"]}
        )

    server.add_tool(
        map_raster,
        annotations=QUERY,
        meta={"ui": {"resourceUri": RASTER_URI}},
    )
