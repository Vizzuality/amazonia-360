"""
Base models and types for request definitions.

This module contains the core Pydantic models and enums used across
all request definitions.
"""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class HttpMethod(str, Enum):
    """Supported HTTP methods."""

    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


class AuthType(str, Enum):
    """Authentication types."""

    NONE = "none"
    TOKEN = "token"
    BASIC = "basic"


class RequestDefinition(BaseModel):
    """Definition of an HTTP request for load testing.

    Attributes:
        name: Display name for the request in Locust reports
        method: HTTP method (GET, POST, etc.)
        path: URL path (will be appended to host)
        auth_type: Type of authentication to use
        payload: Optional request body (for POST/PUT/PATCH requests)
        headers: Optional additional headers (beyond auth headers)
    """

    name: str = Field(..., description="Display name for the request")
    method: HttpMethod = Field(..., description="HTTP method")
    path: str = Field(..., description="URL path")
    auth_type: AuthType = Field(
        default=AuthType.NONE, description="Authentication type"
    )
    payload: dict[str, Any] | str | None = Field(
        default=None, description="Request payload"
    )
    headers: dict[str, str] | None = Field(
        default=None, description="Additional headers"
    )
