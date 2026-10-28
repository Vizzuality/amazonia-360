"""Map shapes small enough for a host's result limit.

Claude Desktop refuses a tool result over 1 MB. GeoJSON of a layer with many small
patches passes that on a single canton, and simplifying alone stops shrinking it long
before it fits, deleting the small patches on the way. Coordinates snapped to a grid
over the area and written as differences from the previous point do the work instead;
simplifying only trims what a screen cannot show. Measured in
docs/superpowers/specs/2026-10-28-map-compare-design.md, section 7.2.
"""

import json
from dataclasses import dataclass
from typing import Any

import pydantic_core
import shapely
from shapely.geometry import shape

# The whole serialised result, leaving room for the protocol's own framing under 1 MB.
BUDGET_BYTES = 950_000
GRID_STEPS = 8192
# A quarter of a pixel on a map 700 px wide; past 1/350 a patch loses its shape.
FIRST_TOLERANCE = 1 / 2800
LAST_TOLERANCE = 1 / 350


@dataclass(frozen=True)
class Grid:
    x0: float
    y0: float
    step: float

    def to_json(self) -> dict[str, float]:
        return {"x0": self.x0, "y0": self.y0, "step": self.step}


@dataclass(frozen=True)
class FittedShapes:
    shapes: list[dict[str, Any]] | None
    omitted_bytes: int | None
    simplified: bool


def grid_for(area: dict[str, Any]) -> Grid:
    minx, miny, maxx, maxy = shape(area).bounds
    side = max(maxx - minx, maxy - miny) or 1e-9
    return Grid(minx, miny, side / GRID_STEPS)


def side_of(area: dict[str, Any]) -> float:
    minx, miny, maxx, maxy = shape(area).bounds
    return max(maxx - minx, maxy - miny)


def encode(
    collection: dict[str, Any], grid: Grid, tolerance: float
) -> list[dict[str, Any]]:
    encoded = []
    for feature in collection["features"]:
        geometry = shape(feature["geometry"])
        if tolerance > 0:
            geometry = shapely.simplify(geometry, tolerance, preserve_topology=True)
        parts = getattr(geometry, "geoms", [geometry])
        polygons = [
            [_ring(ring.coords, grid) for ring in (p.exterior, *p.interiors)]
            for p in parts
            if not p.is_empty
        ]
        encoded.append({"c": feature["properties"]["category"], "p": polygons})
    return encoded


def _ring(coords: Any, grid: Grid) -> list[int]:
    flat: list[int] = []
    px = py = 0
    for x, y, *_ in coords:
        ix = round((x - grid.x0) / grid.step)
        iy = round((y - grid.y0) / grid.step)
        flat += [ix - px, iy - py]
        px, py = ix, iy
    return flat


def _size(shapes: list[dict[str, Any]]) -> int:
    return len(json.dumps(shapes, separators=(",", ":")))


def fit(
    collections: list[dict[str, Any]], grid: Grid, side: float, room: int
) -> list[FittedShapes]:
    """Each layer at the first tolerance; while they pass the room, the largest still
    drawn is simplified further, or left out once at the last tolerance."""
    first, last = side * FIRST_TOLERANCE, side * LAST_TOLERANCE
    tolerances = [first] * len(collections)
    shapes: list[list[dict[str, Any]] | None] = [
        encode(c, grid, first) for c in collections
    ]
    sizes = [_size(s) for s in shapes if s is not None]
    while sum(sizes) > room:
        largest = max(range(len(sizes)), key=sizes.__getitem__)
        if sizes[largest] == 0:
            break
        if tolerances[largest] * 2 <= last * (1 + 1e-9):
            tolerances[largest] *= 2
            encoded = encode(collections[largest], grid, tolerances[largest])
            shapes[largest], sizes[largest] = encoded, _size(encoded)
        else:
            shapes[largest], sizes[largest] = None, 0
    return [
        FittedShapes(
            shapes=s,
            omitted_bytes=None if s is not None else len(pydantic_core.to_json(c)),
            simplified=s is not None and t > first * (1 + 1e-9),
        )
        for s, t, c in zip(shapes, tolerances, collections, strict=True)
    ]
