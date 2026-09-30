import pytest
from mcp.server.auth.provider import (
    AccessToken,
    AuthorizationCode,
    AuthorizationParams,
    AuthorizeError,
    OAuthAuthorizationServerProvider,
    RefreshToken,
    RegistrationError,
    TokenError,
)
from mcp.shared.auth import OAuthClientInformationFull
from pydantic import AnyUrl
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from mcp_server.auth.provider import SCOPE, AmazoniaOAuthProvider
from mcp_server.auth.store import AuthStore
from mcp_server.db.models import AllowedEmail
from tests.auth_helpers import ANA, CLAUDE, PUBLIC_URL, Clock, http_settings

pytestmark = [pytest.mark.db, pytest.mark.anyio]


def _conforms(
    p: AmazoniaOAuthProvider,
) -> OAuthAuthorizationServerProvider[AuthorizationCode, RefreshToken, AccessToken]:
    # Never called: pyright fails here if the provider drifts from the SDK protocol.
    return p


def info(*redirects: str) -> OAuthClientInformationFull:
    return OAuthClientInformationFull(
        client_id="client-1",
        client_name="Claude",
        redirect_uris=[AnyUrl(r) for r in redirects or (CLAUDE,)],
        token_endpoint_auth_method="none",
    )


def params(**overrides: object) -> AuthorizationParams:
    base: dict[str, object] = {
        "state": "client-state",
        "scopes": None,
        "code_challenge": "challenge",
        "redirect_uri": AnyUrl(CLAUDE),
        "redirect_uri_provided_explicitly": True,
        "resource": PUBLIC_URL,
    }
    return AuthorizationParams(**{**base, **overrides})  # type: ignore[arg-type]


@pytest.fixture
async def provider(sessions: async_sessionmaker[AsyncSession]) -> AmazoniaOAuthProvider:
    p = AmazoniaOAuthProvider(AuthStore(sessions, clock=Clock()), http_settings())
    await p.register_client(info())
    await p.store.allow(ANA)
    return p


async def signed_in_code(provider: AmazoniaOAuthProvider) -> str:
    """Runs authorize, the Google callback and consent the way Task 7's routes do."""
    client = await provider.get_client("client-1")
    assert client is not None
    url = await provider.authorize(client, params())
    pending_id = url.split("p=", 1)[1]
    store = provider.store
    assert await store.record_login(pending_id, ANA, "csrf")
    pending = await store.take_pending(pending_id, "csrf")
    assert pending is not None
    await store.create_code("the-code", pending)
    return "the-code"


async def tokens(provider: AmazoniaOAuthProvider) -> tuple[str, str]:
    client = await provider.get_client("client-1")
    assert client is not None
    code = await provider.load_authorization_code(
        client, await signed_in_code(provider)
    )
    assert code is not None
    issued = await provider.exchange_authorization_code(client, code)
    assert issued.refresh_token is not None
    return issued.access_token, issued.refresh_token


async def test_refuses_a_client_with_a_redirect_off_the_allowlist(
    provider: AmazoniaOAuthProvider,
) -> None:
    with pytest.raises(RegistrationError) as exc:
        await provider.register_client(info(CLAUDE, "https://evil.test/cb"))
    assert exc.value.error == "invalid_redirect_uri"
    assert "https://evil.test/cb" in (exc.value.error_description or "")


async def test_authorize_sends_the_browser_to_the_start_page(
    provider: AmazoniaOAuthProvider,
) -> None:
    client = await provider.get_client("client-1")
    assert client is not None
    url = await provider.authorize(client, params())
    assert url.startswith(f"{PUBLIC_URL}/oauth/start?p=")
    pending = await provider.store.get_pending(url.split("p=", 1)[1])
    assert pending is not None
    assert pending.scopes == [SCOPE]  # no scope asked for: the only one there is


async def test_authorize_refuses_another_resource(
    provider: AmazoniaOAuthProvider,
) -> None:
    client = await provider.get_client("client-1")
    assert client is not None
    with pytest.raises(AuthorizeError) as exc:
        await provider.authorize(client, params(resource="https://other.test/mcp"))
    assert exc.value.error == "invalid_target"


