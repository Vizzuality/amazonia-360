from fastapi import FastAPI
from routers import arcgis, description

app = FastAPI()

# Include routers
app.include_router(arcgis.router, prefix="/arcgis", tags=["ArcGIS"])
app.include_router(description.router, prefix="/description", tags=["Description"])
