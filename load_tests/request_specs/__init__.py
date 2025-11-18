"""
Request specifications for load testing.

This module provides a centralized import point for all request definitions.
Each request is defined in its own file for better organization and maintainability.

Usage:
    from request_specs import get_all_requests, RequestDefinition, HttpMethod, AuthType

    # Or import specific requests
    from request_specs import get_meta_request, get_report_request
"""

# Export base types and models
from .base import AuthType, HttpMethod, RequestDefinition
from .grid_tile import get_unfiltered_grid_tile_request
from .grid_tile_for_aoi import get_grid_tile_for_aoi_request

# Export individual request definitions
from .indicators import get_indicators_request
from .meta import get_meta_request
from .report import get_report_request
from .results import get_results_request

# Define what gets exported with "from request_specs import *"
__all__ = [
    # Base types
    "RequestDefinition",
    "HttpMethod",
    "AuthType",
    # Request functions
    "get_meta_request",
    "get_report_request",
    "get_indicators_request",
    "get_results_request",
    "get_unfiltered_grid_tile_request",
    "get_grid_tile_for_aoi_request",
    # Registry
    "get_all_requests",
]


def get_all_requests() -> list[RequestDefinition]:
    """Get all request definitions to be used in load tests.

    This is the main registry function that returns all active request definitions.
    To add a new request:
    1. Create a new file in the request_specs/ directory
    2. Import the request function at the top of this file
    3. Add it to the __all__ list
    4. Add the function call to the list below

    Returns:
        List of all request definitions that will be converted to Locust tasks.
    """
    requests = [
        get_meta_request(),
        get_report_request(),
        get_indicators_request(),
        get_results_request(),
    ]

    # Originally including requests for grid tiles with 16 or 64 columns, to
    # exert maximum stress on the system. In practice these kinds of requests
    # are not used at all from the frontend application, so we limit the number
    # of columns to 4 here.
    for num_columns in [1, 4]:
        requests.append(get_unfiltered_grid_tile_request(num_columns))
        requests.append(get_grid_tile_for_aoi_request(num_columns))

    return requests
