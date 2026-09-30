import json
import re
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from sqlalchemy import text
from starlette.applications import Starlette

from mcp_server.auth.crypto import digest
from mcp_server.auth.store import AuthStore
from mcp_server.db import create_engine, session_maker
from mcp_server.handlers.area import AreaHandlers
from mcp_server.http_app import create_http_app
from mcp_server.measurement.call_log import CallLog
from tests.auth_helpers import (
    ANA,
    CLAUDE,
    PUBLIC_URL,
    FakeGoogle,
    allow_emails,
    http_settings,
    pkce,
)
from tests.test_handlers import TENA, FakeClient

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.usefixtures("fixed_catalogue"),
]

MCP = {
    "Accept": "application/json, text/event-stream",
    "Content-Type": "application/json",
}
LEGACY = "2025-06-18"


def app_for(database_url: str, tmp_path: Path) -> Starlette:
    return create_http_app(
        http_settings(database_url=database_url),
        google=FakeGoogle(),
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )


@pytest.fixture
async def http(clean_database: str, tmp_path: Path) -> AsyncIterator[httpx.AsyncClient]:
    await allow_emails(clean_database, ANA)
    app = app_for(clean_database, tmp_path)
    async with app.router.lifespan_context(app):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="https://staging.test"
        ) as client:
            yield client


async def register(http: httpx.AsyncClient, redirect: str = CLAUDE) -> httpx.Response:
    return await http.post(
        "/mcp/register",
        json={
            "redirect_uris": [redirect],
            "token_endpoint_auth_method": "none",
            "grant_types": ["authorization_code", "refresh_token"],
            "response_types": ["code"],
            "client_name": "Claude",
        },
    )


async def sign_in(http: httpx.AsyncClient) -> dict[str, Any]:
    """The whole flow a client and its user go through; returns the token response."""
    client_id = (await register(http)).json()["client_id"]
    verifier, challenge = pkce()
    authorize = await http.get(
        "/mcp/authorize",
        params={
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": CLAUDE,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": "s1",
            "resource": PUBLIC_URL,
        },
    )
    assert authorize.status_code == 302, authorize.text
    start = await http.get(authorize.headers["location"])
    pending_id = parse_qs(urlsplit(start.headers["location"]).query)["state"][0]
    page = await http.get(
        "/mcp/oauth/callback", params={"code": "google-ok", "state": pending_id}
    )
    csrf = re.search(r'name="csrf" value="([^"]+)"', page.text)
    assert csrf, page.text
    consent = await http.post(
        "/mcp/oauth/consent",
        data={"p": pending_id, "csrf": csrf.group(1), "decision": "allow"},
    )
    answer = parse_qs(urlsplit(consent.headers["location"]).query)
    # RFC 9207: the client compares iss with the issuer it discovered, byte for byte.
    discovered = (await http.get("/.well-known/oauth-authorization-server/mcp")).json()
    assert answer["iss"] == [discovered["issuer"]]
    code = answer["code"][0]
    token = await http.post(
        "/mcp/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": CLAUDE,
            "client_id": client_id,
            "code_verifier": verifier,
            "resource": PUBLIC_URL,
        },
    )
    assert token.status_code == 200, token.text
    return {**token.json(), "client_id": client_id}


def events(response: httpx.Response) -> list[dict[str, Any]]:
    return [
        json.loads(line.removeprefix("data: "))
        for line in response.text.splitlines()
        if line.startswith("data: ")
    ]


async def open_session(http: httpx.AsyncClient, access_token: str) -> str:
    headers = {**MCP, "Authorization": f"Bearer {access_token}"}
    init = await http.post(
        "/mcp/",
        headers=headers,
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": LEGACY,
                "capabilities": {},
                "clientInfo": {"name": "test", "version": "1"},
            },
        },
    )
    assert init.status_code == 200, init.text
    session = init.headers["mcp-session-id"]
    await http.post(
        "/mcp/",
        headers={**headers, "Mcp-Session-Id": session, "MCP-Protocol-Version": LEGACY},
        json={"jsonrpc": "2.0", "method": "notifications/initialized"},
    )
    return session


async def call(
    http: httpx.AsyncClient, access_token: str, session: str, name: str, args: dict
) -> httpx.Response:
    return await http.post(
        "/mcp/",
        headers={
            **MCP,
            "Authorization": f"Bearer {access_token}",
            "Mcp-Session-Id": session,
            "MCP-Protocol-Version": LEGACY,
        },
        json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": name, "arguments": args},
        },
    )


async def test_discovery_documents_at_the_domain_root(http: httpx.AsyncClient) -> None:
    server = (await http.get("/.well-known/oauth-authorization-server/mcp")).json()
    assert server["issuer"] == PUBLIC_URL
    assert server["authorization_endpoint"] == f"{PUBLIC_URL}/authorize"
    assert server["registration_endpoint"] == f"{PUBLIC_URL}/register"
    assert server["authorization_response_iss_parameter_supported"] is True
    assert "S256" in server["code_challenge_methods_supported"]
    # Claude and ChatGPT register as public PKCE clients (token_endpoint_auth_method
    # "none").
    assert "none" in server["token_endpoint_auth_methods_supported"]
    resource = (await http.get("/.well-known/oauth-protected-resource/mcp")).json()
    assert resource["resource"] == PUBLIC_URL
    assert resource["authorization_servers"] == [PUBLIC_URL]


