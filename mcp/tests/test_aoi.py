from typing import Any

import pytest
from shapely.geometry import Point, box

from mcp_server.geometry import aoi as aoi_module
from mcp_server.geometry.aoi import (
    MAX_VERTICES,
    MODULE_ENVELOPE,
    AOIError,
    check_aoi,
    module_coverage,
    parse_aoi,
    vertex_count,
)
from mcp_server.geometry.area import geodesic_area_ha


def square(x: float, y: float, size: float) -> dict[str, Any]:
    ring = [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]
    return {"type": "Polygon", "coordinates": [ring]}


TENA = square(-77.9, -1.1, 0.2)


def test_parses_a_polygon() -> None:
    aoi = parse_aoi(TENA)
    assert aoi.geom_type == "Polygon"
    assert vertex_count(aoi) == 5


def test_parses_a_multipolygon() -> None:
    multi = {
        "type": "MultiPolygon",
        "coordinates": [TENA["coordinates"], square(-78.5, -2.0, 0.1)["coordinates"]],
    }
    assert parse_aoi(multi).geom_type == "MultiPolygon"


def test_rejects_a_point() -> None:
    with pytest.raises(AOIError, match="Polygon or MultiPolygon"):
        parse_aoi({"type": "Point", "coordinates": [-77.8, -1.0]})


def test_rejects_malformed_geojson() -> None:
    with pytest.raises(AOIError, match="not valid GeoJSON"):
        parse_aoi({"type": "Polygon", "coordinates": "nope"})


def test_rejects_an_unknown_geometry_type() -> None:
    with pytest.raises(AOIError, match="not valid GeoJSON"):
        parse_aoi({"type": "Blob", "coordinates": []})


def test_rejects_an_empty_polygon() -> None:
    with pytest.raises(AOIError, match="empty"):
        parse_aoi({"type": "Polygon", "coordinates": []})


def test_rejects_projected_coordinates() -> None:
    utm = square(800_000, 9_800_000, 10_000)
    with pytest.raises(AOIError, match="longitude and latitude"):
        parse_aoi(utm)


def test_rejects_a_self_intersecting_polygon() -> None:
    bowtie = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]],
    }
    with pytest.raises(AOIError, match="Self-intersection"):
        parse_aoi(bowtie)


def test_rejects_too_many_vertices() -> None:
    n = MAX_VERTICES + 1
    ring = [[-77.9 + 0.2 * i / n, -1.1] for i in range(n)]
    ring += [[-77.7, -0.9], [-77.9, -0.9], [-77.9, -1.1]]
    with pytest.raises(AOIError, match="vertices"):
        parse_aoi({"type": "Polygon", "coordinates": [ring]})


# A stand-in for the module's outline, so these tests do not move with a re-sync.
OUTLINE = box(-78.0, -2.0, -76.0, 0.0)


@pytest.fixture
def outline(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(aoi_module, "module_outline", lambda: OUTLINE)


@pytest.mark.usefixtures("outline")
def test_coverage_inside() -> None:
    coverage = module_coverage(parse_aoi(TENA))
    assert coverage.status == "inside"
    assert coverage.outside_ha == 0
    assert coverage.boundary == "derived_polygon"


@pytest.mark.usefixtures("outline")
def test_coverage_partial_says_how_much_is_outside() -> None:
    # Half of it west of the outline's edge at -78.
    straddling = parse_aoi(square(-78.2, -1.0, 0.4))
    coverage = module_coverage(straddling)
    assert coverage.status == "partial"
    outside = geodesic_area_ha(box(-78.2, -1.0, -78.0, -0.6))
    assert coverage.outside_ha == pytest.approx(outside, abs=0.01)


@pytest.mark.usefixtures("outline")
def test_an_area_that_sticks_out_by_less_than_a_hundredth_of_a_hectare_is_inside() -> (
    None
):
    # partial with outside_ha 0.0 would say both things at once.
    barely = parse_aoi(square(-78.000000001, -1.0, 0.4))
    coverage = module_coverage(barely)
    assert (coverage.status, coverage.outside_ha) == ("inside", 0)


@pytest.mark.usefixtures("outline")
def test_a_sliver_outside_counts_as_inside() -> None:
    # 0.004 of a 0.4-degree width is 1 % of the area, under the threshold; 0.012
    # is 3 %, over it.
    sliver = parse_aoi(square(-78.004, -1.0, 0.4))
    coverage = module_coverage(sliver)
    assert (coverage.status, coverage.outside_ha) == ("inside", 0)
    more = parse_aoi(square(-78.012, -1.0, 0.4))
    assert module_coverage(more).status == "partial"


@pytest.mark.usefixtures("outline")
def test_coverage_outside_counts_the_whole_area() -> None:
    lima = parse_aoi(square(-77.1, -12.1, 0.2))
    coverage = module_coverage(lima)
    assert coverage.status == "outside"
    assert coverage.outside_ha == pytest.approx(geodesic_area_ha(lima), abs=0.01)


@pytest.mark.usefixtures("outline")
def test_an_area_inside_the_envelope_but_not_the_outline_is_outside() -> None:
    # The rectangle used to call this inside.
    west = parse_aoi(square(-79.0, -1.0, 0.2))
    assert MODULE_ENVELOPE.contains(west)
    assert module_coverage(west).status == "outside"


def test_the_committed_outline_is_the_module() -> None:
    outline = aoi_module.module_outline()
    assert outline.is_valid
    assert outline.geom_type in ("Polygon", "MultiPolygon")
    # 13,141,039 ha before simplification, measured on 30 Sep 2026.
    assert geodesic_area_ha(outline) == pytest.approx(13_141_039, rel=0.001)
    assert vertex_count(outline) < 10_000
    # Tena is in the module; Quito, west of the Andes' crest, is not.
    assert module_coverage(parse_aoi(TENA)).status == "inside"
    quito = parse_aoi(square(-78.52, -0.24, 0.05))
    assert module_coverage(quito).status == "outside"


def test_rejects_an_area_that_reaches_far_beyond_the_module() -> None:
    # The globe used to pass as "partial", pull every feature of a layer and
    # measure as 0 ha.
    world = {
        "type": "Polygon",
        "coordinates": [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]],
    }
    with pytest.raises(AOIError, match="beyond the Ecuador module"):
        parse_aoi(world)


def test_accepts_an_area_drawn_across_the_border() -> None:
    # Half a degree into Peru from the module's eastern edge (-75.189).
    across = {
        "type": "Polygon",
        "coordinates": [
            [[-75.4, -1.1], [-74.7, -1.1], [-74.7, -0.9], [-75.4, -0.9], [-75.4, -1.1]]
        ],
    }
    assert parse_aoi(across).geom_type == "Polygon"


def test_check_aoi_without_a_vertex_limit() -> None:
    # A circle over Tena with more vertices than a client may send.
    dense = Point(-77.8, -1.0).buffer(0.05, quad_segs=2000)
    assert len(dense.exterior.coords) > MAX_VERTICES
    with pytest.raises(AOIError, match="vertices"):
        check_aoi(dense)
    assert check_aoi(dense, max_vertices=None) is dense


def test_check_aoi_without_the_reach_limit() -> None:
    # A province like Loja reaches past the one-degree margin west of the module.
    loja = box(-80.49, -4.5, -79.0, -3.5)
    with pytest.raises(AOIError, match="beyond the Ecuador module"):
        check_aoi(loja)
    assert check_aoi(loja, reach=False) is loja
