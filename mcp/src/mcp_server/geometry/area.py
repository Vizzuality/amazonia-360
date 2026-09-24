from collections import defaultdict

import shapely
from pyproj import Geod
from shapely.geometry.base import BaseGeometry

_GEOD = Geod(ellps="WGS84")
_M2_PER_HA = 10_000


def geodesic_area_ha(geom: BaseGeometry) -> float:
    """Geodesic area on the WGS84 ellipsoid, in hectares.

    pyproj signs each ring's area by its orientation and sums the signed areas, so a
    MultiPolygon whose parts are drawn in opposite directions can measure close to
    zero, and a hole drawn with the same orientation as its shell overcounts instead
    of subtracting. Normalising orientation first (shells CCW, holes CW) makes the
    signed sum equal the true area regardless of how the source drew the rings.
    """
    oriented = shapely.orient_polygons(geom)
    area_m2, _ = _GEOD.geometry_area_perimeter(oriented)
    return abs(area_m2) / _M2_PER_HA


def clip_area_by_category(
    aoi: BaseGeometry, features: list[tuple[str, BaseGeometry]]
) -> dict[str, float]:
    """Hectares of each category inside the AOI, leaving out categories with none.

    Features of one category are summed, not unioned, so this assumes the layer has no
    overlaps within a category. Measured on layer 214, delivered undissolved, over a
    0.6 by 0.6 degree AOI with 485 features: the sum exceeds the union by at most
    0.03 %, from the 0.001 degree simplification. A layer with real overlaps, such as
    an inventory where two actions cover the same ground, needs a union per category.
    """
    totals: dict[str, float] = defaultdict(float)
    for category, geom in features:
        # Features arrive invalid, mostly rings that maxAllowableOffset collapsed
        # below four points (97 of 544 on layer 214 near Nuevo Rocafuerte). The
        # default "linework" repair raises on those; "structure" drops them and
        # returns polygons only, which is all an area needs.
        if not geom.is_valid:
            geom = shapely.make_valid(geom, method="structure", keep_collapsed=False)
        inside = geom.intersection(aoi)
        if inside.is_empty:
            continue
        totals[category] += geodesic_area_ha(inside)
    return {c: a for c, a in totals.items() if a > 0}
