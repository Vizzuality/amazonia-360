from typing import Any, Protocol
from urllib.parse import urlencode

import httpx

AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


class GoogleError(Exception):
    """A sign-in Google did not complete, with a message fit for the user."""


class GoogleSignIn(Protocol):
    def authorization_url(self, state: str) -> str: ...

    async def verified_email(self, code: str) -> str: ...


class Google:
    """Google as the identity check. The code is exchanged by this server, over TLS,
    at Google's token endpoint, and the user is read from userinfo with the access
    token Google returned: nothing the browser carried is trusted, so the ID token
    needs no signature check and no JWT library."""

    def __init__(
        self,
        http: httpx.AsyncClient,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
    ) -> None:
        self._http = http
        self._client_id = client_id
        self._client_secret = client_secret
        self._redirect_uri = redirect_uri

    def authorization_url(self, state: str) -> str:
        return f"{AUTHORIZATION_URL}?" + urlencode(
            {
                "client_id": self._client_id,
                "redirect_uri": self._redirect_uri,
                "response_type": "code",
                "scope": "openid email",
                "state": state,
                # Always ask which account, so nobody connects with the wrong one
                # without noticing.
                "prompt": "select_account",
            }
        )

    async def verified_email(self, code: str) -> str:
        try:
            token = await self._http.post(
                TOKEN_URL,
                data={
                    "code": code,
                    "client_id": self._client_id,
                    "client_secret": self._client_secret,
                    "redirect_uri": self._redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token_json = _json(token) if token.status_code == 200 else {}
            access = token_json.get("access_token")
            if not isinstance(access, str):
                raise GoogleError("Google did not accept the sign-in. Try again.")
            info = await self._http.get(
                USERINFO_URL, headers={"Authorization": f"Bearer {access}"}
            )
        except httpx.HTTPError as exc:
            raise GoogleError("Google could not be reached. Try again.") from exc
        user = _json(info) if info.status_code == 200 else {}
        email = user.get("email")
        if not isinstance(email, str) or "@" not in email:
            raise GoogleError(
                "Google did not return an email address for this account."
            )
        if user.get("email_verified") is not True:
            raise GoogleError("Google has not verified this account's email address.")
        return email.lower()


def _json(response: httpx.Response) -> dict[str, Any]:
    try:
        body = response.json()
    except ValueError:
        return {}
    return body if isinstance(body, dict) else {}
