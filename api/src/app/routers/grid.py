import logging
from typing import Annotated

import shapely
from fastapi import APIRouter, Depends, Path, Query
from fastapi.responses import Response
from geojson_pydantic import Feature

from app.dependencies import ColumnNamesDep, FeatureDep, GridRepositoryDep
from app.models.grid import (
    MultiDatasetMeta,
    TableFilters,
    TableResults,
)

log = logging.getLogger("uvicorn.error")  # Show the logs in the uvicorn runner logs

grid_router = APIRouter()


class ArrowIPCResponse(Response):  # noqa: D101
    media_type = "application/octet-stream"


@grid_router.get(
    "/tile/{tile_index}",
    summary="Get a grid tile",
    response_class=ArrowIPCResponse,
    response_description="Arrow IPC table",
)
def grid_tile(
    tile_index: Annotated[str, Path(description="The `h3` index of the tile")],
    columns: ColumnNamesDep,
    repo: GridRepositoryDep,
) -> ArrowIPCResponse:
    """Get a tile of h3 cells with specified data columns"""
    tile = repo.tile_as_ipc_bytes(tile_index, columns)
    return ArrowIPCResponse(tile)


@grid_router.post(
    "/tile/{tile_index}",
    summary="Get a grid tile with cells contained inside the GeoJSON",
    response_class=ArrowIPCResponse,
    response_description="Arrow IPC table",
)
def grid_tile_in_area(
    tile_index: Annotated[str, Path(description="The `h3` index of the tile")],
    geojson: FeatureDep,
    columns: ColumnNamesDep,
    repo: GridRepositoryDep,
) -> ArrowIPCResponse:
    """Get a tile of h3 cells that are inside the polygon"""
    geom = shapely.from_geojson(geojson.model_dump_json())
    tile = repo.tile_in_area_as_ipc_bytes(tile_index, columns, geom)
    return ArrowIPCResponse(tile)


@grid_router.get(
    "/meta",
    summary="Dataset metadata",
)
async def grid_dataset_metadata(repo: GridRepositoryDep) -> MultiDatasetMeta:
    """Get the grid dataset metadata"""
    meta = repo.get_meta()
    return meta


@grid_router.post(
    "/meta",
    summary="Dataset metadata for feature selection",
)
async def grid_dataset_metadata_in_area(
    geojson: FeatureDep,
    columns: ColumnNamesDep,
    repo: GridRepositoryDep,
    level: Annotated[int, Query(..., description="Tile level at which the query will be computed")] = 1,
) -> MultiDatasetMeta:
    """Get the grid dataset metadata with updated min and max for the area"""
    geom = shapely.from_geojson(geojson.model_dump_json())
    meta = repo.meta_for_region(geom, columns, level)
    return meta


@grid_router.post("/table")
def read_table(
    level: Annotated[int, Query(..., description="Tile level at which the query will be computed")],
    repo: GridRepositoryDep,
    filters: TableFilters = Depends(),
    geojson: Feature | None = None,
) -> TableResults:
    """Query tile dataset and return table data"""
    geom = None
    if geojson is not None:
        geom = shapely.from_geojson(geojson.model_dump_json())
    return repo.get_table(level, filters, geom)
