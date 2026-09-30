"""Derives the module's outline from a layer that covers the module wall to wall.

Run by ``amazonia360-mcp-catalogue sync``. As with the places, one page that cannot be
read fails the step, and the previous outline stays.
"""

import json
from datetime import UTC, datetime
from typing import Any

import httpx
import shapely
from shapely.errors import ShapelyError
from shapely.geometry import MultiPolygon, Polygon, mapping
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.esri_json import polygon_from_rings
from mcp_server.catalogue.models import Layer
from mcp_server.geometry.area import geodesic_area_ha

# Measured on 30 Sep 2026: the six layers that cover the module wall to wall (204,
# 209, 211, 217, 218, 219) give the same outline within 0.02-0.17 %. Geomorphology
# gives one polygon with no holes, 13,141,039 ha, and is closest to the others
# (2.8 k ha from 217 and 218).
MODULE_SOURCE_INDICATOR = 211
# About 50 m: 44,508 vertices become 8,572, and the outline moves by 2,560 ha.
SIMPLIFY_TOLERANCE_DEG = 0.0005
PRECISION_DEG = 1e-6
MAX_PAGES = 50


class ModuleSyncError(Exception):
    pass


async def _shapes(http: httpx.AsyncClient, layer: Layer) -> list[BaseGeometry]:
    url = f"{layer.service_url}/{layer.layer_id}/query"
    shapes: list[BaseGeometry] = []
    first_ids: set[Any] = set()
    for _ in range(MAX_PAGES):
        response = await http.post(
            url,
            data={
                "where": "1=1",
                "returnGeometry": "true",
                "outSR": "4326",
                "resultOffset": str(len(shapes)),
                # Not geojson: ArcGIS Online's GeoJSON turns holes into shells.
                "f": "json",
            },
        )
        response.raise_for_status()
        body = response.json()
        if "error" in body or "features" not in body:
            raise ModuleSyncError(f"{url}: {body}")
        page = body["features"]
        shapes.extend(
            polygon_from_rings(f["geometry"]["rings"])
            for f in page
            if f.get("geometry") is not None
        )
        if not body.get("exceededTransferLimit"):
            return shapes
        if not page:
            raise ModuleSyncError(f"{url}: truncated but returned no features")
        first = page[0]["attributes"].get(body.get("objectIdFieldName"))
        if first in first_ids:
            raise ModuleSyncError(f"{url}: the service repeats a page")
        first_ids.add(first)
    raise ModuleSyncError(f"{url}: more than {MAX_PAGES} pages")


def _polygonal(geom: BaseGeometry) -> Polygon | MultiPolygon:
    parts = [
        p
        for p in shapely.get_parts(shapely.get_parts(geom))
        if isinstance(p, Polygon) and not p.is_empty
    ]
    if not parts:
        raise ModuleSyncError("the layer has no area")
    return parts[0] if len(parts) == 1 else MultiPolygon(parts)


def derive_outline(shapes: list[BaseGeometry]) -> Polygon | MultiPolygon:
    """The union of the shapes, repaired, simplified and snapped to 1e-6 degrees."""
    union = _polygonal(shapely.make_valid(shapely.union_all(shapes)))
    simplified = union.simplify(SIMPLIFY_TOLERANCE_DEG, preserve_topology=True)
    # set_precision keeps the result valid, which rounding the numbers would not.
    return _polygonal(shapely.set_precision(simplified, PRECISION_DEG))


async def sync_module(
    http: httpx.AsyncClient, layer: Layer, now: datetime
) -> dict[str, Any]:
    try:
        outline = derive_outline(await _shapes(http, layer))
    except (
        httpx.HTTPError,
        AttributeError,
        KeyError,
        ShapelyError,
        TypeError,
        ValueError,
    ) as exc:
        raise ModuleSyncError(str(exc)) from exc
    stamp = now.astimezone(UTC).isoformat().replace("+00:00", "Z")
    return {
        "type": "Feature",
        "properties": {
            "source": f"{layer.service_url}/{layer.layer_id}",
            "indicator_id": MODULE_SOURCE_INDICATOR,
            "simplify_tolerance_deg": SIMPLIFY_TOLERANCE_DEG,
            "area_ha": round(geodesic_area_ha(outline), 1),
            "generated_at": stamp,
        },
        "geometry": mapping(outline),
    }


def _rounded(value: Any) -> Any:
    if isinstance(value, float):
        return round(value, 6)
    if isinstance(value, list | tuple):
        return [_rounded(v) for v in value]
    return value


def dump_outline(feature: dict[str, Any]) -> str:
    # Compact: indented, the outline's 8.5 k vertices would take 34 k lines.
    geometry = feature["geometry"]
    geometry = {**geometry, "coordinates": _rounded(geometry["coordinates"])}
    text = json.dumps(
        {**feature, "geometry": geometry}, ensure_ascii=False, separators=(",", ":")
    )
    return text + "\n"
