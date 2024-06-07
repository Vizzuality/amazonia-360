import os

import h3
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config.config import get_settings

h3_grid_router = APIRouter()


@h3_grid_router.get(
    "/tile/{tile_index}",
    responses={200: {"description": "Get a grid tile"}, 404: {"description": "Not found"}},
    response_model=None,
)
async def grid_tile(tile_index: str) -> FileResponse:
    """Request a tile of h3 cells

    :raises HTTPException 404: Item not found
    """
    z = h3.api.basic_str.h3_get_resolution(tile_index)
    tile_file = os.path.join(get_settings().grid_tiles_path, f"{z}/{tile_index}.arrow")
    if not os.path.exists(tile_file):
        raise HTTPException(status_code=404, detail=f"Tile {tile_file} not found")
    return FileResponse(tile_file, media_type="application/octet-stream")
