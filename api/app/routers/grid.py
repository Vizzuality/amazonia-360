import logging
import os
import pathlib
from functools import lru_cache
from typing import Annotated

import h3
import h3ronpy.polars  # noqa: F401
import polars as pl
import shapely
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from fastapi.params import Body
from fastapi.responses import ORJSONResponse
from geojson_pydantic import Feature
from h3 import H3CellError
from h3ronpy.polars.vector import geometry_to_cells
from pydantic import ValidationError
from starlette.responses import Response

from app.config.config import get_settings
from app.models.grid import MultiDatasetMeta, TableFilters

log = logging.getLogger("uvicorn.error")

grid_router = APIRouter()


def tile_from_fs(columns, tile_index) -> tuple[pl.DataFrame, int]:
    """Get the tile from filesystem filtered by column and the resolution of the tile index"""
    try:
        z = h3.api.basic_str.h3_get_resolution(tile_index)
    except H3CellError:
        raise HTTPException(status_code=400, detail="Tile index is not a valid H3 cell") from None
    tile_path = os.path.join(get_settings().grid_tiles_path, f"{z}/{tile_index}.arrow")
    if not os.path.exists(tile_path):
        raise HTTPException(status_code=404, detail=f"Tile {tile_path} not found")
    try:
        tile = pl.read_ipc(tile_path, columns=["cell", *columns])
    except pl.exceptions.ColumnNotFoundError:
        raise HTTPException(status_code=400, detail="One or more of the specified columns is not valid") from None
    return tile, z


@grid_router.get(
    "/tile/{tile_index}",
    summary="Get a grid tile",
)
def get_grid_tile(
    tile_index: Annotated[str, Path(description="The `h3` index of the tile")],
    columns: list[str] = Query(
        [], description="Colum/s to include in the tile. If empty, it returns only cell indexes."
    ),
) -> Response:
    """Get a tile of h3 cells with specified data columns"""
    tile, _ = tile_from_fs(columns, tile_index)
    tile_buffer = tile.write_ipc(None)
    return Response(tile_buffer.getvalue(), media_type="application/octet-stream")


# @lru_cache
# def cells_in_geojson(geometry, cell_resolution: int) -> pl.Series:
#     """Return the cells that fill the polygon area in the geojson"""
#     cells = polyfill_geojson(geojson, cell_resolution)
#     return pl.Series("shape_cells", cells, dtype=pl.UInt64)


@lru_cache
def cells_in_geojson(geometry, cell_resolution: int) -> pl.Series:
    """Return the cells that fill the polygon area in the geojson"""
    cells = geometry_to_cells(geometry, cell_resolution)
    return pl.Series("shape_cells", cells, dtype=pl.UInt64)


@grid_router.post("/tile/{tile_index}", summary="Get a grid tile with cells contained inside the GeoJSON")
def post_grid_tile(
    tile_index: Annotated[str, Path(description="The `h3` index of the tile")],
    geojson: Annotated[Feature, Body(description="GeoJSON Feature.")],
    columns: list[str] = Query(
        [], description="Colum/s to include in the tile. If empty, it returns only cell indexes."
    ),
) -> Response:
    tile, tile_index_res = tile_from_fs(columns, tile_index)
    cell_res = tile_index_res + get_settings().tile_to_cell_resolution_diff
    geom = shapely.from_geojson(geojson.model_dump_json())
    cells = cells_in_geojson(geom, cell_res)
    tile = (
        tile.with_columns(pl.col("cell").h3.cells_parse())
        .filter(pl.col("cell").is_in(cells))
        .with_columns(pl.col("cell").h3.cells_to_string())
    )
    if tile.is_empty():
        raise HTTPException(status_code=404, detail="No data in region")
    tile_buffer = tile.write_ipc(None)
    return Response(tile_buffer.getvalue(), media_type="application/octet-stream")


@grid_router.get(
    "/meta",
    summary="Dataset metadata",
)
async def grid_dataset_metadata() -> MultiDatasetMeta:
    """Get the grid dataset metadata"""
    file = os.path.join(get_settings().grid_tiles_path, "meta.json")
    with open(file) as f:
        raw = f.read()
    try:
        meta = MultiDatasetMeta.model_validate_json(raw)
    except ValidationError as e:
        # validation error is our fault because meta file is internal. We don't want to show internal error details
        # so raise controlled 500
        log.exception(e)
        raise HTTPException(status_code=500, detail="Metadata file is malformed. Please contact developer.") from None
    return meta


@grid_router.post("/table")
def read_table(
    level: Annotated[int, Query(..., description="Tile level at which the query will be computed")],
    filters: TableFilters = Depends(),
) -> ORJSONResponse:
    """Query tile dataset and return table data"""
    files_path = pathlib.Path(get_settings().grid_tiles_path) / str(level)
    if not files_path.exists():
        raise HTTPException(404, detail=f"Level {level} does not exist") from None
    lf = pl.scan_ipc(files_path.glob("*.arrow"))
    query = filters.to_sql_query("frame")
    log.debug(query)
    try:
        res = pl.SQLContext(frame=lf).execute(query).collect()
    except pl.exceptions.ColumnNotFoundError as e:
        # bad column in order by clause
        log.exception(e)
        raise HTTPException(status_code=400, detail="One or more of the specified columns is not valid") from None

    except pl.exceptions.ComputeError as e:
        # possibly raise if wrong type in compare. I'm not aware of other sources of ComputeError
        log.exception(e)
        raise HTTPException(status_code=422, detail=str(e)) from None
    return ORJSONResponse(res.to_dict(as_series=False))
