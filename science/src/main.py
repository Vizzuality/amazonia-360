from fastapi import FastAPI
from pydantic import BaseModel

from apis.context_data import get_arcgis_api_response, get_biomes
from apis.description import get_openai_api_response

app = FastAPI()


class Bbox(BaseModel):
    min_lon: float = -16.974
    min_lat: float = 27.986
    max_lon: float = -16.101
    max_lat: float = 28.595


class ArcGISParams(BaseModel):
    """
    ArcGIS API parameters
    """

    indicator: str = "AFP_Biomas"
    geometry: str
    return_geometry: str = "true"


class ArcGISGeometry(BaseModel):
    """
    ArcGIS API compatible geometry
    """

    geometry: str


class Profile(BaseModel):
    """
    Audience profile for the description
    """

    text: str = "General Public"


@app.post("/arcgis")
async def get_arcgis_data(arcgis_params: ArcGISParams):
    """
    Get data from the ArcGIS API.
    """
    arcgis_data = await get_arcgis_api_response(arcgis_params)
    return arcgis_data


@app.post("/arcgis/biomes")
async def get_biomes_data(arcgis_geometry: ArcGISGeometry):
    arcgis_params = ArcGISParams(
        indicator="AFP_Biomas", geometry=arcgis_geometry.geometry, return_geometry="true"
    )
    arcgis_data = await get_arcgis_api_response(arcgis_params)
    biomes_data = await get_biomes(arcgis_data, arcgis_geometry.geometry)
    return biomes_data


@app.post("/description")
async def get_description(arcgis_geometry: ArcGISGeometry, audience_profile: Profile):
    context_data = await get_biomes_data(arcgis_geometry)
    description = await get_openai_api_response(data=context_data, profile=audience_profile)
    return {"description": description}
