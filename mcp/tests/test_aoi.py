from typing import Any

import pytest
from shapely.geometry import Point

from mcp_server.geometry.aoi import (
    MAX_VERTICES,
    AOIError,
    check_aoi,
    module_coverage,
    parse_aoi,
    vertex_count,
)


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


def test_coverage_inside() -> None:
    coverage = module_coverage(parse_aoi(TENA))
    assert coverage.status == "inside"
    assert coverage.boundary == "bounding_box"


def test_coverage_partial() -> None:
    straddling = parse_aoi(square(-79.6, -1.0, 0.4))
    assert module_coverage(straddling).status == "partial"


def test_coverage_outside() -> None:
    lima = parse_aoi(square(-77.1, -12.1, 0.2))
    assert module_coverage(lima).status == "outside"


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
    assert module_coverage(parse_aoi(across)).status == "partial"


def test_check_aoi_without_a_vertex_limit() -> None:
    # A circle over Tena with more vertices than a client may send.
    dense = Point(-77.8, -1.0).buffer(0.05, quad_segs=2000)
    assert len(dense.exterior.coords) > MAX_VERTICES
    with pytest.raises(AOIError, match="vertices"):
        check_aoi(dense)
    assert check_aoi(dense, max_vertices=None) is dense
