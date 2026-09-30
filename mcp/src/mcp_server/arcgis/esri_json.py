"""Polygons from Esri JSON rings.

The server reads geometry as Esri JSON because ArcGIS Online's GeoJSON output drops
holes: every ring comes back as its own polygon, so a hole is filled and the ground
under it is counted twice (12 of 13 feature layers of the catalogue, 30 Sep 2026).
"""

import shapely
from shapely import STRtree
from shapely.geometry import LinearRing, MultiPolygon, Polygon
from shapely.geometry.base import BaseGeometry

Rings = list[list[list[float]]]


def polygon_from_rings(rings: Rings) -> BaseGeometry:
    """A Polygon or MultiPolygon with Esri's semantics: clockwise rings are outer
    rings and counter-clockwise rings are holes of the outer ring around them.

    Rings that maxAllowableOffset collapsed (under four points or no area) and holes
    in no outer ring are dropped, as Esri draws them.
    """
    shells, holes = _split(rings)
    if not shells:
        return Polygon()
    assigned = _assign(shells, holes)
    polygons = [Polygon(s, h) for s, h in zip(shells, assigned, strict=True)]
    geom = polygons[0] if len(polygons) == 1 else MultiPolygon(polygons)
    if geom.is_valid:
        return geom
    return shapely.make_valid(geom, method="structure", keep_collapsed=False)


def _split(rings: Rings) -> tuple[list[LinearRing], list[LinearRing]]:
    """The outer rings and the holes, leaving out collapsed rings."""
    if not isinstance(rings, list):
        raise TypeError(f"rings is a {type(rings).__name__}, not a list")
    shells: list[LinearRing] = []
    holes: list[LinearRing] = []
    for coords in rings:
        if not isinstance(coords, list):
            raise TypeError(f"a ring is a {type(coords).__name__}, not a list")
        if len(coords) < 4:
            continue
        ring = LinearRing(coords)
        if Polygon(ring).area == 0:
            continue
        (holes if ring.is_ccw else shells).append(ring)
    return shells, holes


def _assign(
    shells: list[LinearRing], holes: list[LinearRing]
) -> list[list[LinearRing]]:
    """For each outer ring, the holes that belong to it."""
    assigned: list[list[LinearRing]] = [[] for _ in shells]
    if not holes:
        return assigned
    polygons = [Polygon(s) for s in shells]
    areas = [p.area for p in polygons]
    tree = STRtree(polygons)
    for hole in holes:
        hole_polygon = Polygon(hole)
        point = hole_polygon.representative_point()
        # An island in the hole may also hold the point, but it is smaller than the
        # hole; the outer ring the hole belongs to is the smallest one larger.
        larger = [
            i
            for i in tree.query(point, predicate="within").tolist()
            if areas[i] > hole_polygon.area
        ]
        if larger:
            assigned[min(larger, key=lambda i: areas[i])].append(hole)
    return assigned
