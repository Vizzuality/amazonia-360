"""Auth middleware for the API."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config.config import get_settings

TOKEN = get_settings().auth_token


class AuthMiddleware(BaseHTTPMiddleware):
    """Generic auth middleware."""

    async def dispatch(self, request: Request, call_next):  # noqa: D102
        if request.url.path == "/docs":
            return await call_next(request)

        if request.url.path == "/openapi.json":
            return await call_next(request)

        request_token = request.headers.get("Authorization")
        if request_token and request_token.startswith("Bearer "):
            request_token = request_token.split("Bearer ")[1]
        if request_token == TOKEN:
            return await call_next(request)
        else:
            return Response(content="Unauthorized", status_code=401)
