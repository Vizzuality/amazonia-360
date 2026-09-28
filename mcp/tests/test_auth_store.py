import anyio
import pytest
from mcp.server.auth.provider import AuthorizationParams
from mcp.shared.auth import OAuthClientInformationFull
from pydantic import AnyUrl
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from mcp_server.auth.crypto import digest
from mcp_server.auth.store import AuthStore, Grant
from mcp_server.db.models import Token
from tests.auth_helpers import ANA, CLAUDE, Clock

pytestmark = [pytest.mark.db, pytest.mark.anyio]


def client_info(client_id: str = "client-1") -> OAuthClientInformationFull:
    return OAuthClientInformationFull(
        client_id=client_id,
        client_name="Claude",
        redirect_uris=[AnyUrl(CLAUDE)],
        token_endpoint_auth_method="none",
    )


def params(state: str | None = "client-state") -> AuthorizationParams:
    return AuthorizationParams(
        state=state,
        scopes=["mcp"],
        code_challenge="challenge",
        redirect_uri=AnyUrl(CLAUDE),
        redirect_uri_provided_explicitly=True,
        resource="https://staging.test/mcp",
    )


@pytest.fixture
async def store(sessions: async_sessionmaker[AsyncSession]) -> AuthStore:
    s = AuthStore(sessions, clock=Clock())
    await s.save_client(client_info())
    return s


def clock(store: AuthStore) -> Clock:
    c = store._clock  # the fixture's Clock
    assert isinstance(c, Clock)
    return c


async def test_clients_round_trip(store: AuthStore) -> None:
    loaded = await store.get_client("client-1")
    assert loaded is not None
    assert loaded.client_name == "Claude"
    assert [str(u) for u in loaded.redirect_uris or []] == [CLAUDE]
    assert await store.get_client("nobody") is None


async def test_a_pending_authorization_goes_through_login_and_consent_once(
    store: AuthStore,
) -> None:
    await store.create_pending("p1", "client-1", params(), ["mcp"])
    pending = await store.get_pending("p1")
    assert pending is not None and pending.email is None
    assert await store.take_pending("p1", "csrf") is None  # no login yet
    assert await store.record_login("p1", ANA, "csrf")
    assert not await store.record_login("p1", "eve@example.org", "csrf2")
    assert await store.take_pending("p1", "wrong-csrf") is None
    taken = await store.take_pending("p1", "csrf")
    assert taken is not None and taken.email == ANA
    assert taken.client_state == "client-state"
    assert await store.take_pending("p1", "csrf") is None


async def test_a_pending_authorization_expires(store: AuthStore) -> None:
    await store.create_pending("p1", "client-1", params(), ["mcp"])
    clock(store).advance(minutes=11)
    assert await store.get_pending("p1") is None
    assert not await store.record_login("p1", ANA, "csrf")


async def test_only_hashes_are_stored(
    store: AuthStore, sessions: async_sessionmaker[AsyncSession]
) -> None:
    await store.create_pending("p1", "client-1", params(), ["mcp"])
    issued = await store.issue(Grant("client-1", ANA, ["mcp"], None))
    async with sessions() as session:
        hashes = set(await session.scalars(select(Token.token_hash)))
    assert hashes == {digest(issued.access_token), digest(issued.refresh_token)}


async def code_for(store: AuthStore) -> str:
    await store.create_pending("p1", "client-1", params(), ["mcp"])
    await store.record_login("p1", ANA, "csrf")
    pending = await store.take_pending("p1", "csrf")
    assert pending is not None
    await store.create_code("code-1", pending)
    return "code-1"


async def test_a_code_is_taken_once(store: AuthStore) -> None:
    code = await code_for(store)
    loaded = await store.get_code("client-1", code)
    assert loaded is not None and loaded.email == ANA
    assert await store.get_code("other-client", code) is None
    assert (await store.take_code(code)) is not None
    assert await store.take_code(code) is None


async def test_two_concurrent_takes_of_a_code_give_it_to_one(store: AuthStore) -> None:
    code = await code_for(store)
    results: list[object] = []

    async def take() -> None:
        results.append(await store.take_code(code))

    async with anyio.create_task_group() as tg:
        tg.start_soon(take)
        tg.start_soon(take)
    assert sum(r is not None for r in results) == 1


async def test_a_code_expires_after_a_minute(store: AuthStore) -> None:
    code = await code_for(store)
    clock(store).advance(seconds=61)
    assert await store.get_code("client-1", code) is None
    assert await store.take_code(code) is None


async def test_a_refresh_token_is_used_once(store: AuthStore) -> None:
    issued = await store.issue(Grant("client-1", ANA, ["mcp"], None))
    used = await store.use_refresh(issued.refresh_token)
    assert used is not None and used.family == issued.family
    assert await store.use_refresh(issued.refresh_token) is None
    # The used row stays, so a second use can be recognised.
    row = await store.get_token(issued.refresh_token, "refresh")
    assert row is not None and row.used_at is not None


async def test_an_access_token_is_not_a_refresh_token(store: AuthStore) -> None:
    issued = await store.issue(Grant("client-1", ANA, ["mcp"], None))
    assert await store.get_token(issued.access_token, "refresh") is None
    assert await store.use_refresh(issued.access_token) is None


async def test_revoking_a_family_removes_every_token_in_it(store: AuthStore) -> None:
    first = await store.issue(Grant("client-1", ANA, ["mcp"], None))
    second = await store.issue(
        Grant("client-1", ANA, ["mcp"], None), family=first.family
    )
    other = await store.issue(Grant("client-1", ANA, ["mcp"], None))
    await store.revoke_family(first.family)
    for token in (first.access_token, second.access_token):
        assert await store.get_token(token, "access") is None
    assert await store.get_token(other.access_token, "access") is not None


async def test_tokens_expire(store: AuthStore) -> None:
    issued = await store.issue(Grant("client-1", ANA, ["mcp"], None))
    clock(store).advance(hours=1, seconds=1)
    assert await store.get_token(issued.access_token, "access") is None
    assert await store.get_token(issued.refresh_token, "refresh") is not None
    clock(store).advance(days=30)
    assert await store.get_token(issued.refresh_token, "refresh") is None


async def test_delete_expired_leaves_live_rows(
    store: AuthStore, sessions: async_sessionmaker[AsyncSession]
) -> None:
    await store.create_pending("p1", "client-1", params(), ["mcp"])
    await store.issue(Grant("client-1", ANA, ["mcp"], None))
    clock(store).advance(hours=2)
    # The pending authorization and the access token are gone; the refresh token stays.
    assert await store.delete_expired() == 2
    async with sessions() as session:
        assert await session.scalar(select(func.count()).select_from(Token)) == 1
