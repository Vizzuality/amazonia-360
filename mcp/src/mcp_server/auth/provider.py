from urllib.parse import urlencode

from mcp.server.auth.provider import (
    AccessToken,
    AuthorizationCode,
    AuthorizationParams,
    AuthorizeError,
    IdentityAssertionParams,
    RefreshToken,
    RegistrationError,
    TokenError,
)
from mcp.shared.auth import OAuthClientInformationFull, OAuthToken
from pydantic import AnyUrl

from mcp_server.auth.crypto import new_secret
from mcp_server.auth.redirects import redirect_allowed
from mcp_server.auth.store import ACCESS_TTL, AuthStore, Grant, IssuedTokens
from mcp_server.config import HttpSettings

SCOPE = "mcp"


class AmazoniaOAuthProvider:
    """The SDK's authorization server provider over AuthStore. Google signs the user
    in (routes.py); this class decides who may hold a token and for how long. The
    allowlist is read from the database on every check, with no cache, so a change
    made with `amazonia360-mcp-db` applies to the next request."""

    def __init__(self, store: AuthStore, settings: HttpSettings) -> None:
        self.store = store
        self.settings = settings

    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        return await self.store.get_client(client_id)

    async def register_client(self, client_info: OAuthClientInformationFull) -> None:
        for uri in client_info.redirect_uris or []:
            if not redirect_allowed(str(uri), self.settings.allowed_redirect_uris):
                raise RegistrationError(
                    "invalid_redirect_uri", f"{uri} is not an allowed redirect URI"
                )
        await self.store.save_client(client_info)

    async def authorize(
        self, client: OAuthClientInformationFull, params: AuthorizationParams
    ) -> str:
        if params.resource is not None and params.resource.rstrip("/") != (
            self.settings.public_url
        ):
            raise AuthorizeError(
                "invalid_target", "This server only issues tokens for itself."
            )
        pending_id = new_secret()
        await self.store.create_pending(
            pending_id, client.client_id, params, params.scopes or [SCOPE]
        )
        # The SDK can only answer with a redirect; the start page sets the cookie that
        # ties the rest of the flow to this browser.
        return f"{self.settings.public_url}/oauth/start?" + urlencode({"p": pending_id})

    async def load_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: str
    ) -> AuthorizationCode | None:
        row = await self.store.get_code(client.client_id, authorization_code)
        if row is None:
            return None
        return AuthorizationCode(
            code=authorization_code,
            scopes=row.scopes,
            expires_at=row.expires_at.timestamp(),
            client_id=row.client_id,
            code_challenge=row.code_challenge,
            redirect_uri=AnyUrl(row.redirect_uri),
            redirect_uri_provided_explicitly=row.redirect_uri_provided_explicitly,
            resource=row.resource,
            subject=row.email,
        )

    async def exchange_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: AuthorizationCode
    ) -> OAuthToken:
        row = await self.store.take_code(client.client_id, authorization_code.code)
        if row is None:
            raise TokenError(
                "invalid_grant", "The code has expired or was already used."
            )
        if not await self.store.is_allowed(row.email):
            raise TokenError("invalid_grant", "This account is no longer allowed.")
        issued = await self.store.issue(
            Grant(client.client_id, row.email, row.scopes, self.settings.public_url)
        )
        return _oauth_token(issued, row.scopes)

    async def load_refresh_token(
        self, client: OAuthClientInformationFull, refresh_token: str
    ) -> RefreshToken | None:
        row = await self.store.get_token(refresh_token, "refresh", allowed=True)
        if row is None or row.client_id != client.client_id:
            return None
        if row.used_at is not None:
            # Only a copy is presented twice: whoever holds the family loses it.
            await self.store.revoke_family(row.family)
            return None
        return RefreshToken(
            token=refresh_token,
            client_id=row.client_id,
            scopes=row.scopes,
            expires_at=int(row.expires_at.timestamp()),
            resource=row.resource,
            subject=row.email,
        )

    async def exchange_refresh_token(
        self,
        client: OAuthClientInformationFull,
        refresh_token: RefreshToken,
        scopes: list[str],
    ) -> OAuthToken:
        rotated = await self.store.rotate_refresh(
            client.client_id, refresh_token.token, scopes or None
        )
        if rotated is None:
            # Another request used it between load and exchange.
            raced = await self.store.get_token(refresh_token.token, "refresh")
            if raced is not None:
                await self.store.revoke_family(raced.family)
            raise TokenError("invalid_grant", "The refresh token was already used.")
        row, issued = rotated
        return _oauth_token(issued, scopes or row.scopes)

    async def load_access_token(self, token: str) -> AccessToken | None:
        row = await self.store.get_token(token, "access", allowed=True)
        if row is None:
            return None
        return AccessToken(
            token=token,
            client_id=row.client_id,
            scopes=row.scopes,
            expires_at=int(row.expires_at.timestamp()),
            resource=row.resource,
            subject=row.email,
            # The SDK binds each HTTP session to (client_id, iss, subject).
            claims={"iss": self.settings.public_url},
        )

    async def revoke_token(self, token: AccessToken | RefreshToken) -> None:
        row = await self.store.get_token(token.token, "access") or (
            await self.store.get_token(token.token, "refresh")
        )
        if row is not None:
            await self.store.revoke_family(row.family)

    async def exchange_identity_assertion(
        self,
        client: OAuthClientInformationFull,
        params: IdentityAssertionParams,
    ) -> OAuthToken:
        # SEP-990 identity assertion (ID-JAG) is disabled: we only sign users in
        # through the Google authorization-code flow in authorize()/routes.py.
        raise TokenError(
            "unsupported_grant_type",
            "The JWT bearer grant is not supported by this authorization server.",
        )


def _oauth_token(issued: IssuedTokens, scopes: list[str]) -> OAuthToken:
    return OAuthToken(
        access_token=issued.access_token,
        token_type="Bearer",
        expires_in=int(ACCESS_TTL.total_seconds()),
        scope=" ".join(scopes),
        refresh_token=issued.refresh_token,
    )
