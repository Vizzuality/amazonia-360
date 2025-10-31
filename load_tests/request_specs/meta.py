"""
Grid metadata request definition.
"""

from .base import AuthType, HttpMethod, RequestDefinition


def get_meta_request() -> RequestDefinition:
    """Request definition for getting grid metadata."""
    return RequestDefinition(
        name="GET /api/grid/meta",
        method=HttpMethod.GET,
        path="/api/grid/meta",
        auth_type=AuthType.TOKEN,
    )
