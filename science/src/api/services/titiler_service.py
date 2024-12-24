import json
from typing import Dict

import httpx
import pandas as pd
from config import TITILER_BASE_URL, TITILER_TOKEN


async def fetch_titiler_data(titiler_params) -> Dict:
    """
    Creates a query URL and fetches data from the TiTiler API.

    Parameters:
    - titiler_params (TiTilerParams): The parameters for the TiTiler API.

    Returns:
    - dict: The data fetched from the API.
    """
    # Construct the query URL
    query = (
        f"{TITILER_BASE_URL}raster_filename={titiler_params.dataset}&"
        f"statistics=frac&statistics=unique"
    )

    # Define the headers
    headers = {"Authorization": f"Bearer {TITILER_TOKEN}", "Content-Type": "application/json"}

    # Make the API request
    async with httpx.AsyncClient() as client:
        response = await client.post(
            query, headers=headers, json=titiler_params.geometry, timeout=10
        )
        response.raise_for_status()
        data = response.json()

    return data


async def process_land_cover_data(titiler_data: Dict) -> Dict:
    """
    Process TiTiler API data to extract land cover information.

    Parameters:
    - titiler_data (dict): Data fetched from the TiTiler API.

    Returns:
    - dict: Processed land cover data.
    """

    lc_classes = {
        10: "Tree cover",
        20: "Shrubland",
        30: "Grassland",
        40: "Cropland",
        50: "Built-up",
        60: "Bare and sparse vegetation",
        70: "Snow and Ice",
        80: "Permanent water bodies",
        90: "Herbaceous wetland",
        95: "Mangroves",
        100: "Moss and lichen",
    }

    data = pd.DataFrame(titiler_data["features"][0]["properties"])
    data["class"] = data["unique"].map(lc_classes)
    data.drop(columns=["unique"], inplace=True)
    data.rename(columns={"frac": "area_fraction"}, inplace=True)

    return {"land cover": json.loads(data.to_json(orient="records"))}
