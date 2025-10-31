"""
Request definition for grid tile requests (GET).
"""

from .base import AuthType, HttpMethod, RequestDefinition
from .tiles.tiles import get_random_h3_tile_id
from .tiles.var_names import get_query_params_with_random_columns


def get_unfiltered_grid_tile_request(
    column_set_cardinality: int = 1,
) -> RequestDefinition:
    """Request definition for getting grid metadata."""
    return RequestDefinition(
        name=f"GET /api/grid/tile ({column_set_cardinality} column(s))",
        method=HttpMethod.GET,
        path=f"/api/grid/tile/{get_random_h3_tile_id()}?{get_query_params_with_random_columns(column_set_cardinality)}",
        auth_type=AuthType.TOKEN,
    )
