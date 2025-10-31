"""
Request definition for grid tiles for given area of interest (GET).
"""

from .base import AuthType, HttpMethod, RequestDefinition
from .tiles.tiles import get_random_h3_tile_id
from .tiles.var_names import get_query_params_with_random_columns

sample_location_as_geojson = {
    "type": "Feature",
    "properties": {},
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [
                [-66.28920852803535, -1.4294240794708786],
                [-65.49000205614962, -1.3450764756133158],
                [-64.57114698508207, -0.3064916827092417],
                [-63.85204138377152, -0.3064916827092417],
                [-61.69472457983989, -1.1054304836470559],
                [-59.77711143115114, -0.7858717894229447],
                [-57.140392681151845, -2.7025082786203214],
                [-56.900694390327025, -4.456822131368899],
                [-58.738404532462155, -7.119599404042611],
                [-60.93586802148312, -8.232595276828333],
                [-63.17308246755033, -10.518599913158814],
                [-65.41030227803557, -9.495710269042068],
                [-67.76736855172422, -4.381615405982965],
                [-66.28920852803535, -1.4294240794708786],
            ]
        ],
    },
}


def get_grid_tile_for_aoi_request(
    column_set_cardinality: int = 1,
) -> RequestDefinition:
    """Request definition for getting grid metadata."""
    return RequestDefinition(
        name=f"POST /api/grid/tile ({column_set_cardinality} column(s))",
        method=HttpMethod.POST,
        path=f"/api/grid/tile/{get_random_h3_tile_id()}?{get_query_params_with_random_columns(column_set_cardinality)}",
        auth_type=AuthType.TOKEN,
        payload=sample_location_as_geojson,
        headers={"Content-Type": "application/json"},
    )
