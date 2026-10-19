import math

import shapely
from shapely.geometry import box

from mcp_server.arcgis.client import Feature
from mcp_server.geometry.area import polygonal_parts

DEFAULT_CELL_DEG: float = 0.1


def split_by_grid(features: list[Feature], cell_deg: float) -> list[Feature]:
    """Each feature cut along a grid aligned to multiples of cell_deg.

    A cell then holds small pieces, so an area query clips only the cells it
    touches instead of every feature of the layer."""
    pieces: list[Feature] = []
    for category, geom in features:
        if not geom.is_valid:
            geom = shapely.make_valid(geom, method="structure", keep_collapsed=False)
        if geom.is_empty:
            continue
        min_x, min_y, max_x, max_y = geom.bounds
        for col in range(math.floor(min_x / cell_deg), math.ceil(max_x / cell_deg)):
            for row in range(math.floor(min_y / cell_deg), math.ceil(max_y / cell_deg)):
                cell = box(
                    col * cell_deg,
                    row * cell_deg,
                    (col + 1) * cell_deg,
                    (row + 1) * cell_deg,
                )
                for part in polygonal_parts(geom.intersection(cell)):
                    if not part.is_empty:
                        pieces.append((category, part))
    return pieces
