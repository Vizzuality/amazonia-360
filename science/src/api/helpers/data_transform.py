import json

import geopandas as gpd
from shapely.geometry import MultiPolygon, Polygon


def process_geometries(data):
    """
    Processes the geometries from the data.

    Parameters:
    data (dict): The data from the query.

    Returns:
    gdf: The geometries as a GeoDataFrame.
    """
    # Extract attributes and geometry
    attributes = [item["attributes"] for item in data["features"]]
    geometry = [
        MultiPolygon([Polygon(ring) for ring in item["geometry"]["rings"]])
        for item in data["features"]
    ]

    # Create GeoDataFrame
    gdf = gpd.GeoDataFrame(attributes, geometry=geometry)

    # Set CRS to EPSG:4326
    gdf.set_crs(epsg=4326, inplace=True)

    return gdf


def get_aoi(geometry):
    """
    Gets the area of interest (AOI) from the geometry.

    Parameters:
    geometry (str): The geometry in JSON format.

    Returns:
    gdf: The AOI as a GeoDataFrame.
    """
    polygon = json.loads(geometry)["rings"][0]
    gdf_poly = gpd.GeoDataFrame([{"name": "polygon"}], geometry=[Polygon(polygon)])
    # Set CRS to ESRI:102100
    gdf_poly.set_crs(epsg=102100, inplace=True)

    # Reproject to EPSG:4326
    gdf_poly = gdf_poly.to_crs(epsg=4326)

    return gdf_poly
