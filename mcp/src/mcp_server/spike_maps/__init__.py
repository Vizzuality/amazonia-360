"""Spike, kept to repeat it: can an MCP Apps view draw results on a map in Desktop?

Three views: the area on MapLibre, the same on the ArcGIS Maps SDK, and
area_by_category's classes on MapLibre. Each reports what the host's sandbox let it load
to var/map-diagnostics.jsonl. Findings are in
docs/superpowers/evaluations/2026-09-28-mcp-map-spike.md; this is not production code
(it reaches into AreaHandlers and queries ArcGIS twice per map).
"""

import asyncio
import base64
import json
from collections.abc import Callable
from pathlib import Path
from typing import Any, Literal

import httpx
import shapely
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from shapely.geometry import mapping
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError
from mcp_server.geometry.aoi import AOIError, parse_aoi
from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.errors import HandlerError
from mcp_server.handlers.result import Result
from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.stopwatch import Stopwatch
from mcp_server.spike_maps.raster import RASTERS, area_image, class_pixels
from mcp_server.spike_maps.styles import category_styles, join_field
from mcp_server.tools.area import Area, IndicatorId

_HERE = Path(__file__).parent
_MIME = "text/html;profile=mcp-app"
_OSM = "https://tile.openstreetmap.org"
# A light grey vector basemap with no key, close to the front end's Esri gray-vector.
_OPENFREEMAP = "https://tiles.openfreemap.org"
_JSDELIVR = "https://cdn.jsdelivr.net"

