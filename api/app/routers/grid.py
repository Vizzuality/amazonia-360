import logging
import os
import pathlib
from typing import Annotated

import h3
import polars as pl
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from fastapi.responses import ORJSONResponse
from h3 import H3CellError
from pydantic import ValidationError
from starlette.responses import Response

from app.config.config import get_settings
from app.models.grid import MultiDatasetMeta, TableFilters

log = logging.getLogger("uvicorn.error")

grid_router = APIRouter()


@grid_router.get(
    "/tile/{tile_index}",
    summary="Get a grid tile",
)
async def grid_tile(
    tile_index: Annotated[str, Path(description="The `h3` index of the tile")],
    columns: list[str] = Query(
        [], description="Colum/s to include in the tile. If empty, it returns only cell indexes."
    ),
) -> Response:
    """Get a tile of h3 cells with specified data columns"""
    try:
        z = h3.api.basic_str.h3_get_resolution(tile_index)
    except H3CellError:
        raise HTTPException(status_code=400, detail="Tile index is not a valid H3 cell") from None
    tile_path = os.path.join(get_settings().grid_tiles_path, f"{z}/{tile_index}.arrow")
    if not os.path.exists(tile_path):
        raise HTTPException(status_code=404, detail=f"Tile {tile_path} not found")
    try:
        tile_file = pl.read_ipc(tile_path, columns=["cell", *columns]).write_ipc(None)
    except pl.exceptions.ColumnNotFoundError:
        raise HTTPException(status_code=400, detail="One or more of the specified columns is not valid") from None
    return Response(tile_file.getvalue(), media_type="application/octet-stream")


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
