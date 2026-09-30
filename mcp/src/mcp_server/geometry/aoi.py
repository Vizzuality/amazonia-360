import json
from functools import cache
from pathlib import Path
from typing import Any, Literal

import shapely
from pydantic import BaseModel, Field
from shapely.errors import ShapelyError
from shapely.geometry import MultiPolygon, Polygon, box, shape
from shapely.geometry.base import BaseGeometry
from shapely.validation import explain_validity

from mcp_server.geometry.area import geodesic_area_ha

MAX_VERTICES = 5000

Boundary = Literal["bounding_box", "derived_polygon", "module_polygon"]

# Extent of the Geomorfología layer, which covers the whole module. Only a cheap
# guard on how far a client's area may reach; coverage uses the outline.
MODULE_ENVELOPE = box(-79.428, -5.016, -75.189, 0.729)
# Written by `amazonia360-mcp-catalogue sync` (geometry/module_sync.py). Replace with
# ECU_MOD_POLIG_LIMITE_WGS84 once it is delivered, and the boundary with
# module_polygon.
MODULE_FILE = Path(__file__).with_name("module.geojson")
MODULE_BOUNDARY: Boundary = "derived_polygon"
# How far past the module envelope an area may reach. Enough for an area drawn across
# the border; a country or the globe would pull every feature of a layer, and one
# 180 degrees wide or more measures as 0 ha (pyproj takes the short way round).
MAX_REACH_DEG = 1.0


class AOIError(Exception):
    pass


class Coverage(BaseModel):
    status: Literal["inside", "partial", "outside"] = Field(
        description=(
            "Where the area falls against the module's outline. inside: the whole "
            "area is in the module. partial: part of it is outside the module and "
            "has no data; outside_ha says how much."
        )
    )
    outside_ha: float = Field(
        description=(
            "Hectares of the area outside the module. The module's layers have no "
            "data there: report them as outside the module, never as a class or as "
            "unclassified land of the layer. 0 when status is inside."
        )
    )
    # A bare "provisional" flag was read as "the layer is provisional" in the
    # Desktop trial, so the field names what it describes.
    boundary: Boundary = Field(
        description=(
            "Where the module's outline comes from. This describes the module "
            "boundary, not the layer, and not the area the figures were computed "
            "over. derived_polygon: the server derived the outline from a layer "
            "that covers the whole module, accurate to about 50 m, until the "
            "official module polygon arrives. module_polygon: the official polygon. "
            "bounding_box: a rectangle around the module."
        )
    )


@cache
def module_outline() -> Polygon | MultiPolygon:
    feature = json.loads(MODULE_FILE.read_text(encoding="utf-8"))
    outline = shape(feature["geometry"])
    if not isinstance(outline, Polygon | MultiPolygon) or not outline.is_valid:
        raise ValueError(f"{MODULE_FILE.name} does not hold a valid polygon.")
    # Every call tests an area against it; prepared, contains and intersects are
    # indexed instead of scanning its thousands of vertices.
    shapely.prepare(outline)
    return outline


def vertex_count(geom: BaseGeometry) -> int:
    return int(shapely.get_num_coordinates(geom))


def parse_aoi(geojson: dict[str, Any]) -> Polygon | MultiPolygon:
    try:
        geom = shape(geojson)
    except (AttributeError, KeyError, ShapelyError, TypeError, ValueError) as exc:
        raise AOIError(f"The area is not valid GeoJSON: {exc}") from exc
    return check_aoi(geom)


def check_aoi(
    geom: BaseGeometry,
    *,
    max_vertices: int | None = MAX_VERTICES,
    reach: bool = True,
) -> Polygon | MultiPolygon:
    """The checks every area goes through. max_vertices=None and reach=False for a
    place, whose boundary the server reads itself instead of receiving it from the
    client; a whole province such as Loja reaches past the margin."""
    if not isinstance(geom, Polygon | MultiPolygon):
        raise AOIError(
            f"The area must be a Polygon or MultiPolygon, got {geom.geom_type}."
        )
    if geom.is_empty:
        raise AOIError("The area is empty: it has no coordinates.")
    min_x, min_y, max_x, max_y = geom.bounds
    # Metres from a projected CRS would otherwise pass and read as "outside".
    if min_x < -180 or max_x > 180 or min_y < -90 or max_y > 90:
        raise AOIError(
            "The area's coordinates are out of range for longitude and latitude; "
            "send it in WGS 84 (EPSG:4326)."
        )
    # Counted before the validity check, which is the costly one.
    vertices = vertex_count(geom)
    if max_vertices is not None and vertices > max_vertices:
        raise AOIError(
            f"The area has {vertices} vertices; the limit is {max_vertices}. "
            "Simplify it before sending."
        )
    margin = MODULE_ENVELOPE.buffer(MAX_REACH_DEG, join_style="mitre")
    if reach and not margin.contains(geom) and margin.intersects(geom):
        raise AOIError(
            f"The area reaches more than {MAX_REACH_DEG:g} degree beyond the Ecuador "
            "module. Draw it over the module; the tools have no data outside it."
        )
    if not geom.is_valid:
        raise AOIError(f"The area is not a valid polygon: {explain_validity(geom)}.")
    return geom


def module_coverage(aoi: Polygon | MultiPolygon) -> Coverage:
    outline = module_outline()
    if outline.contains(aoi):
        outside_ha = 0.0
    elif outline.intersects(aoi):
        outside_ha = round(geodesic_area_ha(aoi.difference(outline)), 2)
    else:
        return Coverage(
            status="outside",
            outside_ha=round(geodesic_area_ha(aoi), 2),
            boundary=MODULE_BOUNDARY,
        )
    # Rounded first, so that partial never comes with 0.0 ha outside.
    status = "partial" if outside_ha > 0 else "inside"
    return Coverage(status=status, outside_ha=outside_ha, boundary=MODULE_BOUNDARY)
