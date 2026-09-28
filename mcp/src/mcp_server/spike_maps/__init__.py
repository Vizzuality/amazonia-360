"""Spike, kept to repeat it: can an MCP Apps view draw results on a map in Desktop?

Registered only with MCP_MAP_SPIKE=1. Three views: the area on MapLibre, the same on
the ArcGIS Maps SDK, and area_by_category's classes on MapLibre. Each reports what the
host's sandbox let it load to var/map-diagnostics.jsonl. Findings are in
docs/superpowers/evaluations/2026-09-28-mcp-map-spike.md; this is not production code
(it reaches into AreaHandlers and queries ArcGIS twice per map).
"""

import asyncio
import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import shapely
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from shapely.geometry import mapping
from shapely.geometry.base import BaseGeometry

from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.errors import HandlerError
from mcp_server.handlers.result import Result
from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.stopwatch import Stopwatch
from mcp_server.tools.area import Area, IndicatorId

_HERE = Path(__file__).parent
_MIME = "text/html;profile=mcp-app"
_OSM = "https://tile.openstreetmap.org"
_JSDELIVR = "https://cdn.jsdelivr.net"

_VIEWS: dict[str, dict[str, Any]] = {
    "maplibre": {
        "resourceDomains": [_JSDELIVR, _OSM],
        "connectDomains": [_JSDELIVR, _OSM],
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


def _page(library: str) -> str:
    html = (_HERE / f"{library}.html").read_text()
    return html.replace(
        "/*DIAGNOSTICS*/", (_HERE / "diagnostics.js").read_text()
    ).replace("/*BRIDGE*/", (_HERE / "bridge.js").read_text())


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
        collection = {"type": "FeatureCollection", "features": shapes}
        return {
            "shapes": collection,
            "timing": {
                "arcgis_ms": watch.ms("arcgis"),
                "clip_ms": watch.ms("clip"),
                "bytes": len(json.dumps(collection)),
                "vertices": vertices,
            },
        }

    server.add_tool(
        category_shapes,
        description="Spike: called by the map view for the clipped polygons it draws.",
        meta={"ui": {"visibility": ["app"]}},
    )

    async def report_map_diagnostics(report: dict[str, Any]) -> str:
        log.write(report)
        return "recorded"

    server.add_tool(
        report_map_diagnostics,
        description="Spike: called by the map view to record what loaded.",
        meta={"ui": {"visibility": ["app"]}},
    )
