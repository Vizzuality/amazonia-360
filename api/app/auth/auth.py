"""Auth dependency for the API."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.status import HTTP_401_UNAUTHORIZED

from app.config.config import get_settings

security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate API key."""
    auth_token = get_settings().auth_token
    in_token = credentials.credentials

    if in_token != auth_token:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Unauthorized")
