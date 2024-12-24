from fastapi import APIRouter
from models.arcgis import ArcGISGeometry, ArcGISParams
from services.arcgis_service import fetch_arcgis_data, process_basins, process_biomes

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


@router.post("/basis")
async def get_basins_data(arcgis_geometry: ArcGISGeometry):
    """Fetch basins data."""
    arcgis_params = ArcGISParams(
        indicator="AFP_Grandes_cuencas_hidrograficas",
        geometry=arcgis_geometry.geometry,
        return_geometry="true",
    )
    arcgis_data = await fetch_arcgis_data(arcgis_params)
    return await process_basins(arcgis_data, arcgis_geometry.geometry)


@router.post("/physical_environment")
async def get_physical_environment_data(arcgis_geometry: ArcGISGeometry):
    """Fetch Natural Physical Environment data."""
    biomes_data = await get_biomes_data(arcgis_geometry)
    basins_data = await get_basins_data(arcgis_geometry)
    return {**biomes_data, **basins_data}
