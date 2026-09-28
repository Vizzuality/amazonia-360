import re
from collections.abc import AsyncIterator
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from mcp.server.auth.provider import AuthorizationParams
from mcp.shared.auth import OAuthClientInformationFull
from pydantic import AnyUrl
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.applications import Starlette
from starlette.routing import Mount

from mcp_server.auth.google import GoogleError
from mcp_server.auth.provider import AmazoniaOAuthProvider
from mcp_server.auth.routes import COOKIE, oauth_routes
from mcp_server.auth.store import AuthStore
from tests.auth_helpers import ANA, CLAUDE, PUBLIC_URL, FakeGoogle, http_settings

pytestmark = [pytest.mark.db, pytest.mark.anyio]


@pytest.fixture
async def provider(sessions: async_sessionmaker[AsyncSession]) -> AmazoniaOAuthProvider:
    p = AmazoniaOAuthProvider(AuthStore(sessions), http_settings())
    await p.register_client(
        OAuthClientInformationFull(
            client_id="client-1",
            client_name="Claude <b>",
            redirect_uris=[AnyUrl(CLAUDE)],
            token_endpoint_auth_method="none",
        )
    )
    return p


def app_for(provider: AmazoniaOAuthProvider, google: FakeGoogle) -> httpx.AsyncClient:
    app = Starlette(
        routes=[
            Mount(provider.settings.mount_path, routes=oauth_routes(provider, google))
        ]
    )
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="https://staging.test/mcp"
    )


@pytest.fixture
async def browser(provider: AmazoniaOAuthProvider) -> AsyncIterator[httpx.AsyncClient]:
    async with app_for(provider, FakeGoogle()) as client:
        yield client


async def start(provider: AmazoniaOAuthProvider, browser: httpx.AsyncClient) -> str:
    client = await provider.get_client("client-1")
    assert client is not None
    url = await provider.authorize(
        client,
        AuthorizationParams(
            state="client-state",
            scopes=None,
            code_challenge="challenge",
            redirect_uri=AnyUrl(CLAUDE),
            redirect_uri_provided_explicitly=True,
            resource=PUBLIC_URL,
        ),
    )
    pending_id = parse_qs(urlsplit(url).query)["p"][0]
    response = await browser.get("/oauth/start", params={"p": pending_id})
    assert response.status_code == 302
    assert response.headers["location"].startswith("https://accounts.google.test/auth")
    return pending_id


def hidden(html: str, name: str) -> str:
    match = re.search(rf'name="{name}" value="([^"]+)"', html)
    assert match, f"no hidden field {name}"
    return match.group(1)


async def test_start_sets_a_host_only_secure_cookie(
    provider: AmazoniaOAuthProvider, browser: httpx.AsyncClient
) -> None:
    await start(provider, browser)
    [cookie] = [c for c in browser.cookies.jar if c.name == COOKIE]
    assert cookie.secure
    assert cookie.path == "/"
    assert not cookie.domain_specified


async def test_start_refuses_an_unknown_authorization(
    browser: httpx.AsyncClient,
) -> None:
    response = await browser.get("/oauth/start", params={"p": "nope"})
    assert response.status_code == 400
    assert "expired" in response.text


async def test_the_full_flow_redirects_with_code_state_and_issuer(
    provider: AmazoniaOAuthProvider, browser: httpx.AsyncClient
) -> None:
    pending_id = await start(provider, browser)
    page = await browser.get(
        "/oauth/callback", params={"code": "google-ok", "state": pending_id}
    )
    assert page.status_code == 200
    assert "Claude &lt;b&gt;" in page.text  # the client name is escaped
    assert "claude.ai" in page.text and ANA in page.text
    assert "frame-ancestors 'none'" in page.headers["content-security-policy"]
    assert page.headers["x-frame-options"] == "DENY"
    assert page.headers["cache-control"] == "no-store"
    answer = await browser.post(
        "/oauth/consent",
        data={
            "p": hidden(page.text, "p"),
            "csrf": hidden(page.text, "csrf"),
            "decision": "allow",
        },
    )
    assert answer.status_code == 303
    location = urlsplit(answer.headers["location"])
    assert f"{location.scheme}://{location.netloc}{location.path}" == CLAUDE
    query = parse_qs(location.query)
    assert query["state"] == ["client-state"]
    assert query["iss"] == [PUBLIC_URL]
    client = await provider.get_client("client-1")
    assert client is not None
    assert await provider.load_authorization_code(client, query["code"][0]) is not None


async def test_cancel_redirects_with_access_denied_and_issuer(
    provider: AmazoniaOAuthProvider, browser: httpx.AsyncClient
) -> None:
    pending_id = await start(provider, browser)
    page = await browser.get(
        "/oauth/callback", params={"code": "google-ok", "state": pending_id}
    )
    answer = await browser.post(
        "/oauth/consent",
        data={"p": pending_id, "csrf": hidden(page.text, "csrf"), "decision": "deny"},
    )
    query = parse_qs(urlsplit(answer.headers["location"]).query)
    assert query == {
        "error": ["access_denied"],
        "state": ["client-state"],
        "iss": [PUBLIC_URL],
    }


async def test_a_callback_in_another_browser_is_refused(
    provider: AmazoniaOAuthProvider, browser: httpx.AsyncClient
) -> None:
    pending_id = await start(provider, browser)
    async with app_for(provider, FakeGoogle()) as other_browser:
        response = await other_browser.get(
            "/oauth/callback", params={"code": "google-ok", "state": pending_id}
        )
    assert response.status_code == 400
    assert "this browser" in response.text


@pytest.mark.parametrize(
    ("outcome", "status", "text"),
    [
        (
            GoogleError("Google has not verified this account's email address."),
            400,
            "not verified",
        ),
        ("eve@example.org", 403, "not allowed"),
    ],
)
async def test_the_callback_refuses_accounts_it_cannot_let_in(
    provider: AmazoniaOAuthProvider,
    outcome: str | GoogleError,
    status: int,
    text: str,
) -> None:
    async with app_for(provider, FakeGoogle({"google-x": outcome})) as browser:
        pending_id = await start(provider, browser)
        response = await browser.get(
            "/oauth/callback", params={"code": "google-x", "state": pending_id}
        )
    assert response.status_code == status
    assert text in response.text
    assert "location" not in response.headers


async def test_google_cancelled(browser: httpx.AsyncClient) -> None:
    response = await browser.get(
        "/oauth/callback", params={"error": "access_denied", "state": "x"}
    )
    assert response.status_code == 400
    assert "cancelled" in response.text


async def test_consent_without_the_csrf_token_is_refused(
    provider: AmazoniaOAuthProvider, browser: httpx.AsyncClient
) -> None:
    pending_id = await start(provider, browser)
    await browser.get(
        "/oauth/callback", params={"code": "google-ok", "state": pending_id}
    )
    response = await browser.post(
        "/oauth/consent", data={"p": pending_id, "csrf": "forged", "decision": "allow"}
    )
    assert response.status_code == 400
    assert "location" not in response.headers


async def test_a_second_callback_cannot_swap_the_account(
    provider: AmazoniaOAuthProvider, browser: httpx.AsyncClient
) -> None:
    pending_id = await start(provider, browser)
    await browser.get(
        "/oauth/callback", params={"code": "google-ok", "state": pending_id}
    )
    again = await browser.get(
        "/oauth/callback", params={"code": "google-ok", "state": pending_id}
    )
    assert again.status_code == 400
