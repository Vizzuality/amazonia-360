from typing import Any, Literal

from fastapi.routing import APIRouter
from pydantic import BaseModel

from app.openai_service import generate_description

router = APIRouter()


class Context(BaseModel):
    data: dict[str, Any]
    language: Literal["en", "es", "pt"] = "en"
    description_type: Literal["Short", "Normal", "Long"] = "Normal"


class DescritionResponse(BaseModel):
    description: str


@router.post("/")
def generate_description_text(
    context: Context,
) -> DescritionResponse:
    """Generate a description based on context data and audience profile."""
    print("****DEBUGGING REQUEST****")
    print(context)
    description = generate_description(context.data, context.description_type, context.language)
    print("****DEBUGGING RESPONSE****")
    return DescritionResponse(description=description)
