import asyncio
import os
from collections.abc import AsyncIterator, Iterator
from urllib.parse import urlsplit

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from mcp_server import catalogue
from mcp_server.catalogue.models import IndicatorMetadata
from mcp_server.db import create_engine, session_maker
from mcp_server.db.migrate import upgrade

TABLES = "mcp.tokens, mcp.codes, mcp.pending_authorizations, mcp.clients"


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


async def _execute(url: str, *statements: str) -> None:
    engine = create_engine(url)
    async with engine.begin() as connection:
        for statement in statements:
            await connection.execute(text(statement))
    await engine.dispose()


@pytest.fixture(scope="session")
def database_url() -> str:
    url = os.environ.get("MCP_TEST_DATABASE_URL")
    if not url:
        pytest.skip("set MCP_TEST_DATABASE_URL to run the database tests")
    # The fixture drops the schema: refuse anything that is not a test database.
    if not urlsplit(url).path.rstrip("/").endswith("_test"):
        pytest.fail("MCP_TEST_DATABASE_URL must name a database ending in _test")
    asyncio.run(_execute(url, "DROP SCHEMA IF EXISTS mcp CASCADE", "CREATE SCHEMA mcp"))
    upgrade(url)
    return url


@pytest.fixture
def clean_database(database_url: str) -> str:
    asyncio.run(_execute(database_url, f"TRUNCATE {TABLES}"))
    return database_url


@pytest.fixture
async def sessions(
    clean_database: str,
) -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    engine = create_engine(clean_database)
    yield session_maker(engine)
    await engine.dispose()


def _fixed_indicators() -> dict[int, IndicatorMetadata]:
    from tests.test_models import indicator, raster_indicator

    return {
        i.id: i
        for i in (
            indicator(),
            indicator(
                id=202,
                subtopic=4,
                value_type="count",
                aggregation="sum",
                unit="restoration actions",
                category_field="Practica",
                sync={"sync_status": "ok", "queryable_fields": ["Practica"]},
            ),
            indicator(
                id=211,
                subtopic=1,
                category_field="Relieve",
                sync={"sync_status": "ok", "queryable_fields": ["Relieve"]},
            ),
            raster_indicator(),
        )
    }


@pytest.fixture
def fixed_catalogue(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """A catalogue that does not move when the committed snapshot is re-synced."""
    monkeypatch.setattr(catalogue, "_catalogue", _fixed_indicators)
    yield


@pytest.fixture
def stand_in_module(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """The rectangle around the module as its outline, so the handler tests keep the
    geometry they were written against and do not move with a re-sync."""
    from mcp_server.geometry import aoi

    monkeypatch.setattr(aoi, "module_outline", lambda: aoi.MODULE_ENVELOPE)
    yield
