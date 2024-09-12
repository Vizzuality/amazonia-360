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
from h3ronpy.polars import cells_to_string
from h3ronpy.polars.vector import geometry_to_cells
from pydantic import ValidationError
from starlette.responses import Response

from app.config.config import get_settings
from app.models.grid import MultiDatasetMeta, TableFilters

log = logging.getLogger("uvicorn.error")

grid_router = APIRouter()


def get_tile(tile_index: str, columns: list[str]) -> tuple[pl.LazyFrame, int]:
    """Get the tile from filesystem filtered by column and the resolution of the tile index"""
    try:
        z = h3.api.basic_str.h3_get_resolution(tile_index)
    except H3CellError:
        raise HTTPException(status_code=400, detail="Tile index is not a valid H3 cell") from None
    tile_path = os.path.join(get_settings().grid_tiles_path, f"{z}/{tile_index}.arrow")
    if not os.path.exists(tile_path):
        raise HTTPException(status_code=404, detail=f"Tile {tile_path} not found")
    tile = pl.scan_ipc(tile_path).select(["cell", *columns])
    return tile, z


@lru_cache
def cells_in_geojson(geometry: str, cell_resolution: int) -> pl.LazyFrame:
    """Return the cells that fill the polygon area in the geojson

    Geometry must be a shapely geometry, a wkt or wkb so the lru cache
    can hash the parameter.
    """
    cells = cells_to_string(geometry_to_cells(geometry, cell_resolution))
    return pl.LazyFrame({"cell": cells})


@grid_router.get(
    "/tile/{tile_index}",
    summary="Get a grid tile",
)
def grid_tile(
    tile_index: Annotated[str, Path(description="The `h3` index of the tile")],
    columns: list[str] = Query(
        [], description="Colum/s to include in the tile. If empty, it returns only cell indexes."
    ),
) -> Response:
    """Get a tile of h3 cells with specified data columns"""
    tile, _ = get_tile(tile_index, columns)
    try:
        tile_buffer = tile.collect().write_ipc(None)
    # we don't know if the column requested are correct until we call .collect()
    except pl.exceptions.ColumnNotFoundError:
        raise HTTPException(status_code=400, detail="One or more of the specified columns is not valid") from None
    return Response(tile_buffer.getvalue(), media_type="application/octet-stream")


@grid_router.post("/tile/{tile_index}", summary="Get a grid tile with cells contained inside the GeoJSON")
def grid_tile_in_area(
    tile_index: Annotated[str, Path(description="The `h3` index of the tile")],
    geojson: Annotated[Feature, Body(description="GeoJSON feature used to filter the cells.")],
    columns: list[str] = Query(
        [], description="Colum/s to include in the tile. If empty, it returns only cell indexes."
    ),
) -> Response:
    """Get a tile of h3 cells that are inside the polygon"""
    tile, tile_index_res = get_tile(tile_index, columns)
    cell_res = tile_index_res + get_settings().tile_to_cell_resolution_diff
    geom = shapely.from_geojson(geojson.model_dump_json())
    cells = cells_in_geojson(geom, cell_res)
    try:
        tile = tile.join(cells, on="cell").collect()
    # we don't know if the column requested are correct until we call .collect()
    except pl.exceptions.ColumnNotFoundError:
        raise HTTPException(status_code=400, detail="One or more of the specified columns is not valid") from None
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
    geojson: Annotated[Feature | None, Body(description="GeoJSON feature used to filter the cells.")] = None,
) -> ORJSONResponse:
    """Query tile dataset and return table data"""
    files_path = pathlib.Path(get_settings().grid_tiles_path) / str(level)
    if not files_path.exists():
        raise HTTPException(404, detail=f"Level {level} does not exist") from None

    lf = pl.scan_ipc(list(files_path.glob("*.arrow")))

    if geojson is not None:
        cell_res = level + get_settings().tile_to_cell_resolution_diff
        geom = shapely.from_geojson(geojson.model_dump_json())
        cells = cells_in_geojson(geom, cell_res)
        lf = lf.join(cells, on="cell")

    query = filters.to_sql_query("frame")
    log.debug(query)

    try:
        res = pl.SQLContext(frame=lf).execute(query).collect()
    except pl.exceptions.ColumnNotFoundError as e:  # bad column in order by clause
        log.exception(e)
        raise HTTPException(status_code=400, detail="One or more of the specified columns is not valid") from None
    except pl.exceptions.ComputeError as e:  # raised if wrong type in compare.
        log.exception(e)
        raise HTTPException(status_code=422, detail=str(e)) from None

    return ORJSONResponse(res.to_dict(as_series=False))
