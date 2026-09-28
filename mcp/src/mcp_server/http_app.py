import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from urllib.parse import urlsplit

import anyio
import httpx
from mcp.server.auth.routes import (
    build_metadata,
    cors_middleware,
    create_protected_resource_routes,
)
from mcp.server.auth.settings import (
    AuthSettings,
    ClientRegistrationOptions,
    RevocationOptions,
)
from mcp.server.transport_security import TransportSecuritySettings
from pydantic import AnyHttpUrl
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.types import ASGIApp, Receive, Scope, Send

from mcp_server.auth.google import Google, GoogleSignIn
from mcp_server.auth.provider import SCOPE, AmazoniaOAuthProvider
from mcp_server.auth.routes import oauth_routes
from mcp_server.auth.store import AuthStore
from mcp_server.config import HttpSettings
from mcp_server.db import create_engine, session_maker
from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server

SWEEP_EVERY_S = 3600


class _BarePath:
    """Serves /mcp as /mcp/: Claude Desktop strips the trailing slash, and a redirect
    would turn its POST into a GET."""

    def __init__(self, app: ASGIApp, path: str) -> None:
        self._app = app
        self._path = path

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["path"] == self._path:
            scope = {
                **scope,
                "path": self._path + "/",
                "raw_path": (self._path + "/").encode(),
            }
        await self._app(scope, receive, send)


async def _sweep(store: AuthStore) -> None:
    while True:
        try:
            await store.delete_expired()
        except Exception as exc:  # the sweep must outlive a database hiccup
            print(f"expired OAuth rows not deleted: {exc}", file=sys.stderr)
        await anyio.sleep(SWEEP_EVERY_S)


def create_http_app(
    settings: HttpSettings,
    *,
    google: GoogleSignIn | None = None,
    handlers: AreaHandlers | None = None,
    call_log: CallLog | None = None,
) -> Starlette:
    engine = create_engine(settings.database_url)
    store = AuthStore(session_maker(engine))
    provider = AmazoniaOAuthProvider(store, settings)
    http = httpx.AsyncClient(timeout=10)
    google = google or Google(
        http,
        settings.google_client_id,
        settings.google_client_secret,
        f"{settings.public_url}/oauth/callback",
    )
    registration = ClientRegistrationOptions(
        enabled=True, valid_scopes=[SCOPE], default_scopes=[SCOPE]
    )
    revocation = RevocationOptions(enabled=True)
    issuer = AnyHttpUrl(settings.public_url)
    server = create_mcp_server(
        handlers,
        call_log,
        auth=AuthSettings(
            issuer_url=issuer,
            resource_server_url=issuer,
            client_registration_options=registration,
            revocation_options=revocation,
            required_scopes=[SCOPE],
            validate_token_resource=True,
        ),
        auth_server_provider=provider,
    )
    for route in oauth_routes(provider, google):
        server.custom_route(route.path, methods=sorted(route.methods or ["GET"]))(
            route.endpoint
        )
    origin = f"{urlsplit(settings.public_url).scheme}://{settings.public_host}"
    mcp_app = server.streamable_http_app(
        streamable_http_path="/",
        transport_security=TransportSecuritySettings(
            allowed_hosts=[settings.public_host], allowed_origins=[origin]
        ),
    )

    metadata = build_metadata(issuer, None, registration, revocation)
    # RFC 9207; the SDK has the field but does not set it.
    metadata.authorization_response_iss_parameter_supported = True
    metadata_json = metadata.model_dump(mode="json", exclude_none=True)

    async def authorization_server(request: Request) -> Response:
        return JSONResponse(
            metadata_json, headers={"Cache-Control": "public, max-age=3600"}
        )

    path = settings.mount_path
    routes = [
        # Discovery at the domain root, where RFC 8414 and RFC 9728 put it for an
        # issuer and a resource with a path.
        Route(
            f"/.well-known/oauth-authorization-server{path}",
            cors_middleware(authorization_server, ["GET", "OPTIONS"]),
            methods=["GET", "OPTIONS"],
        ),
        *create_protected_resource_routes(
            issuer, [issuer], scopes_supported=[SCOPE], resource_name="Amazonia 360 MCP"
        ),
        Mount(path, app=mcp_app),
    ]

    @asynccontextmanager
    async def lifespan(app: Starlette) -> AsyncIterator[None]:
        # A mounted app's lifespan does not run, so the session manager runs here.
        async with server.session_manager.run():
            async with anyio.create_task_group() as tasks:
                tasks.start_soon(_sweep, store)
                yield
                tasks.cancel_scope.cancel()
        await http.aclose()
        await engine.dispose()

    app = Starlette(routes=routes, lifespan=lifespan)
    app.add_middleware(_BarePath, path=path)
    return app