async def test_the_code_becomes_tokens_for_the_signed_in_email(
    provider: AmazoniaOAuthProvider,
) -> None:
    access, _ = await tokens(provider)
    loaded = await provider.load_access_token(access)
    assert loaded is not None
    assert loaded.subject == ANA
    assert loaded.client_id == "client-1"
    assert loaded.scopes == [SCOPE]
    assert loaded.resource == PUBLIC_URL
    assert loaded.claims == {"iss": PUBLIC_URL}


async def test_a_code_cannot_be_exchanged_twice(
    provider: AmazoniaOAuthProvider,
) -> None:
    client = await provider.get_client("client-1")
    assert client is not None
    code = await provider.load_authorization_code(
        client, await signed_in_code(provider)
    )
    assert code is not None
    await provider.exchange_authorization_code(client, code)
    with pytest.raises(TokenError) as exc:
        await provider.exchange_authorization_code(client, code)
    assert exc.value.error == "invalid_grant"


async def test_a_refresh_rotates_both_tokens(provider: AmazoniaOAuthProvider) -> None:
    client = await provider.get_client("client-1")
    assert client is not None
    access, refresh = await tokens(provider)
    loaded = await provider.load_refresh_token(client, refresh)
    assert loaded is not None and loaded.subject == ANA
    renewed = await provider.exchange_refresh_token(client, loaded, [])
    assert renewed.access_token != access and renewed.refresh_token != refresh
    assert await provider.load_access_token(renewed.access_token) is not None


async def test_a_reused_refresh_token_revokes_its_family(
    provider: AmazoniaOAuthProvider,
) -> None:
    client = await provider.get_client("client-1")
    assert client is not None
    _, refresh = await tokens(provider)
    loaded = await provider.load_refresh_token(client, refresh)
    assert loaded is not None
    renewed = await provider.exchange_refresh_token(client, loaded, [])
    # The stolen copy of the old refresh token comes back.
    assert await provider.load_refresh_token(client, refresh) is None
    assert await provider.load_access_token(renewed.access_token) is None
    assert renewed.refresh_token is not None
    assert await provider.load_refresh_token(client, renewed.refresh_token) is None


async def test_a_refresh_token_belongs_to_its_client(
    provider: AmazoniaOAuthProvider,
) -> None:
    _, refresh = await tokens(provider)
    other = info()
    other.client_id = "client-2"
    await provider.register_client(other)
    assert await provider.load_refresh_token(other, refresh) is None


async def test_a_revoked_email_loses_access_at_once(
    provider: AmazoniaOAuthProvider,
) -> None:
    client = await provider.get_client("client-1")
    assert client is not None
    access, refresh = await tokens(provider)
    revoked = await provider.store.revoke(ANA)
    assert revoked.tokens == 2
    assert await provider.load_access_token(access) is None
    assert await provider.load_refresh_token(client, refresh) is None
    assert await provider.store.get_token(access, "access") is None


async def test_an_email_off_the_table_loses_access_even_with_its_tokens_kept(
    provider: AmazoniaOAuthProvider, sessions: async_sessionmaker[AsyncSession]
) -> None:
    """The per-request check alone, for a row deleted by hand in SQL."""
    client = await provider.get_client("client-1")
    assert client is not None
    access, refresh = await tokens(provider)
    async with sessions() as session:
        await session.execute(delete(AllowedEmail))
        await session.commit()
    assert await provider.store.get_token(access, "access") is not None
    assert await provider.load_access_token(access) is None
    assert await provider.load_refresh_token(client, refresh) is None


async def test_a_code_for_a_revoked_email_is_not_exchanged(
    provider: AmazoniaOAuthProvider, sessions: async_sessionmaker[AsyncSession]
) -> None:
    client = await provider.get_client("client-1")
    assert client is not None
    code = await provider.load_authorization_code(
        client, await signed_in_code(provider)
    )
    assert code is not None
    async with sessions() as session:
        await session.execute(delete(AllowedEmail))
        await session.commit()
    with pytest.raises(TokenError) as exc:
        await provider.exchange_authorization_code(client, code)
    assert exc.value.error == "invalid_grant"


async def test_revoking_an_access_token_revokes_its_refresh_token(
    provider: AmazoniaOAuthProvider,
) -> None:
    client = await provider.get_client("client-1")
    assert client is not None
    access, refresh = await tokens(provider)
    loaded = await provider.load_access_token(access)
    assert loaded is not None
    await provider.revoke_token(loaded)
    assert await provider.load_access_token(access) is None
    assert await provider.load_refresh_token(client, refresh) is None
