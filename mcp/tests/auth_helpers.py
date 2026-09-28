import base64
import hashlib
import os
import secrets
from dataclasses import replace
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlencode

from mcp_server.auth.google import GoogleError
from mcp_server.config import DEFAULT_REDIRECT_URIS, HttpSettings

PUBLIC_URL = "https://staging.test/mcp"
ANA = "ana@example.org"
CLAUDE = "https://claude.ai/api/mcp/auth_callback"


def http_settings(**overrides: Any) -> HttpSettings:
    base = HttpSettings(
        public_url=PUBLIC_URL,
        database_url=os.environ.get("MCP_TEST_DATABASE_URL", ""),
        google_client_id="google-client",
        google_client_secret="google-secret",
        allowed_emails=frozenset({ANA}),
        allowed_redirect_uris=DEFAULT_REDIRECT_URIS,
        port=8000,
    )
    return replace(base, **overrides)


class Clock:
    """A clock the test moves by hand."""

    def __init__(self) -> None:
        self.now = datetime(2026, 9, 28, 12, tzinfo=UTC)

    def __call__(self) -> datetime:
        return self.now

    def advance(self, **delta: float) -> None:
        self.now += timedelta(**delta)


class FakeGoogle:
    """Stands in for Google: each code maps to an email, or to a refusal."""

    def __init__(self, codes: dict[str, str | GoogleError] | None = None) -> None:
        self.codes = codes if codes is not None else {"google-ok": ANA}

    def authorization_url(self, state: str) -> str:
        return "https://accounts.google.test/auth?" + urlencode({"state": state})

    async def verified_email(self, code: str) -> str:
        outcome = self.codes.get(
            code, GoogleError("Google did not accept the sign-in.")
        )
        if isinstance(outcome, GoogleError):
            raise outcome
        return outcome


def pkce() -> tuple[str, str]:
    """A PKCE verifier and its S256 challenge."""
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
    return verifier, challenge.decode().rstrip("=")
