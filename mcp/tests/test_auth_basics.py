import pytest

from mcp_server.auth.crypto import digest, new_secret
from mcp_server.auth.redirects import redirect_allowed
from mcp_server.config import DEFAULT_REDIRECT_URIS


def test_secrets_are_long_and_distinct() -> None:
    values = {new_secret() for _ in range(100)}
    assert len(values) == 100
    assert all(len(v) == 43 for v in values)


def test_digest_is_sha256_hex() -> None:
    assert digest("abc") == (
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )


@pytest.mark.parametrize(
    "uri",
    [
        "https://claude.ai/api/mcp/auth_callback",
        "https://claude.com/api/mcp/auth_callback",
        "https://chatgpt.com/connector_platform_oauth_redirect",
        "http://localhost:6274/oauth/callback",
        "http://127.0.0.1:33418/callback",
        "http://localhost/callback",
    ],
)
def test_allows_the_known_clients(uri: str) -> None:
    assert redirect_allowed(uri, DEFAULT_REDIRECT_URIS)


@pytest.mark.parametrize(
    "uri",
    [
        "https://evil.test/cb",
        "https://claude.ai/api/mcp/auth_callback/extra",
        "https://claude.ai/api/mcp/auth_callback?x=1",
        "http://claude.ai/api/mcp/auth_callback",
        "https://chatgpt.com/connector/oauth/abc123",
        "https://localhost:8443/cb",
        "http://localhost.evil.test/cb",
        "http://localhost@evil.test/cb",
        "http://user@localhost:1234/cb",
        "http://localhost:1234/cb#fragment",
        "http://[::1]:1234/cb",
        "http://localhost:port/cb",
        "not a url",
    ],
)
def test_refuses_everything_else(uri: str) -> None:
    assert not redirect_allowed(uri, DEFAULT_REDIRECT_URIS)


def test_a_loopback_entry_with_a_port_is_exact() -> None:
    allowlist = ["http://localhost:7777/oauth/callback"]
    assert redirect_allowed("http://localhost:7777/oauth/callback", allowlist)
    assert not redirect_allowed("http://localhost:7778/oauth/callback", allowlist)
