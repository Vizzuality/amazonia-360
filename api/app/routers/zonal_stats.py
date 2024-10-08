"""Minimal COG tiler."""

from typing import Annotated, List, Union

import rasterio
from exactextract import exact_extract
from fastapi import Body, Depends, Query
from geojson_pydantic import Feature, FeatureCollection
from titiler.core.factory import TilerFactory

from app.models.zonal_stats import StatsFeatures, StatsOps


class ZonalTilerFactory(TilerFactory):
    """Zonal Tiler Factory"""

    def register_routes(self):
        """Register Zonal Tiler routes."""
        self.point()
        self.register_exact_zonal_stats()
        self.tile()
        self.tilejson()

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
            statistics: Annotated[
                List[StatsOps],
                Query(
                    title="Statistics",
                    description="Statistics to compute. See `StatsProperties` for more details.",
                ),
            ] = ("min", "max"),
            src_path=Depends(self.path_dependency),
            reader_params=Depends(self.reader_dependency),
            env=Depends(self.environment_dependency),
        ) -> StatsFeatures:
            """Compute the zonal statistics of a raster.

            Powered by [`exact_extract`](https://github.com/isciences/exactextract).
            """
            if isinstance(geojson, FeatureCollection):
                # exact_extract does not understand FeatureCollection currently
                # so extract the features and pass them as a list
                features = geojson.model_dump().get("features", [])
            else:
                features = [geojson.model_dump()]

            with rasterio.Env(**env):
                with rasterio.open(src_path, **reader_params) as src_dst:
                    statistics = [op.value for op in statistics]  # extract the values from the Enum
                    stats = exact_extract(src_dst, features, ops=statistics)
                    return StatsFeatures(features=stats)
