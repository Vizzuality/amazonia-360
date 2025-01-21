from pydantic import BaseModel


class ArcGISParams(BaseModel):
    indicator: str = "AFP_Biomas"
    geometry: str
    return_geometry: str = "true"


class ArcGISGeometry(BaseModel):
    geometry: str


class ArcGISContextData(BaseModel):
    data: dict
