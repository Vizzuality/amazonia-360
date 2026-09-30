import pytest
from shapely.geometry import MultiPolygon, Polygon, box

from mcp_server.arcgis.esri_json import polygon_from_rings
from mcp_server.geometry.area import clip_area_by_category, geodesic_area_ha

Ring = list[list[float]]


def cw(x0: float, y0: float, x1: float, y1: float) -> Ring:
    """A clockwise box: an outer ring for Esri."""
    return [[x0, y0], [x0, y1], [x1, y1], [x1, y0], [x0, y0]]


def ccw(x0: float, y0: float, x1: float, y1: float) -> Ring:
    """A counter-clockwise box: a hole for Esri."""
    return list(reversed(cw(x0, y0, x1, y1)))


def test_a_counterclockwise_ring_is_a_hole_in_its_outer_ring() -> None:
    geom = polygon_from_rings([cw(0, 0, 4, 4), ccw(1, 1, 3, 3)])
    assert isinstance(geom, Polygon)
    assert geom.is_valid
    assert len(geom.interiors) == 1
    assert geom.area == pytest.approx(16 - 4)


def test_each_hole_goes_to_the_outer_ring_that_holds_it() -> None:
    geom = polygon_from_rings(
        [cw(0, 0, 4, 4), cw(10, 0, 14, 4), ccw(11, 1, 12, 2), ccw(1, 1, 3, 3)]
    )
    assert isinstance(geom, MultiPolygon)
    assert geom.is_valid
    left, right = sorted(geom.geoms, key=lambda p: p.bounds[0])
    assert left.area == pytest.approx(12)
    assert right.area == pytest.approx(15)


def test_an_island_in_a_hole_stays_and_does_not_take_the_hole() -> None:
    # The hole's representative point may fall inside the island; the hole still
    # belongs to the outer ring around it.
    geom = polygon_from_rings([cw(0, 0, 10, 10), ccw(1, 1, 9, 9), cw(2, 2, 8, 8)])
    assert geom.is_valid
    assert geom.area == pytest.approx(100 - 64 + 36)
    assert not geom.contains(box(1.2, 1.2, 1.8, 1.8))
    assert geom.contains(box(4, 4, 6, 6))


def test_a_hole_inside_an_island_inside_a_hole_goes_to_the_island() -> None:
    rings = [
        cw(0, 0, 10, 10),
        ccw(1, 1, 9, 9),
        cw(2, 2, 8, 8),
        ccw(3, 3, 7, 7),
    ]
    geom = polygon_from_rings(rings)
    assert geom.is_valid
    assert geom.area == pytest.approx(100 - 64 + 36 - 16)


def test_collapsed_rings_are_dropped() -> None:
    # maxAllowableOffset collapses small rings to a repeated point or a line.
    point: Ring = [[-75.3638, -0.9242]] * 4
    line: Ring = [[0, 0], [1, 1], [0, 0]]
    flat: Ring = [[5, 5], [6, 6], [7, 7], [5, 5]]
    geom = polygon_from_rings([point, line, flat, cw(0, 0, 1, 1)])
    assert isinstance(geom, Polygon)
    assert geom.area == pytest.approx(1)


def test_a_hole_with_no_outer_ring_is_dropped() -> None:
    geom = polygon_from_rings([cw(0, 0, 1, 1), ccw(5, 5, 6, 6)])
    assert geom.area == pytest.approx(1)


def test_a_lone_counterclockwise_ring_is_empty_as_in_esri() -> None:
    geom = polygon_from_rings([ccw(0, 0, 1, 1)])
    assert isinstance(geom, Polygon)
    assert geom.is_empty


def test_no_rings_is_an_empty_polygon() -> None:
    geom = polygon_from_rings([])
    assert isinstance(geom, Polygon)
    assert geom.is_empty


def test_a_self_intersecting_ring_is_repaired() -> None:
    # Two lobes of 4/3 and 16/3 crossing at (4/3, 4/3); clockwise overall.
    bowtie: Ring = [[0, 0], [4, 4], [4, 0], [0, 2], [0, 0]]
    geom = polygon_from_rings([bowtie])
    assert geom.is_valid
    assert geom.area == pytest.approx(4 / 3 + 16 / 3)


def test_a_class_that_fills_another_class_hole_is_not_counted_twice() -> None:
    # Layer 219: one unit with a hole that another unit fills. GeoJSON from
    # ArcGIS Online returned the hole as a second shell, so the ground under the
    # inner unit was counted for both.
    x0, y0 = -77.9, -1.1
    outer = polygon_from_rings(
        [
            cw(x0, y0, x0 + 0.2, y0 + 0.2),
            ccw(x0 + 0.05, y0 + 0.05, x0 + 0.15, y0 + 0.15),
        ]
    )
    inner = polygon_from_rings([cw(x0 + 0.05, y0 + 0.05, x0 + 0.15, y0 + 0.15)])
    aoi = box(x0, y0, x0 + 0.2, y0 + 0.2)
    areas = clip_area_by_category(aoi, [("A", outer), ("B", inner)])
    assert sum(areas.values()) == pytest.approx(geodesic_area_ha(aoi), rel=1e-9)
    assert areas["B"] == pytest.approx(areas["A"] / 3, rel=1e-3)


@pytest.mark.parametrize("rings", ["x", 5, [5], ["abcd"]])
def test_rings_that_are_not_lists_raise(rings: object) -> None:
    with pytest.raises(TypeError):
        polygon_from_rings(rings)  # type: ignore[arg-type]
