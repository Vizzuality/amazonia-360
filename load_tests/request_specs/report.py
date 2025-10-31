"""
Report grid request definition.
"""

from .base import AuthType, HttpMethod, RequestDefinition


def get_report_request() -> RequestDefinition:
    """Request definition for getting report grid."""
    return RequestDefinition(
        name="GET /es/report/grid",
        method=HttpMethod.GET,
        path="/es/report/grid",
        auth_type=AuthType.BASIC,
    )
