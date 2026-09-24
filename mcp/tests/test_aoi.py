from typing import Any

import pytest

from mcp_server.geometry.aoi import (
    MAX_VERTICES,
    AOIError,
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
    assert coverage.provisional is True


def test_coverage_partial() -> None:
    straddling = parse_aoi(square(-79.6, -1.0, 0.4))
    assert module_coverage(straddling).status == "partial"


def test_coverage_outside() -> None:
    lima = parse_aoi(square(-77.1, -12.1, 0.2))
    assert module_coverage(lima).status == "outside"
