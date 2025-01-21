from fastapi import APIRouter
from models.arcgis import ArcGISContextData
from models.profile import Profile
from services.openai_service import generate_description

router = APIRouter()


@router.post("/")
async def get_description(context_data: ArcGISContextData, audience_profile: Profile):
    """Generate a description based on context data and audience profile."""
    description = await generate_description(context_data, audience_profile)
    return {"description": description}
