import json
import os

import dotenv
import geopandas as gpd
import requests

from .utils import get_aoi, process_geometries

dotenv.load_dotenv()


async def get_arcgis_api_response(arcgis_params):
    """
    Creates a query URL for the ArcGIS service.

    Parameters:
    arcgis_params (ArcGISParams): The parameters for the ArcGIS API.

    Returns:
    dict: The data from the query.
    """
    base_url = "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services"
    token = os.getenv("ESRI_TOKEN")

    # Create query
    query = (
        f"{base_url}/{arcgis_params.indicator}/FeatureServer/0/query?f=json"
        f"&geometry={arcgis_params.geometry}"
        f"&outFields=*&returnGeometry={arcgis_params.return_geometry}"
        f"&spatialRel=esriSpatialRelIntersects"
        f"&where=FID is not null&geometryType=esriGeometryPolygon&inSR=102100&outSR=4326"
        f"&token={token}"
    )

    # Make request with timeout
    r = requests.get(query, timeout=10)
    data = json.loads(r.text)

    return data


async def get_biomes(arcgis_data, geometry):
    """
    Get the biomes data from the ArcGIS API response.

    Parameters:
    arcgis_data (dict): The data from the ArcGIS API.
    geometry (str): ArcGIS compatible geometry in JSON format.

    Returns:
    dict: The biomes data.
    """
    dt = process_geometries(arcgis_data)
    aoi = get_aoi(geometry)

    intersection = gpd.overlay(dt, aoi, how="intersection")
    intersection = intersection.to_crs(epsg=4326)
    intersection.set_crs(epsg=4326, inplace=True)

    intersection["intersected_area"] = intersection["geometry"].area
    # Calculate proportion of each intersection relative to area of aoi:
    intersection["area_percentage"] = (
        intersection["intersected_area"] / intersection["intersected_area"].sum() * 100
    )
    intersection.rename(columns={"BIOMADES": "Biome"}, inplace=True)

    data = intersection[["Biome", "area_percentage"]]

    return {"biomes": json.loads(data.to_json(orient="records"))}