async def test_without_a_token_the_mcp_points_to_its_metadata(
    http: httpx.AsyncClient,
) -> None:
    response = await http.post("/mcp/", headers=MCP, json={})
    assert response.status_code == 401
    assert (
        "https://staging.test/.well-known/oauth-protected-resource/mcp"
        in response.headers["www-authenticate"]
    )


async def test_the_path_without_a_slash_is_the_mcp(http: httpx.AsyncClient) -> None:
    response = await http.post("/mcp", headers=MCP, json={})
    assert response.status_code == 401


async def test_registration_refuses_a_redirect_off_the_allowlist(
    http: httpx.AsyncClient,
) -> None:
    response = await register(http, "https://evil.test/cb")
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_redirect_uri"


async def test_a_signed_in_client_calls_a_tool(http: httpx.AsyncClient) -> None:
    tokens = await sign_in(http)
    session = await open_session(http, tokens["access_token"])
    response = await call(
        http,
        tokens["access_token"],
        session,
        "area_by_category",
        {"indicator_id": 210, "area": TENA},
    )
    [message] = events(response)
    assert "result" in message, message
    assert not message["result"].get("isError")


async def test_a_token_cannot_use_another_tokens_session(
    http: httpx.AsyncClient,
) -> None:
    first = await sign_in(http)
    second = await sign_in(http)
    session = await open_session(http, first["access_token"])
    response = await call(http, second["access_token"], session, "list_indicators", {})
    assert response.status_code == 404


async def test_the_call_log_names_the_caller(
    http: httpx.AsyncClient, tmp_path: Path
) -> None:
    tokens = await sign_in(http)
    session = await open_session(http, tokens["access_token"])
    await call(
        http,
        tokens["access_token"],
        session,
        "area_by_category",
        {"indicator_id": 210, "area": TENA},
    )
    [line] = (tmp_path / "calls.jsonl").read_text().splitlines()
    assert json.loads(line)["user"] == ANA


async def test_a_wrong_host_is_refused(http: httpx.AsyncClient) -> None:
    tokens = await sign_in(http)
    response = await http.post(
        "/mcp/",
        headers={
            **MCP,
            "Authorization": f"Bearer {tokens['access_token']}",
            "Host": "evil.test",
        },
        json={},
    )
    assert response.status_code == 421


async def test_a_token_issued_for_another_resource_is_refused(
    http: httpx.AsyncClient, clean_database: str
) -> None:
    tokens = await sign_in(http)
    engine = create_engine(clean_database)
    async with engine.begin() as connection:
        await connection.execute(
            text("UPDATE mcp.tokens SET resource = :resource WHERE token_hash = :hash"),
            {
                "resource": "https://other.test/mcp",
                "hash": digest(tokens["access_token"]),
            },
        )
    await engine.dispose()
    response = await http.post(
        "/mcp/",
        headers={**MCP, "Authorization": f"Bearer {tokens['access_token']}"},
        json={},
    )
    assert response.status_code == 401


async def test_a_foreign_origin_is_refused(http: httpx.AsyncClient) -> None:
    tokens = await sign_in(http)
    response = await http.post(
        "/mcp/",
        headers={
            **MCP,
            "Authorization": f"Bearer {tokens['access_token']}",
            "Origin": "https://evil.test",
        },
        json={},
    )
    assert response.status_code == 403


async def test_a_revoked_email_is_refused_on_its_next_request_and_refresh(
    http: httpx.AsyncClient, clean_database: str
) -> None:
    tokens = await sign_in(http)
    session = await open_session(http, tokens["access_token"])
    engine = create_engine(clean_database)
    await AuthStore(session_maker(engine)).revoke(ANA)
    await engine.dispose()
    response = await call(http, tokens["access_token"], session, "list_indicators", {})
    assert response.status_code == 401
    refresh = await http.post(
        "/mcp/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": tokens["refresh_token"],
            "client_id": tokens["client_id"],
        },
    )
    assert refresh.status_code == 400
    assert refresh.json()["error"] == "invalid_grant"


async def test_startup_says_when_nobody_can_sign_in(
    clean_database: str, tmp_path: Path, capsys: pytest.CaptureFixture
) -> None:
    app = app_for(clean_database, tmp_path)
    async with app.router.lifespan_context(app):
        pass
    [line] = [
        line for line in capsys.readouterr().err.splitlines() if "allowlist" in line
    ]
    assert "nobody can sign in" in line and "amazonia360-mcp-db allow" in line


async def test_startup_is_quiet_when_someone_is_allowed(
    clean_database: str, tmp_path: Path, capsys: pytest.CaptureFixture
) -> None:
    await allow_emails(clean_database, ANA)
    app = app_for(clean_database, tmp_path)
    async with app.router.lifespan_context(app):
        pass
    assert "allowlist" not in capsys.readouterr().err
