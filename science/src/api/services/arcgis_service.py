import json
from typing import Dict

import geopandas as gpd
import httpx
from config import ARC_GIS_BASE_URL, ARC_GIS_TOKEN
from helpers.data_transform import get_aoi, process_geometries


async def fetch_arcgis_data(arcgis_params) -> Dict:
    """
    Creates a query URL and fetches data from the ArcGIS API.

    Parameters:
    - arcgis_params (ArcGISParams): The parameters for the ArcGIS API.

    Returns:
    - dict: The data fetched from the API.
    """
    # Construct the query URL
    query = (
        f"{ARC_GIS_BASE_URL}/{arcgis_params.indicator}/FeatureServer/0/query?f=json"
        f"&geometry={arcgis_params.geometry}"
        f"&outFields=*&returnGeometry={arcgis_params.return_geometry}"
        f"&spatialRel=esriSpatialRelIntersects"
        f"&where=FID is not null&geometryType=esriGeometryPolygon&inSR=102100&outSR=4326"
        f"&token={ARC_GIS_TOKEN}"
    )

    # Make the API request
    async with httpx.AsyncClient() as client:
        response = await client.get(query, timeout=10)
        response.raise_for_status()
        data = response.json()

    return data


async def process_biomes(arcgis_data: Dict, geometry: str) -> Dict:
    """
    Process ArcGIS API data to extract and calculate biomes information.

    Parameters:
    - arcgis_data (dict): Data fetched from the ArcGIS API.
    - geometry (str): ArcGIS-compatible geometry in JSON format.

    Returns:
    - dict: Processed biomes data.
    """
    # Process geometries and Area of Interest (AOI)
    dt = process_geometries(arcgis_data)
    aoi = get_aoi(geometry)

    # Perform intersection operation
    intersection = gpd.overlay(dt, aoi, how="intersection")
    intersection = intersection.to_crs(epsg=3857)

    # Calculate intersected area and area percentages
    intersection["intersected_area"] = intersection["geometry"].area
    intersection["area_percentage"] = (
        intersection["intersected_area"] / intersection["intersected_area"].sum() * 100
    )

    # Rename and structure the result
    intersection.rename(columns={"BIOMADES": "Biome"}, inplace=True)
    data = intersection[["Biome", "area_percentage"]]

    return {"biomes": json.loads(data.to_json(orient="records"))}
