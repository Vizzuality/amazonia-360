from fastapi import APIRouter
from models.arcgis import ArcGISGeometry, ArcGISParams
from services.arcgis_service import fetch_arcgis_data, process_biomes

router = APIRouter()


@router.post("/")
async def get_arcgis_data(arcgis_params: ArcGISParams):
    """Fetch data from the ArcGIS API."""
    return await fetch_arcgis_data(arcgis_params)


@router.post("/biomes")
async def get_biomes_data(arcgis_geometry: ArcGISGeometry):
    """Fetch biomes data."""
    arcgis_params = ArcGISParams(
        indicator="AFP_Biomas", geometry=arcgis_geometry.geometry, return_geometry="true"
    )
    arcgis_data = await fetch_arcgis_data(arcgis_params)
    return await process_biomes(arcgis_data, arcgis_geometry.geometry)
