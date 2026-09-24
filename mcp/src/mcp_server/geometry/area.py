from collections import defaultdict

import shapely
from pyproj import Geod
from shapely.geometry.base import BaseGeometry
from shapely.validation import make_valid

_GEOD = Geod(ellps="WGS84")
_M2_PER_HA = 10_000


def geodesic_area_ha(geom: BaseGeometry) -> float:
    """Calculate the geodesic area of a geometry in hectares.

    Uses WGS84 ellipsoid for accurate Earth-based measurements.

    pyproj signs each ring's area by its orientation and sums the signed areas, so a
    MultiPolygon whose parts are drawn in opposite directions can measure close to
    zero, and a hole drawn with the same orientation as its shell overcounts instead
    of subtracting. Normalising orientation first (shells CCW, holes CW) makes the
    signed sum equal the true area regardless of how the source drew the rings.

    Args:
        geom: A Shapely geometry object.

    Returns:
        Area in hectares.
    """
    oriented = shapely.orient_polygons(geom)
    area_m2, _ = _GEOD.geometry_area_perimeter(oriented)
    return abs(area_m2) / _M2_PER_HA


def clip_area_by_category(
    aoi: BaseGeometry, features: list[tuple[str, BaseGeometry]]
) -> dict[str, float]:
    """Calculate the total area of each category within an area of interest.

    Clips features to the AOI and handles invalid geometries by repairing them.
    Categories with no overlap are omitted from the result.

    Args:
        aoi: The area of interest geometry.
        features: List of (category_name, geometry) tuples.

    Returns:
        Dictionary mapping category names to areas in hectares.
    """
    totals: dict[str, float] = defaultdict(float)
    for category, geom in features:
        # The consultant's dissolved polygons are not always valid, and an invalid
        # geometry makes intersection raise or return garbage.
        if not geom.is_valid:
            geom = make_valid(geom)
        inside = geom.intersection(aoi)
        if inside.is_empty:
            continue
        totals[category] += geodesic_area_ha(inside)
    return {c: a for c, a in totals.items() if a > 0}
