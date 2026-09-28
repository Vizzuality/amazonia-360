import hmac
from functools import partial
from urllib.parse import urlsplit

from mcp.server.auth.provider import construct_redirect_uri
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response
from starlette.routing import Route

from mcp_server.auth.crypto import digest, new_secret
from mcp_server.auth.google import GoogleError, GoogleSignIn
from mcp_server.auth.pages import consent_page, error_page
from mcp_server.auth.provider import AmazoniaOAuthProvider
from mcp_server.auth.store import PENDING_TTL, AuthStore
from mcp_server.config import HttpSettings

# __Host-: Secure, no Domain, Path=/ - the browser keeps it to this exact host.
COOKIE = "__Host-mcp_auth"
EXPIRED = "This sign-in has expired or was already used. Start again from your client."
NOT_THIS_BROWSER = (
    "This sign-in did not start in this browser. Start again from your client."
)


def _same_browser(request: Request, pending_id: str) -> bool:
    cookie = request.cookies.get(COOKIE, "")
    return hmac.compare_digest(cookie, digest(pending_id))


async def _start(store: AuthStore, google: GoogleSignIn, request: Request) -> Response:
    pending_id = request.query_params.get("p", "")
    if not pending_id or await store.get_pending(pending_id) is None:
        return error_page(EXPIRED)
    response = RedirectResponse(google.authorization_url(pending_id), 302)
    response.set_cookie(
        COOKIE,
        digest(pending_id),
        max_age=int(PENDING_TTL.total_seconds()),
        path="/",
        secure=True,
        httponly=True,
        samesite="lax",
    )
    return response


async def _callback(
    store: AuthStore,
    settings: HttpSettings,
    provider: AmazoniaOAuthProvider,
    google: GoogleSignIn,
    request: Request,
) -> Response:
    if request.query_params.get("error"):
        return error_page("Sign-in was cancelled. Start again from your client.")
    code = request.query_params.get("code", "")
    pending_id = request.query_params.get("state", "")
    if not code or not pending_id:
        return error_page(EXPIRED)
    if not _same_browser(request, pending_id):
        return error_page(NOT_THIS_BROWSER)
    pending = await store.get_pending(pending_id)
    if pending is None or pending.email is not None:
        return error_page(EXPIRED)
    try:
        email = await google.verified_email(code)
    except GoogleError as exc:
        return error_page(str(exc))
    if not provider.allowed(email):
        return error_page(
            f"{email} is not allowed to use the Amazonia 360 MCP. Ask the Amazonia "
            "360 team for access.",
            403,
        )
    csrf = new_secret()
    if not await store.record_login(pending_id, email, csrf):
        return error_page(EXPIRED)
    client = await store.get_client(pending.client_id)
    name = (client.client_name if client else None) or pending.client_id
    return consent_page(
        client_name=name,
        redirect_host=urlsplit(pending.redirect_uri).netloc,
        email=email,
        pending_id=pending_id,
        csrf=csrf,
        action=f"{settings.public_url}/oauth/consent",
    )


async def _consent(
    store: AuthStore, settings: HttpSettings, request: Request
) -> Response:
    form = await request.form()
    pending_id = str(form.get("p", ""))
    csrf = str(form.get("csrf", ""))
    if not pending_id or not _same_browser(request, pending_id):
        return error_page(EXPIRED)
    pending = await store.take_pending(pending_id, csrf)
    if pending is None:
        return error_page(EXPIRED)
    # RFC 9207: the issuer in every authorization response, so the client can
    # tell which server answered (ChatGPT requires it for its stable redirect).
    params: dict[str, str | None] = {"state": pending.client_state}
    if form.get("decision") == "allow":
        code = new_secret()
        await store.create_code(code, pending)
        params["code"] = code
    else:
        params["error"] = "access_denied"
    params["iss"] = settings.public_url
    response = RedirectResponse(
        construct_redirect_uri(pending.redirect_uri, **params), 303
    )
    response.delete_cookie(COOKIE, path="/", secure=True, httponly=True)
    return response


def oauth_routes(provider: AmazoniaOAuthProvider, google: GoogleSignIn) -> list[Route]:
    store = provider.store
    settings = provider.settings
    # Relative to wherever this server is mounted (eg "/mcp"): Task 8 registers
    # these paths on the MCP app itself, which is mounted at that prefix.
    return [
        Route("/oauth/start", partial(_start, store, google), methods=["GET"]),
        Route(
            "/oauth/callback",
            partial(_callback, store, settings, provider, google),
            methods=["GET"],
        ),
        Route(
            "/oauth/consent",
            partial(_consent, store, settings),
            methods=["POST"],
        ),
    ]
