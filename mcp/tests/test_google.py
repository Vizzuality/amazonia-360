from urllib.parse import parse_qs, urlsplit

import httpx
import pytest

from mcp_server.auth.google import TOKEN_URL, USERINFO_URL, Google, GoogleError

pytestmark = pytest.mark.anyio

REDIRECT = "https://staging.test/mcp/oauth/callback"


def google(handler: httpx.MockTransport) -> Google:
    return Google(httpx.AsyncClient(transport=handler), "cid", "csecret", REDIRECT)


def responder(
    token: tuple[int, dict] = (200, {"access_token": "g-access"}),
    userinfo: tuple[int, dict] = (
        200,
        {"email": "Ana@Example.org", "email_verified": True},
    ),
) -> httpx.MockTransport:
    def handle(request: httpx.Request) -> httpx.Response:
        if str(request.url) == TOKEN_URL:
            body = parse_qs(request.content.decode())
            assert body["code"] == ["the-code"]
            assert body["client_id"] == ["cid"]
            assert body["client_secret"] == ["csecret"]
            assert body["redirect_uri"] == [REDIRECT]
            assert body["grant_type"] == ["authorization_code"]
            return httpx.Response(token[0], json=token[1])
        if str(request.url) == USERINFO_URL:
            assert request.headers["authorization"] == "Bearer g-access"
            return httpx.Response(userinfo[0], json=userinfo[1])
        raise AssertionError(f"unexpected request to {request.url}")

    return httpx.MockTransport(handle)


def test_the_authorization_url_asks_for_email_and_an_account_choice() -> None:
    url = google(responder()).authorization_url("state-1")
    query = parse_qs(urlsplit(url).query)
    assert query == {
        "client_id": ["cid"],
        "redirect_uri": [REDIRECT],
        "response_type": ["code"],
        "scope": ["openid email"],
        "state": ["state-1"],
        "prompt": ["select_account"],
    }


async def test_returns_the_verified_email_lowercased() -> None:
    assert await google(responder()).verified_email("the-code") == "ana@example.org"


@pytest.mark.parametrize(
    ("token", "userinfo", "message"),
    [
        ((400, {"error": "invalid_grant"}), (200, {}), "did not accept"),
        ((200, {}), (200, {}), "did not accept"),
        ((200, {"access_token": "g-access"}), (401, {}), "did not return"),
        (
            (200, {"access_token": "g-access"}),
            (200, {"email": "ana@example.org", "email_verified": False}),
            "not verified",
        ),
        (
            (200, {"access_token": "g-access"}),
            (200, {"email": "ana@example.org", "email_verified": "true"}),
            "not verified",
        ),
        (
            (200, {"access_token": "g-access"}),
            (200, {"email_verified": True}),
            "did not return",
        ),
    ],
)
async def test_refuses_what_google_does_not_vouch_for(
    token: tuple[int, dict], userinfo: tuple[int, dict], message: str
) -> None:
    with pytest.raises(GoogleError, match=message):
        await google(responder(token, userinfo)).verified_email("the-code")


async def test_a_token_answer_that_is_not_json_is_refused() -> None:
    def html(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="<html>maintenance</html>")

    with pytest.raises(GoogleError, match="did not accept"):
        await google(httpx.MockTransport(html)).verified_email("the-code")


async def test_a_network_failure_is_a_google_error() -> None:
    def fail(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("down")

    with pytest.raises(GoogleError, match="could not be reached"):
        await google(httpx.MockTransport(fail)).verified_email("the-code")
