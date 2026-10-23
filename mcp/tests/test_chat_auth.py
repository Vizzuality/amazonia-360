import time
from dataclasses import replace
from pathlib import Path
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm

from mcp_server.chat.auth import AUDIENCE, TokenVerifier, UnauthenticatedError
from mcp_server.chat.settings import ChatSettings
from mcp_server.config import ConfigError

pytestmark = pytest.mark.anyio

ISSUER = "https://front.test"
DEV = "d" * 32
KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


class Keys:
    """Stands in for PyJWKClient: one known key."""

    def get_signing_key_from_jwt(self, token: str) -> Any:
        return jwt.PyJWK.from_dict(
            {
                **RSAAlgorithm.to_jwk(KEY.public_key(), as_dict=True),
                "alg": "RS256",
            }
        )


def settings(**changes: Any) -> ChatSettings:
    base = ChatSettings(
        model="sonnet",
        dev_tokens={DEV: "ana"},
        jwks_url="https://front.test/.well-known/jwks.json",
        jwt_issuer=ISSUER,
        allowed_origins=(),
        max_turns=60,
        max_seconds=300,
        run_log_path=Path("var/chat-runs.jsonl"),
    )
    return replace(base, **changes)


def token(lifetime: int = 300, **claims: Any) -> str:
    now = int(time.time())
    payload = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "sub": "user-7",
        "iat": now,
        "exp": now + lifetime,
        **claims,
    }
    return jwt.encode(payload, KEY, algorithm="RS256")


async def user(header: str | None, **changes: Any) -> str:
    return await TokenVerifier(settings(**changes), keys=Keys()).user(header)


async def test_a_development_token_names_its_developer() -> None:
    assert await user(f"Bearer {DEV}") == "ana"


async def test_a_jwt_gives_its_subject() -> None:
    assert await user(f"Bearer {token()}") == "user-7"


@pytest.mark.parametrize(
    "header",
    [None, "", "Bearer", f"Basic {DEV}", "Bearer " + "x" * 32],
)
async def test_a_missing_or_unknown_token_is_refused(header: str | None) -> None:
    with pytest.raises(UnauthenticatedError):
        await user(header)


@pytest.mark.parametrize(
    "bad",
    [
        {"aud": "another-api"},
        {"iss": "https://elsewhere.test"},
        {"exp": int(time.time()) - 10},
    ],
)
async def test_a_jwt_for_another_audience_issuer_or_time_is_refused(bad: dict) -> None:
    with pytest.raises(UnauthenticatedError):
        await user(f"Bearer {token(**bad)}")


async def test_a_long_lived_jwt_is_refused() -> None:
    with pytest.raises(UnauthenticatedError, match="longer"):
        await user(f"Bearer {token(lifetime=3600)}")


async def test_a_jwt_signed_with_a_shared_secret_is_refused() -> None:
    now = int(time.time())
    forged = jwt.encode(
        {"iss": ISSUER, "aud": AUDIENCE, "sub": "x", "iat": now, "exp": now + 60},
        "s" * 32,
        algorithm="HS256",
    )
    with pytest.raises(UnauthenticatedError):
        await user(f"Bearer {forged}")


async def test_without_a_jwks_only_development_tokens_count() -> None:
    with pytest.raises(UnauthenticatedError):
        await user(f"Bearer {token()}", jwks_url=None)


def test_development_tokens_are_read_as_name_token_pairs() -> None:
    read = ChatSettings.from_env({"MCP_CHAT_DEV_TOKENS": f"ana:{DEV}, luis:{'l' * 40}"})
    assert dict(read.dev_tokens) == {DEV: "ana", "l" * 40: "luis"}
    assert read.has_auth
    assert read.local_origins is not None


@pytest.mark.parametrize(
    "raw",
    ["ana", f"ana:{'s' * 10}", f"ana:{DEV},luis:{DEV}", f":{DEV}"],
)
def test_a_bad_development_token_list_stops_the_server(raw: str) -> None:
    with pytest.raises(ConfigError):
        ChatSettings.from_env({"MCP_CHAT_DEV_TOKENS": raw})


def test_a_jwks_needs_an_issuer() -> None:
    with pytest.raises(ConfigError):
        ChatSettings.from_env({"MCP_CHAT_JWKS_URL": "https://front.test/jwks"})


def test_with_nothing_set_the_chat_has_no_authentication() -> None:
    read = ChatSettings.from_env({})
    assert not read.has_auth
    assert read.local_origins is None
