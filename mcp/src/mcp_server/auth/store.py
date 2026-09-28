import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal, cast

from mcp.server.auth.provider import AuthorizationParams
from mcp.shared.auth import OAuthClientInformationFull
from sqlalchemy import CursorResult, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from mcp_server.auth.crypto import digest, new_secret
from mcp_server.db.models import Client, Code, PendingAuthorization, Token

ACCESS_TTL = timedelta(hours=1)
REFRESH_TTL = timedelta(days=30)
PENDING_TTL = timedelta(minutes=10)
CODE_TTL = timedelta(seconds=60)

# Rows removed by DELETE ... RETURNING are not in the session; nothing to sync.
_NO_SYNC = {"synchronize_session": False}


def utcnow() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True)
class Grant:
    """What a code or a token lets its holder do, and for whom."""

    client_id: str
    email: str
    scopes: list[str]
    resource: str | None


@dataclass(frozen=True)
class IssuedTokens:
    access_token: str
    refresh_token: str
    family: str


class AuthStore:
    """The OAuth state in the mcp schema. Secrets are looked up by their hash, and
    every one-time step is a single DELETE or UPDATE ... RETURNING, so it happens
    once even when two requests race for it."""

    def __init__(
        self,
        sessions: async_sessionmaker[AsyncSession],
        clock: Callable[[], datetime] = utcnow,
    ) -> None:
        self._sessions = sessions
        self._clock = clock

    async def save_client(self, info: OAuthClientInformationFull) -> None:
        async with self._sessions() as session:
            session.add(
                Client(
                    client_id=info.client_id,
                    client_info=info.model_dump(mode="json"),
                )
            )
            await session.commit()

    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        async with self._sessions() as session:
            row = await session.get(Client, client_id)
        if row is None:
            return None
        return OAuthClientInformationFull.model_validate(row.client_info)

    async def create_pending(
        self,
        pending_id: str,
        client_id: str,
        params: AuthorizationParams,
        scopes: list[str],
    ) -> None:
        async with self._sessions() as session:
            session.add(
                PendingAuthorization(
                    id_hash=digest(pending_id),
                    client_id=client_id,
                    redirect_uri=str(params.redirect_uri),
                    redirect_uri_provided_explicitly=params.redirect_uri_provided_explicitly,
                    code_challenge=params.code_challenge,
                    scopes=scopes,
                    resource=params.resource,
                    client_state=params.state,
                    expires_at=self._clock() + PENDING_TTL,
                )
            )
            await session.commit()

    async def get_pending(self, pending_id: str) -> PendingAuthorization | None:
        async with self._sessions() as session:
            return await session.scalar(
                select(PendingAuthorization).where(
                    PendingAuthorization.id_hash == digest(pending_id),
                    PendingAuthorization.expires_at > self._clock(),
                )
            )

    async def record_login(self, pending_id: str, email: str, csrf: str) -> bool:
        """Records who signed in, once: a second callback for the same authorization
        cannot swap the account."""
        async with self._sessions() as session:
            done = await session.scalar(
                update(PendingAuthorization)
                .where(
                    PendingAuthorization.id_hash == digest(pending_id),
                    PendingAuthorization.email.is_(None),
                    PendingAuthorization.expires_at > self._clock(),
                )
                .values(email=email, csrf_hash=digest(csrf))
                .returning(PendingAuthorization.id_hash)
                .execution_options(**_NO_SYNC)
            )
            await session.commit()
        return done is not None

    async def take_pending(
        self, pending_id: str, csrf: str
    ) -> PendingAuthorization | None:
        async with self._sessions() as session:
            row = await session.scalar(
                delete(PendingAuthorization)
                .where(
                    PendingAuthorization.id_hash == digest(pending_id),
                    PendingAuthorization.csrf_hash == digest(csrf),
                    PendingAuthorization.email.is_not(None),
                    PendingAuthorization.expires_at > self._clock(),
                )
                .returning(PendingAuthorization)
                .execution_options(**_NO_SYNC)
            )
            await session.commit()
        return row

    async def create_code(self, code: str, pending: PendingAuthorization) -> None:
        if pending.email is None:
            raise ValueError("A code needs the email of a completed login")
        async with self._sessions() as session:
            session.add(
                Code(
                    code_hash=digest(code),
                    client_id=pending.client_id,
                    redirect_uri=pending.redirect_uri,
                    redirect_uri_provided_explicitly=pending.redirect_uri_provided_explicitly,
                    code_challenge=pending.code_challenge,
                    scopes=pending.scopes,
                    resource=pending.resource,
                    email=pending.email,
                    expires_at=self._clock() + CODE_TTL,
                )
            )
            await session.commit()

    async def get_code(self, client_id: str, code: str) -> Code | None:
        async with self._sessions() as session:
            return await session.scalar(
                select(Code).where(
                    Code.code_hash == digest(code),
                    Code.client_id == client_id,
                    Code.expires_at > self._clock(),
                )
            )

    async def take_code(self, client_id: str, code: str) -> Code | None:
        async with self._sessions() as session:
            row = await session.scalar(
                delete(Code)
                .where(
                    Code.code_hash == digest(code),
                    Code.client_id == client_id,
                    Code.expires_at > self._clock(),
                )
                .returning(Code)
                .execution_options(**_NO_SYNC)
            )
            await session.commit()
        return row

    async def issue(self, grant: Grant, family: str | None = None) -> IssuedTokens:
        family = family or uuid.uuid4().hex
        now = self._clock()
        async with self._sessions() as session:
            issued = self._new_pair(
                session,
                family=family,
                client_id=grant.client_id,
                email=grant.email,
                scopes=grant.scopes,
                resource=grant.resource,
                now=now,
            )
            await session.commit()
        return issued

    def _new_pair(
        self,
        session: AsyncSession,
        *,
        family: str,
        client_id: str,
        email: str,
        scopes: list[str],
        resource: str | None,
        now: datetime,
    ) -> IssuedTokens:
        """Adds a fresh access/refresh pair to `session`, in `family`; the caller
        commits. Shared by `issue` and `rotate_refresh` so a family's tokens are
        always built the same way."""
        access, refresh = new_secret(), new_secret()
        common = {
            "family": family,
            "client_id": client_id,
            "email": email,
            "scopes": scopes,
            "resource": resource,
        }
        session.add_all(
            [
                Token(
                    token_hash=digest(access),
                    kind="access",
                    expires_at=now + ACCESS_TTL,
                    **common,
                ),
                Token(
                    token_hash=digest(refresh),
                    kind="refresh",
                    expires_at=now + REFRESH_TTL,
                    **common,
                ),
            ]
        )
        return IssuedTokens(access_token=access, refresh_token=refresh, family=family)

    async def get_token(
        self, token: str, kind: Literal["access", "refresh"]
    ) -> Token | None:
        """Looks up an unexpired token by its hash. A refresh token already spent
        by `rotate_refresh` is still returned here (its `used_at` is set); callers
        must check `used_at` themselves to tell a live token from a used one."""
        async with self._sessions() as session:
            return await session.scalar(
                select(Token).where(
                    Token.token_hash == digest(token),
                    Token.kind == kind,
                    Token.expires_at > self._clock(),
                )
            )

    async def rotate_refresh(
        self, client_id: str, token: str, scopes: list[str] | None
    ) -> tuple[Token, IssuedTokens] | None:
        """Rotates a refresh token: marks it used and issues a fresh pair in the
        same family, in one transaction. The family is locked with a Postgres
        advisory lock for the length of that transaction, so a concurrent
        `revoke_family` on the same family serialises with this: whichever of the
        two commits first is the outcome the other one sees, and a revoke that
        wins can never be undone by a rotation that inserts into the family
        afterwards."""
        now = self._clock()
        async with self._sessions() as session:
            family = await session.scalar(
                select(Token.family).where(
                    Token.token_hash == digest(token),
                    Token.kind == "refresh",
                    Token.client_id == client_id,
                )
            )
            if family is None:
                return None
            await session.execute(
                select(func.pg_advisory_xact_lock(func.hashtextextended(family, 0)))
            )
            used = await session.scalar(
                update(Token)
                .where(
                    Token.token_hash == digest(token),
                    Token.kind == "refresh",
                    Token.client_id == client_id,
                    Token.used_at.is_(None),
                    Token.expires_at > now,
                )
                .values(used_at=now)
                .returning(Token)
                .execution_options(**_NO_SYNC)
            )
            if used is None:
                await session.commit()
                return None
            issued = self._new_pair(
                session,
                family=family,
                client_id=used.client_id,
                email=used.email,
                scopes=scopes or used.scopes,
                resource=used.resource,
                now=now,
            )
            await session.commit()
        return used, issued

    async def revoke_family(self, family: str) -> None:
        async with self._sessions() as session:
            # Locking before the DELETE serialises with rotate_refresh on the same
            # family: whichever of the two commits first is what the other sees.
            await session.execute(
                select(func.pg_advisory_xact_lock(func.hashtextextended(family, 0)))
            )
            await session.execute(delete(Token).where(Token.family == family))
            await session.commit()

    async def delete_expired(self) -> int:
        now = self._clock()
        removed = 0
        async with self._sessions() as session:
            for model in (PendingAuthorization, Code, Token):
                result = await session.execute(
                    delete(model).where(model.expires_at <= now)
                )
                # A plain DELETE (no RETURNING) yields a CursorResult, which has
                # rowcount; the base Result type does not.
                removed += cast(CursorResult, result).rowcount
            await session.commit()
        return removed