_VIEWS: dict[str, dict[str, Any]] = {
    "maplibre": {
        "resourceDomains": [_JSDELIVR, _OPENFREEMAP],
        "connectDomains": [_JSDELIVR, _OPENFREEMAP],
    },
    "arcgis": {
        "resourceDomains": ["https://js.arcgis.com", _JSDELIVR, _OSM],
        "connectDomains": [
            "https://js.arcgis.com",
            "https://*.arcgis.com",
            _JSDELIVR,
            _OSM,
        ],
    },
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


def _page(library: str) -> str:
    theme = (_HERE / "theme.css").read_text().replace("/*FONTS*/", _fonts())
    parts = {
        "/*THEME*/": theme,
        "/*DIAGNOSTICS*/": (_HERE / "diagnostics.js").read_text(),
        "/*BRIDGE*/": (_HERE / "bridge.js").read_text(),
    }
    html = (_HERE / f"{library}.html").read_text()
    for marker, text in parts.items():
        html = html.replace(marker, text)
    return html


def _view(library: str) -> Callable[[], str]:
    # A static resource takes no parameters, so each view closes over its library.
    def view() -> str:
        return _page(library)

    return view


def _clipped_shapes(
    aoi: BaseGeometry, features: list[tuple[str, BaseGeometry]]
) -> tuple[list[dict[str, Any]], int]:
    # The same repair and intersection as clip_area_by_category, keeping the shapes.
    out: list[dict[str, Any]] = []
    vertices = 0
    for category, geom in features:
        if not geom.is_valid:
            geom = shapely.make_valid(geom, method="structure", keep_collapsed=False)
        inside = geom.intersection(aoi)
        polygons = [
            g
            for g in shapely.get_parts(inside)
            if g.geom_type in ("Polygon", "MultiPolygon")
        ]
        if not polygons:
            continue
        shape = shapely.set_precision(shapely.union_all(polygons), 1e-6)
        vertices += int(shapely.get_num_coordinates(shape))
        out.append(
            {
                "type": "Feature",
                "properties": {"category": category},
                "geometry": mapping(shape),
            }
        )
    return out, vertices


def register_map_spike(
    server: MCPServer, handlers: AreaHandlers, log_path: Path
) -> None:
    log = CallLog(log_path)
    renderers: dict[int, dict[str, Any] | None] = {}

    for library, csp in _VIEWS.items():
        uri = f"ui://amazonia360/spike/{library}.html"

        server.resource(
            uri, name=f"map-spike-{library}", mime_type=_MIME, meta={"ui": {"csp": csp}}
        )(_view(library))

        async def show(area: Area) -> str:
            return "The area is drawn on a map shown to the user."

        server.add_tool(
            show,
            name=f"show_area_map_{library}",
            description=(
                f"Spike: draws the area on a map ({library}) shown to the user. "
                "Use only when the user asks for this map."
            ),
            meta={"ui": {"resourceUri": uri}},
        )

    categories_uri = "ui://amazonia360/spike/categories.html"
    server.resource(
        categories_uri,
        name="map-spike-categories",
        mime_type=_MIME,
        meta={"ui": {"csp": _VIEWS["maplibre"]}},
    )(_view("categories"))

    async def show_area_by_category_map(
        indicator_id: IndicatorId, area: Area
    ) -> Result:
        """Spike: area_by_category, with the classes drawn on a map."""
        try:
            return await handlers.area_by_category(indicator_id, area)
        except HandlerError as exc:
            raise ToolError(str(exc)) from exc

    server.add_tool(
        show_area_by_category_map,
        description=(
            "Spike: the same figures as area_by_category, with the classes drawn on a "
            "map shown to the user. Use only when the user asks for this map."
        ),
        meta={"ui": {"resourceUri": categories_uri}},
    )

    async def category_shapes(indicator_id: IndicatorId, area: Area) -> dict[str, Any]:
        watch = Stopwatch()
        try:
            p = handlers._prepare(indicator_id, area, "area")  # pyright: ignore[reportPrivateUsage]
            with watch.lap("arcgis"):
                features = await handlers._call(  # pyright: ignore[reportPrivateUsage]
                    handlers._client.features(  # pyright: ignore[reportPrivateUsage]
                        p.layer,
                        p.aoi,
                        handlers._simplification,  # pyright: ignore[reportPrivateUsage]
                    )
                )
        except HandlerError as exc:
            raise ToolError(str(exc)) from exc
        with watch.lap("clip"):
            shapes, vertices = await asyncio.to_thread(_clipped_shapes, p.aoi, features)
        categories = sorted({f["properties"]["category"] for f in shapes})
        with watch.lap("styles"):
            try:
                # Renderers change with a republish, not between calls.
                if indicator_id not in renderers:
                    renderers[indicator_id] = await handlers._client.renderer(p.layer)  # pyright: ignore[reportPrivateUsage]
                renderer = renderers[indicator_id]
                field = join_field(renderer, p.layer.category_field, categories)
                pairs = (
                    await handlers._client.value_pairs(p.layer, p.aoi, field)  # pyright: ignore[reportPrivateUsage]
                    if field
                    else None
                )
            except ArcGISError:
                # Colours are not worth failing the map over.
                renderer, pairs = None, None
            styles = category_styles(
                renderer, p.layer.category_field, categories, pairs
            )
        collection = {"type": "FeatureCollection", "features": shapes}
        return {
            "shapes": collection,
            "styles": styles,
            "timing": {
                "arcgis_ms": watch.ms("arcgis"),
                "clip_ms": watch.ms("clip"),
                "styles_ms": watch.ms("styles"),
                "bytes": len(json.dumps(collection)),
                "vertices": vertices,
            },
        }

    server.add_tool(
        category_shapes,
        description="Spike: called by the map view for the clipped polygons it draws.",
        meta={"ui": {"visibility": ["app"]}},
    )

    _register_raster(server)

    async def report_map_diagnostics(report: dict[str, Any]) -> str:
        log.write(report)
        return "recorded"

    server.add_tool(
        report_map_diagnostics,
        description="Spike: called by the map view to record what loaded.",
        meta={"ui": {"visibility": ["app"]}},
    )


def _register_raster(server: MCPServer) -> None:
    raster_uri = "ui://amazonia360/spike/raster.html"
    server.resource(
        raster_uri,
        name="map-spike-raster",
        mime_type=_MIME,
        meta={"ui": {"csp": _VIEWS["maplibre"]}},
    )(_view("raster"))
    raster_http = httpx.AsyncClient(timeout=65)

    def _raster_aoi(area: dict[str, Any]) -> BaseGeometry:
        try:
            return parse_aoi(area)
        except AOIError as exc:
            raise ToolError(str(exc)) from exc

    async def show_raster_map(
        raster: Literal["canopy_height"], area: Area
    ) -> dict[str, Any]:
        """Spike: share of the area's pixels in each class of a regional raster."""
        spec = RASTERS[raster]
        aoi = _raster_aoi(area)
        watch = Stopwatch()
        try:
            with watch.lap("arcgis"):
                pixels = await class_pixels(raster_http, spec, aoi)
        except ArcGISError as exc:
            raise ToolError(str(exc)) from exc
        total = sum(pixels)
        return {
            "raster": spec["name"],
            "classes": [
                {
                    "label": item["label"],
                    "color": item["color"],
                    "pixels": n,
                    "share": round(n / total, 4) if total else 0,
                }
                for item, n in zip(spec["legend"], pixels, strict=True)
            ],
            "pixels": total,
            "note": (
                "Shares of the image server's pixels counted inside the area, about 1 "
                "km each; an area of a few km has only a few pixels."
            ),
            "timing": {"arcgis_ms": watch.ms("arcgis")},
        }

    server.add_tool(
        show_raster_map,
        description=(
            "Spike: draws a regional raster over the area on a map shown to the user, "
            "with the share of the area's pixels in each class. Use only when the user "
            "asks for this map."
        ),
        meta={"ui": {"resourceUri": raster_uri}},
    )

    async def raster_image(
        raster: Literal["canopy_height"], area: Area
    ) -> dict[str, Any]:
        spec = RASTERS[raster]
        aoi = _raster_aoi(area)
        watch = Stopwatch()
        try:
            with watch.lap("arcgis"):
                image = await area_image(raster_http, spec, aoi)
        except ArcGISError as exc:
            raise ToolError(str(exc)) from exc
        return {**image, "timing": {"arcgis_ms": watch.ms("arcgis")}}

    server.add_tool(
        raster_image,
        description="Spike: called by the map view for the raster image it draws.",
        meta={"ui": {"visibility": ["app"]}},
    )
