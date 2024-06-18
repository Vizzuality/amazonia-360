"""Auth middleware for the API."""

from fastapi import HTTPException
from fastapi.security import HTTPBearer
from starlette.requests import Request
from starlette.status import HTTP_401_UNAUTHORIZED

from app.config.config import get_settings

security = HTTPBearer()


def verify_token(request: Request):
    """Validate API key."""
    auth_token = get_settings().auth_token
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer" or token != auth_token:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    except ValueError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")  # noqa: B904

    return token
