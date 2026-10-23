"""Who is asking: a JWT from the front end's backend, or a development token."""

import hmac
from typing import Any, Protocol

import anyio
import jwt

from mcp_server.chat.settings import ChatSettings

AUDIENCE = "amazonia360-ai"
# Asymmetric only: the front end's backend signs, this service only verifies.
ALGORITHMS = ["RS256", "ES256", "EdDSA"]
MAX_LIFETIME_S = 600


class UnauthenticatedError(Exception):
    pass


class SigningKeys(Protocol):
    def get_signing_key_from_jwt(self, token: str) -> Any: ...


class TokenVerifier:
    def __init__(self, settings: ChatSettings, keys: SigningKeys | None = None) -> None:
        self._dev_tokens = settings.dev_tokens
        self._issuer = settings.jwt_issuer
        # PyJWKClient caches the keys and fetches again once for an unknown kid.
        self._keys = (
            (keys or jwt.PyJWKClient(settings.jwks_url, cache_keys=True))
            if settings.jwks_url
            else None
        )

    async def user(self, authorization: str | None) -> str:
        scheme, _, token = (authorization or "").partition(" ")
        token = token.strip()
        if scheme.lower() != "bearer" or not token:
            raise UnauthenticatedError("A bearer token is required.")
        for known, name in self._dev_tokens.items():
            if hmac.compare_digest(known.encode(), token.encode()):
                return name
        if self._keys is None:
            raise UnauthenticatedError("The token is not valid.")
        # The key lookup may fetch the JWKS over the network.
        return await anyio.to_thread.run_sync(self._verify_jwt, token)

    def _verify_jwt(self, token: str) -> str:
        assert self._keys is not None
        try:
            key = self._keys.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                key.key,
                algorithms=ALGORITHMS,
                audience=AUDIENCE,
                issuer=self._issuer,
                options={"require": ["exp", "iat", "sub", "iss", "aud"]},
            )
        except jwt.PyJWTError as exc:
            raise UnauthenticatedError(f"The token is not valid: {exc}") from exc
        if claims["exp"] - claims["iat"] > MAX_LIFETIME_S:
            raise UnauthenticatedError(
                f"The token lives longer than {MAX_LIFETIME_S} seconds."
            )
        subject = claims["sub"]
        if not isinstance(subject, str) or not subject:
            raise UnauthenticatedError("The token has no subject.")
        return subject
