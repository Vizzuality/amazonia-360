"""
Indicators request definition.
"""

from .base import AuthType, HttpMethod, RequestDefinition


def get_indicators_request() -> RequestDefinition:
    """Request definition for getting indicators with bounding box."""
    return RequestDefinition(
        name="GET /es/report/indicators",
        method=HttpMethod.GET,
        path="/es/report/indicators?bbox=-18088914.17579878%2C-4006854.261100858%2C696249.8955611419%2C2959310.748695113&_rsc=1uviz",
        auth_type=AuthType.BASIC,
    )
