import json
import math
import random
from typing import Any

import pydantic_core

from mcp_server.maps.encoding import (
    FIRST_TOLERANCE,
    GRID_STEPS,
    LAST_TOLERANCE,
    Grid,
    encode,
    fit,
    grid_for,
)


def decode(shapes: list[dict[str, Any]], grid: Grid) -> dict[str, Any]:
    """The page's decoder, in Python."""
    features = []
    for item in shapes:
        polygons = []
        for polygon in item["p"]:
            rings = []
            for flat in polygon:
                x = y = 0
                ring = []
                for i in range(0, len(flat), 2):
                    x += flat[i]
                    y += flat[i + 1]
                    ring.append([grid.x0 + x * grid.step, grid.y0 + y * grid.step])
                rings.append(ring)
            polygons.append(rings)
        features.append(
            {
                "type": "Feature",
                "properties": {"category": item["c"]},
                "geometry": {"type": "MultiPolygon", "coordinates": polygons},
            }
        )
    return {"type": "FeatureCollection", "features": features}


def square(x: float, y: float, size: float) -> list[list[float]]:
    return [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]


def collection(geometries: list[dict[str, Any]], category: str = "A") -> dict[str, Any]:
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "properties": {"category": category}, "geometry": g}
            for g in geometries
        ],
    }


def squares(count: int, size: float, seed: int = 1) -> dict[str, Any]:
    rng = random.Random(seed)
    return collection(
        [
            {
                "type": "Polygon",
                "coordinates": [
                    square(
                        -78 + rng.random(), -1 + rng.random(), size * rng.uniform(1, 2)
                    )
                ],
            }
            for _ in range(count)
        ]
    )


AREA = {"type": "Polygon", "coordinates": [square(-78.0, -1.0, 1.1)]}


def size(shapes: list[dict[str, Any]] | None) -> int:
    return len(json.dumps(shapes, separators=(",", ":")))


def test_encoding_round_trips_within_half_a_step() -> None:
    grid = grid_for(AREA)
    layer = squares(200, 0.001)
    decoded = decode(encode(layer, grid, 0), grid)
    for original, back in zip(layer["features"], decoded["features"], strict=True):
        ring = original["geometry"]["coordinates"][0]
        got = back["geometry"]["coordinates"][0][0]
        assert len(got) == len(ring)
        for (x, y), (bx, by) in zip(ring, got, strict=True):
            assert abs(x - bx) <= grid.step / 2 + 1e-12
            assert abs(y - by) <= grid.step / 2 + 1e-12


def test_multipolygons_and_holes_survive() -> None:
    grid = grid_for(AREA)
    hole = [[-77.9, -0.9], [-77.9, -0.8], [-77.8, -0.8], [-77.8, -0.9], [-77.9, -0.9]]
    geometry = {
        "type": "MultiPolygon",
        "coordinates": [
            [square(-78.0, -1.0, 0.3), hole],
            [square(-77.5, -0.5, 0.2)],
        ],
    }
    decoded = decode(encode(collection([geometry]), grid, 0), grid)
    polygons = decoded["features"][0]["geometry"]["coordinates"]
    assert [len(rings) for rings in polygons] == [2, 1]


def test_tiny_patches_never_vanish() -> None:
    grid = grid_for(AREA)
    layer = squares(500, 0.0005)
    shapes = encode(layer, grid, 1.1 * LAST_TOLERANCE)
    assert len(shapes) == 500
    assert all(item["p"] and all(len(r) >= 8 for r in item["p"][0]) for item in shapes)


def test_grid_covers_every_part() -> None:
    area = {
        "type": "MultiPolygon",
        "coordinates": [[square(-78.0, -1.0, 0.5)], [square(-76.5, -0.8, 0.5)]],
    }
    grid = grid_for(area)
    assert grid.x0 == -78.0
    assert grid.y0 == -1.0
    assert grid.x0 + grid.step * GRID_STEPS >= -76.0 - 1e-9
    assert grid.to_json() == {"x0": grid.x0, "y0": grid.y0, "step": grid.step}


def test_a_layer_that_fits_is_not_simplified() -> None:
    grid = grid_for(AREA)
    [fitted] = fit([squares(10, 0.01)], grid, 1.1, room=10**6)
    assert fitted.shapes is not None
    assert fitted.simplified is False
    assert fitted.omitted_bytes is None


def wiggly(count: int, seed: int = 2) -> dict[str, Any]:
    """Patches with many vertices, which simplifying can shrink."""
    rng = random.Random(seed)
    geometries = []
    for _ in range(count):
        cx, cy = -78 + rng.random(), -1 + rng.random()
        ring = []
        for i in range(200):
            angle = 2 * math.pi * i / 200
            r = 0.01 * (1 + 0.05 * rng.random())
            ring.append([cx + r * math.cos(angle), cy + r * math.sin(angle)])
        ring.append(ring[0])
        geometries.append({"type": "Polygon", "coordinates": [ring]})
    return collection(geometries)


def test_a_layer_over_its_room_is_simplified_until_it_fits() -> None:
    grid = grid_for(AREA)
    layer = wiggly(40)
    room = size(encode(layer, grid, 1.1 * FIRST_TOLERANCE)) - 1
    [fitted] = fit([layer], grid, 1.1, room=room)
    assert fitted.simplified is True
    assert fitted.shapes is not None
    assert size(fitted.shapes) <= room


def test_the_larger_layer_is_reduced_first() -> None:
    grid = grid_for(AREA)
    big, small = wiggly(60, seed=3), wiggly(5, seed=4)
    big_first = size(encode(big, grid, 1.1 * FIRST_TOLERANCE))
    big_double = size(encode(big, grid, 2 * 1.1 * FIRST_TOLERANCE))
    small_first = size(encode(small, grid, 1.1 * FIRST_TOLERANCE))
    assert big_double < big_first
    room = big_double + small_first
    fitted_big, fitted_small = fit([big, small], grid, 1.1, room=room)
    assert fitted_big.simplified is True
    assert fitted_small.simplified is False


def test_a_layer_that_cannot_fit_is_omitted() -> None:
    grid = grid_for(AREA)
    layer = squares(50, 0.01)
    [fitted] = fit([layer], grid, 1.1, room=100)
    assert fitted.shapes is None
    assert fitted.omitted_bytes == len(pydantic_core.to_json(layer))
    assert fitted.simplified is False
