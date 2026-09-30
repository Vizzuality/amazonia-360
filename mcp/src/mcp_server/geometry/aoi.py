from typing import Any, Literal

import shapely
from pydantic import BaseModel, Field
from shapely.errors import ShapelyError
from shapely.geometry import MultiPolygon, Polygon, box, shape
from shapely.geometry.base import BaseGeometry
from shapely.validation import explain_validity

MAX_VERTICES = 5000

# Extent of the Geomorfología layer, which covers the whole module. Replace with
# ECU_MOD_POLIG_LIMITE_WGS84 once it is delivered.
MODULE_ENVELOPE = box(-79.428, -5.016, -75.189, 0.729)
MODULE_BOUNDARY: Literal["bounding_box", "module_polygon"] = "bounding_box"
# How far past the module envelope an area may reach. Enough for an area drawn across
# the border; a country or the globe would pull every feature of a layer, and one
# 180 degrees wide or more measures as 0 ha (pyproj takes the short way round).
MAX_REACH_DEG = 1.0


class AOIError(Exception):
    pass


class Coverage(BaseModel):
    status: Literal["inside", "partial", "outside"] = Field(
        description=(
            "Where the area falls against the module boundary named in boundary. "
            "partial: only the part inside has data. With a bounding_box boundary, "
            "inside does not rule out that part of the area is outside the module."
        )
    )
    # A bare "provisional" flag was read as "the layer is provisional" in the
    # Desktop trial, so the field names what it describes.
    boundary: Literal["bounding_box", "module_polygon"] = Field(
        description=(
            "What the area was checked against. This describes the module boundary, "
            "not the layer. bounding_box: a rectangle standing in until the module "
            "polygon is delivered; an area near the edge of the module, such as the "
            "border with Peru, may fall partly outside it although status says "
            "inside, and hectares outside the module then count as unclassified."
        )
    )


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
    if MODULE_ENVELOPE.contains(aoi):
        status = "inside"
    elif MODULE_ENVELOPE.intersects(aoi):
        status = "partial"
    else:
        status = "outside"
    return Coverage(status=status, boundary=MODULE_BOUNDARY)
