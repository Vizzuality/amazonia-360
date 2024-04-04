"""Minimal COG tiler."""
from typing import Annotated, Union, List

import rasterio
from exactextract import exact_extract
from fastapi.responses import ORJSONResponse
from geojson_pydantic import FeatureCollection, Feature
from pydantic import BaseModel
from titiler.core.factory import TilerFactory
from titiler.core.errors import DEFAULT_STATUS_CODES, add_exception_handlers
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, Body, Depends


class StatsProperties(BaseModel):
    min: float
    max: float
    mean: float


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
        super().register_routes()
        self.register_exact_zonal_stats()

    def register_exact_zonal_stats(self):
        """Create Zonal Tiler Router"""

        @self.router.post(
            "/exact_zonal_stats",
            response_model=StatsFeatures,
            response_model_exclude_unset=True,
            response_model_exclude_none=True,
            responses={
                200:
                    {
                        "description": "Return the stats of the zonal statistics",
                        "content": {"application/json": {}},
                    },
            }
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
                with rasterio.open(src_path, **reader_params) as src_dst:
                    stats = exact_extract(src_dst, features, ops=["min", "max", "mean"])
                    return StatsFeatures(features=stats)


# Use ORJSONResponse to handle serialization of NaN values. Normal Json fails to serialize NaN values.
app = FastAPI(title="My simple app", default_response_class=ORJSONResponse)

routes = ZonalTilerFactory()
app.include_router(routes.router)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

add_exception_handlers(app, DEFAULT_STATUS_CODES)
