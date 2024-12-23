from fastapi import APIRouter
from models.arcgis import ArcGISGeometry, ArcGISParams
from models.profile import Profile
from services.arcgis_service import fetch_arcgis_data, process_biomes
from services.openai_service import generate_description

router = APIRouter()


@router.post("/")
async def get_description(arcgis_geometry: ArcGISGeometry, audience_profile: Profile):
    """Generate a description based on geometry and audience profile."""
    arcgis_params = ArcGISParams(
        indicator="AFP_Biomas", geometry=arcgis_geometry.geometry, return_geometry="true"
    )
    arcgis_data = await fetch_arcgis_data(arcgis_params)
    context_data = await process_biomes(arcgis_data, arcgis_geometry.geometry)
    description = await generate_description(context_data, audience_profile)
    return {"description": description}
