"""Minimal COG tiler."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from titiler.core.errors import DEFAULT_STATUS_CODES, add_exception_handlers

from app.modules.zonal_stats import ZonalTilerFactory

# Use ORJSONResponse to handle serialization of NaN values. Normal Json fails to serialize NaN values.
app = FastAPI(title="My simple app", default_response_class=ORJSONResponse)

routes = ZonalTilerFactory()
app.include_router(routes.router)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

add_exception_handlers(app, DEFAULT_STATUS_CODES)
