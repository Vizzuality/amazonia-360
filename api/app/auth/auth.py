"""Auth middleware for the API."""

from fastapi import HTTPException
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.status import HTTP_401_UNAUTHORIZED

from app.config.config import get_settings

security = HTTPBearer()


def verify_token(request: Request):
    """Validate API key."""
    auth_token = get_settings().auth_token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    try:
        scheme, token = auth_header.split()
        if scheme.lower() != 'bearer' or token != auth_token:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    except ValueError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")  # noqa: B904

    return token


class AuthMiddleware(BaseHTTPMiddleware):
    """Generic auth middleware."""

    async def dispatch(self, request: Request, call_next):  # noqa: D102
        if request.url.path == "/docs" or request.url.path == "/openapi.json" or request.url.path == "/health":
            return await call_next(request)
        request_token = request.headers.get("Authorization")
        if request_token and request_token.startswith("Bearer "):
            request_token = request_token.split("Bearer ")[1]
        if request_token == get_settings().auth_token:
            return await call_next(request)
        else:
            return Response(content="Unauthorized", status_code=401)
