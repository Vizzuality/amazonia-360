from fastapi import APIRouter
from models import ArcGISContextData, DescriptionType, Language
from services.openai_service import generate_description

router = APIRouter()


@router.post("/")
async def get_description(
    context_data: ArcGISContextData,
    description_type: DescriptionType,
    language: Language,
):
    """Generate a description based on context data and audience profile."""
    description = await generate_description(context_data, description_type, language)
    return {"description": description}
