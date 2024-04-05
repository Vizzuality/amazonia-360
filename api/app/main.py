"""Minimal COG tiler."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from titiler.core.errors import DEFAULT_STATUS_CODES, add_exception_handlers

from auth.auth import AuthMiddleware
from routers.zonal_stats import ZonalTilerFactory

# Use ORJSONResponse to handle serialization of NaN values. Normal Json fails to serialize NaN values.
app = FastAPI(title="Amazonia360 API", default_response_class=ORJSONResponse)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.add_middleware(AuthMiddleware)

routes = ZonalTilerFactory()
app.include_router(routes.router)

add_exception_handlers(app, DEFAULT_STATUS_CODES)
