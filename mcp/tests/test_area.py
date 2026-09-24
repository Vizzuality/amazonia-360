import pytest
from shapely.geometry import box

from mcp_server.geometry.area import clip_area_by_category, geodesic_area_ha


def test_one_degree_square_at_the_equator() -> None:
    # 111.32 km x 110.57 km on WGS84, about 1.2309 million hectares.
    assert geodesic_area_ha(box(0, 0, 1, 1)) == pytest.approx(1_230_900, rel=1e-3)


def test_a_large_feature_contributes_only_the_part_inside() -> None:
    aoi = box(-77.9, -1.1, -77.8, -1.0)
    huge = box(-79.0, -2.0, -77.0, 0.0)
    result = clip_area_by_category(aoi, [("Bosque", huge)])
    assert result["Bosque"] == pytest.approx(geodesic_area_ha(aoi), rel=1e-6)
    assert result["Bosque"] < geodesic_area_ha(huge) / 100


def test_sums_features_of_the_same_category() -> None:
    aoi = box(0, 0, 1, 1)
    left = box(-1, 0, 0.5, 1)
    right = box(0.5, 0, 2, 1)
    result = clip_area_by_category(aoi, [("A", left), ("A", right)])
    # Geodesic edges: splitting at x=0.5 does not partition the exact same surface.
    assert result["A"] == pytest.approx(geodesic_area_ha(aoi), rel=1e-4)


def test_keeps_categories_apart_and_drops_non_overlapping_ones() -> None:
    aoi = box(0, 0, 1, 1)
    result = clip_area_by_category(
        aoi,
        [("A", box(0, 0, 0.5, 1)), ("B", box(0.5, 0, 1, 1)), ("C", box(5, 5, 6, 6))],
    )
    assert set(result) == {"A", "B"}
    # Geodesic edges: splitting at x=0.5 does not partition the exact same surface.
    assert result["A"] + result["B"] == pytest.approx(geodesic_area_ha(aoi), rel=1e-4)


def test_repairs_an_invalid_feature_instead_of_failing() -> None:
    from shapely.geometry import Polygon

    bowtie = Polygon([(0, 0), (1, 1), (1, 0), (0, 1), (0, 0)])
    result = clip_area_by_category(box(0, 0, 1, 1), [("A", bowtie)])
    assert result["A"] > 0
