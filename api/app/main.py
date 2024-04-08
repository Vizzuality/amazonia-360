import os
from typing import Annotated

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from starlette.exceptions import HTTPException
from titiler.core.errors import DEFAULT_STATUS_CODES, add_exception_handlers

from app.auth.auth import AuthMiddleware
from app.config.config import get_settings
from app.routers.zonal_stats import ZonalTilerFactory


def path_params(raster_filename: Annotated[str, Query(description="Raster filename.")]):
    """Dependency to get the path of the raster file."""
    tif_path = get_settings().tif_path
    raster = os.path.join(tif_path, raster_filename)
    if not os.path.exists(raster):
        raise HTTPException(status_code=404, detail=f"Raster file {raster} does not exist.")
    return raster


# Use ORJSONResponse to handle serialization of NaN values. Normal Json fails to serialize NaN values.
app = FastAPI(title="Amazonia360 API", default_response_class=ORJSONResponse)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.add_middleware(AuthMiddleware)

routes = ZonalTilerFactory(path_dependency=path_params)
app.include_router(routes.router)

add_exception_handlers(app, DEFAULT_STATUS_CODES)


@app.get("/tifs")
async def list_files():
    """List all available tif files."""
    tif_path = get_settings().tif_path
    files = os.listdir(tif_path)
    return {"files": sorted(files)}
