"""Minimal COG tiler."""
import os
from typing import Annotated, List, Union

import rasterio
from exactextract import exact_extract
from fastapi import Body, Depends, Query
from geojson_pydantic import Feature, FeatureCollection
from pydantic import BaseModel
from titiler.core.factory import TilerFactory


class StatsProperties(BaseModel):
    """Model for exact_extract result fields."""

    min: Annotated[float, Query(description="Minimum value.")]
    max: Annotated[float, Query(description="Maximum value.")]
    majority: Annotated[
        float,
        Query(
            description="The raster value occupying the greatest number of cells, taking into account cell coverage "
            "fractions but not weighting raster values."
        ),
    ]
    variety: Annotated[
        float,
        Query(description="The number of distinct raster values in cells wholly or partially covered by the polygon."),
    ]


class StatsFeature(BaseModel):
    """Stats response model."""

    type: str
    properties: StatsProperties


class StatsFeatures(BaseModel):
    """Stats response model."""

    features: List[StatsFeature]


class ZonalTilerFactory(TilerFactory):
    """Zonal Tiler Factory"""

    def register_routes(self):
        """Register Zonal Tiler routes."""
        self.tile()
        self.tilejson()
        self.register_exact_zonal_stats()

    def register_exact_zonal_stats(self):
        """Create Zonal Tiler Router"""

        @self.router.post(
            "/exact_zonal_stats",
            response_model=StatsFeatures,
            response_model_exclude_unset=True,
            response_model_exclude_none=True,
            responses={
                200: {
                    "description": "Return the stats of the zonal statistics",
                    "content": {"application/json": {}},
                },
            },
        )
        def exact_zonal_stats(
            geojson: Annotated[
                Union[FeatureCollection, Feature],
                Body(description="GeoJSON Feature or FeatureCollection."),
            ],
            src_path=Depends(self.path_dependency),
            reader_params=Depends(self.reader_dependency),
            env=Depends(self.environment_dependency),
        ) -> StatsFeatures:
            """Compute the zonal statistics of a COG."""
            if isinstance(geojson, FeatureCollection):
                # exact_extract does not understand FeatureCollection currently
                # so extract the features and pass them as a list
                features = geojson.model_dump().get("features", [])
            else:
                features = [geojson.model_dump()]

            with rasterio.Env(**env):
                src_path = os.path.join('/opt/api/data', src_path)
                with rasterio.open(src_path, **reader_params) as src_dst:
                    stats = exact_extract(src_dst, features, ops=["min", "max", "majority", "variety"])
                    return StatsFeatures(features=stats)
