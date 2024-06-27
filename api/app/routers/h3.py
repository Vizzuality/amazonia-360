import logging
import os
from pathlib import Path

import h3
import polars as pl
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from h3 import H3CellError
from pydantic import ValidationError

from app.config.config import get_settings
from app.models.grid import MultiDatasetMeta

log = logging.getLogger(__name__)

h3_grid_router = APIRouter()


@h3_grid_router.get(
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


@h3_grid_router.get(
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
        # validation error is our fault, and we don't want to show internal error details
        # so re re-raising 500 with aseptic message and keep the details in our logs.
        log.exception(e)
        raise HTTPException(status_code=500, detail="Metadata file is malformed. Please contact developer.") from None
    return meta


@h3_grid_router.get("/table")
def read_table(filter: dict, level: int, request: Request):
    """Query tile dataset and return table data"""
    files_path = Path(get_settings().grid_tiles_path) / str(level)
    lf = pl.scan_ipc(files_path.glob("*.arrow"))
    res = pl.SQLContext(frame=lf).execute(
        """SELECT * FROM frame
        WHERE population < 10000 AND fire > 1
        ORDER BY population DESC
        LIMIT 10;
        """
    )
    return JSONResponse(res.collect().to_dict(as_series=False))
