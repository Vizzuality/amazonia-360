import pytest
from shapely.geometry import Polygon, box

from mcp_server.geometry.area import clip_area_by_category
from mcp_server.store.split import split_by_grid


def test_a_feature_spanning_cells_becomes_one_piece_per_cell() -> None:
    pieces = split_by_grid([("Bosque", box(0.05, 0.05, 0.35, 0.15))], 0.1)
    assert len(pieces) == 8 and {c for c, _ in pieces} == {"Bosque"}


def test_pieces_measure_the_same_as_the_feature() -> None:
    feature = ("Bosque", Polygon([(-77.93, -1.12), (-77.41, -1.07), (-77.6, -0.71)]))
    aoi = box(-77.8, -1.1, -77.5, -0.8)
    whole = clip_area_by_category(aoi, [feature])["Bosque"]
    split = clip_area_by_category(aoi, split_by_grid([feature], 0.1))["Bosque"]
    assert split == pytest.approx(whole, rel=1e-5)


def test_an_invalid_feature_is_repaired_before_splitting() -> None:
    bowtie = Polygon([(0, 0), (0.3, 0.3), (0.3, 0), (0, 0.3), (0, 0)])
    pieces = split_by_grid([("x", bowtie)], 0.1)
    assert pieces and all(g.is_valid for _, g in pieces)


def test_a_cell_corner_touch_leaves_no_empty_or_line_piece() -> None:
    pieces = split_by_grid([("x", box(0.0, 0.0, 0.1, 0.1))], 0.1)
    assert len(pieces) == 1
    assert all(g.geom_type in ("Polygon", "MultiPolygon") for _, g in pieces)
