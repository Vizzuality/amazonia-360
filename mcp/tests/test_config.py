import pytest

from mcp_server.config import DEFAULT_REDIRECT_URIS, ConfigError, HttpSettings

ENV = {
    "MCP_PUBLIC_URL": "https://staging.amazoniaforever360.org/mcp/",
    "MCP_DATABASE_URL": "postgresql://mcp:secret@db:5432/amazonia360",
    "MCP_GOOGLE_CLIENT_ID": "client-id",
    "MCP_GOOGLE_CLIENT_SECRET": "client-secret",
}


def test_reads_the_environment() -> None:
    s = HttpSettings.from_env(ENV)
    assert s.public_url == "https://staging.amazoniaforever360.org/mcp"
    assert s.public_host == "staging.amazoniaforever360.org"
    assert s.mount_path == "/mcp"
    assert s.allowed_redirect_uris == DEFAULT_REDIRECT_URIS
    assert s.port == 8000


def test_the_redirect_allowlist_can_be_replaced() -> None:
    s = HttpSettings.from_env(
        {**ENV, "MCP_ALLOWED_REDIRECT_URIS": "https://a.test/cb, http://localhost"}
    )
    assert s.allowed_redirect_uris == ("https://a.test/cb", "http://localhost")


def test_names_every_missing_variable() -> None:
    with pytest.raises(ConfigError) as exc:
        HttpSettings.from_env({"MCP_PUBLIC_URL": ENV["MCP_PUBLIC_URL"]})
    for name in (
        "MCP_DATABASE_URL",
        "MCP_GOOGLE_CLIENT_ID",
        "MCP_GOOGLE_CLIENT_SECRET",
    ):
        assert name in str(exc.value)


def test_the_allowlist_is_not_configuration(capsys: pytest.CaptureFixture) -> None:
    s = HttpSettings.from_env(ENV)
    assert not hasattr(s, "allowed_emails")
    assert capsys.readouterr().err == ""


def test_a_stale_email_list_is_ignored_with_a_warning(
    capsys: pytest.CaptureFixture,
) -> None:
    HttpSettings.from_env({**ENV, "MCP_ALLOWED_EMAILS": "ana@example.org"})
    [line] = capsys.readouterr().err.splitlines()
    assert "MCP_ALLOWED_EMAILS" in line and "ignored" in line
    assert "amazonia360-mcp-db allow" in line


@pytest.mark.parametrize(
    "url",
    ["http://staging.amazoniaforever360.org/mcp", "https://host", "ftp://host/mcp"],
)
def test_refuses_a_public_url_that_is_not_https_with_a_path(url: str) -> None:
    with pytest.raises(ConfigError, match="MCP_PUBLIC_URL"):
        HttpSettings.from_env({**ENV, "MCP_PUBLIC_URL": url})


def test_allows_plain_http_on_localhost() -> None:
    s = HttpSettings.from_env({**ENV, "MCP_PUBLIC_URL": "http://localhost:8000/mcp"})
    assert s.public_host == "localhost:8000"
