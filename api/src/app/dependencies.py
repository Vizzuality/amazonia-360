from typing import Annotated

from fastapi import Depends, Query
from fastapi.params import Body
from geojson_pydantic import Feature

from app.config import get_settings
from app.repository.grid import H3TilesRepository


def colum_filter(
    columns: list[str] = Query(
        [],
        description="Column/s to include in the tile. If empty, it returns only cell indexes.",
    ),
):
    return columns


def feature_filter(
    geojson: Annotated[Feature, Body(description="GeoJSON feature used to filter the cells.")],
):
    return geojson


ColumnNamesDep = Annotated[list[str], Depends(colum_filter)]
FeatureDep = Annotated[Feature, Depends(feature_filter)]


def get_h3tile_repository():
    return H3TilesRepository(
        get_settings().grid_tiles_path.unicode_string(), get_settings().tile_to_cell_resolution_diff
    )


GridRepositoryDep = Annotated[H3TilesRepository, Depends(get_h3tile_repository)]
