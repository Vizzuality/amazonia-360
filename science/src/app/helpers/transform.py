import json

import geopandas as gpd
from shapely.geometry import Polygon


def transform_polygon_to_rings(geojson):
    """
    Transform a GeoJSON polygon into a format compatible with the ArcGIS API.

    Parameters:
    geojson (dict): A GeoJSON dictionary.

    Returns:
    str: A JSON string with the polygon coordinates.
    """
    poly = Polygon(geojson["geometry"]["coordinates"][0])
    gdf = gpd.GeoDataFrame(index=[0], crs="epsg:4326", geometry=[poly])
    gdf = gdf.to_crs(epsg=102100)
    poly = gdf.geometry[0]
    coordinates = list(poly.exterior.coords)
    # Transform coordinates into the required format
    rings = [[list(coord) for coord in coordinates]]
    poly_dict = {"rings": rings}
    poly_json = json.dumps(poly_dict)
    return poly_json
