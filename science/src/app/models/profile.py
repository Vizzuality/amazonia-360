from pydantic import BaseModel


class Profile(BaseModel):
    text: str = "General Public"
