"""Minimal COG tiler."""
import os
from typing import Annotated

from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from titiler.core.errors import DEFAULT_STATUS_CODES, add_exception_handlers

from app.auth.auth import AuthMiddleware
from app.config.config import get_settings
from app.routers.zonal_stats import ZonalTilerFactory


def path_params(raster_name: Annotated[str, Query(description="Raster file path.")]):
    """Path params."""
    tif_path = get_settings().tif_path
    raster = os.path.join(tif_path, raster_name)
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
    tif_path = get_settings().tif_path
    files = os.listdir(tif_path)
    return {"files": files}
