from typing import Literal

from pydantic import BaseModel


class DescriptionType(BaseModel):
    text: Literal["Sort", "Normal", "Long"] = "Normal"


class Language(BaseModel):
    text: Literal["en", "es", "pt"] = "en"
