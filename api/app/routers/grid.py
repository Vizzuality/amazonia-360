import logging
import os
from pathlib import Path
from typing import Annotated

import h3
import polars as pl
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, ORJSONResponse
from h3 import H3CellError
from pydantic import ValidationError

from app.config.config import get_settings
from app.models.grid import MultiDatasetMeta, TableFilters

log = logging.getLogger("uvicorn.error")

grid_router = APIRouter()


@grid_router.get(
    "/tile/{tile_index}",
    responses={200: {"description": "Get a grid tile"}, 404: {"description": "Not found"}},
    response_model=None,
)
async def grid_tile(tile_index: str) -> FileResponse:
    """Request a tile of h3 cells

    :raises HTTPException 404: Item not found
    :raises HTTPException 422: H3 index is not valid
    """
    try:
        z = h3.api.basic_str.h3_get_resolution(tile_index)
    except H3CellError:
        raise HTTPException(status_code=422, detail="Tile index is not a valid H3 cell") from None

    tile_file = os.path.join(get_settings().grid_tiles_path, f"{z}/{tile_index}.arrow")
    if not os.path.exists(tile_file):
        raise HTTPException(status_code=404, detail=f"Tile {tile_file} not found")
    return FileResponse(tile_file, media_type="application/octet-stream")


@grid_router.get(
    "/meta",
)
async def grid_dataset_metadata() -> MultiDatasetMeta:
    """Dataset metadata"""
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
    files_path = Path(get_settings().grid_tiles_path) / str(level)
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
        raise HTTPException(status_code=404, detail=f"Column '{e}' not found in dataset") from None

    except pl.exceptions.ComputeError as e:
        # possibly raise if wrong type in compare. I'm not aware of other sources of ComputeError
        log.exception(e)
        raise HTTPException(status_code=422, detail=str(e)) from None
    return ORJSONResponse(res.to_dict(as_series=False))
