from typing import Any, Literal

import shapely
from pydantic import BaseModel
from shapely.geometry import MultiPolygon, Polygon, box, shape
from shapely.geometry.base import BaseGeometry
from shapely.validation import explain_validity

MAX_VERTICES = 5000

# Extent of the Geomorfología layer, which covers the whole module. Replace with
# ECU_MOD_POLIG_LIMITE_WGS84 once it is delivered.
MODULE_ENVELOPE = box(-79.428, -5.016, -75.189, 0.729)
MODULE_BOUNDARY_IS_PROVISIONAL = True


class AOIError(Exception):
    pass


class Coverage(BaseModel):
    status: Literal["inside", "partial", "outside"]
    provisional: bool


def vertex_count(geom: BaseGeometry) -> int:
    return int(shapely.get_num_coordinates(geom))


def parse_aoi(geojson: dict[str, Any]) -> Polygon | MultiPolygon:
    try:
        geom = shape(geojson)
    except (AttributeError, KeyError, TypeError, ValueError) as exc:
        raise AOIError(f"The area is not valid GeoJSON: {exc}") from exc
    if not isinstance(geom, Polygon | MultiPolygon):
        raise AOIError(
            f"The area must be a Polygon or MultiPolygon, got {geom.geom_type}."
        )
    if not geom.is_valid:
        raise AOIError(f"The area is not a valid polygon: {explain_validity(geom)}.")
    vertices = vertex_count(geom)
    if vertices > MAX_VERTICES:
        raise AOIError(
            f"The area has {vertices} vertices; the limit is {MAX_VERTICES}. "
            "Simplify it before sending."
        )
    return geom


def module_coverage(aoi: Polygon | MultiPolygon) -> Coverage:
    if MODULE_ENVELOPE.contains(aoi):
        status = "inside"
    elif MODULE_ENVELOPE.intersects(aoi):
        status = "partial"
    else:
        status = "outside"
    return Coverage(status=status, provisional=MODULE_BOUNDARY_IS_PROVISIONAL)
