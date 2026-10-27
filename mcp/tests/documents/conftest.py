import asyncio
import os
from collections.abc import AsyncIterator
from urllib.parse import urlsplit

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from mcp_server.db import create_engine, session_maker
from mcp_server.documents.migrate import upgrade
from mcp_server.documents.store import DocumentStore

TABLES = "mcp.jobs, mcp.figures, mcp.document_topics, mcp.documents, mcp.topics"


async def _execute(url: str, *statements: str) -> None:
    engine = create_engine(url)
    async with engine.begin() as connection:
        for statement in statements:
            await connection.execute(text(statement))
    await engine.dispose()


@pytest.fixture(scope="session")
def docs_database_url() -> str:
    url = os.environ.get("MCP_TEST_DATABASE_URL")
    if not url:
        pytest.skip("set MCP_TEST_DATABASE_URL to run the database tests")
    # The fixture drops tables: refuse anything that is not a test database.
    if not urlsplit(url).path.rstrip("/").endswith("_test"):
        pytest.fail("MCP_TEST_DATABASE_URL must name a database ending in _test")
    # Only our own tables: the MCP's tests share the mcp schema.
    asyncio.run(
        _execute(
            url,
            "CREATE SCHEMA IF NOT EXISTS mcp",
            f"DROP TABLE IF EXISTS {TABLES}, mcp.documents_alembic_version CASCADE",
        )
    )
    upgrade(url)
    return url


@pytest.fixture
def clean_docs_database(docs_database_url: str) -> str:
    # The MCP's own fixture drops the whole schema; this puts our tables back.
    upgrade(docs_database_url)
    asyncio.run(_execute(docs_database_url, f"TRUNCATE {TABLES}"))
    return docs_database_url


@pytest.fixture
async def store(clean_docs_database: str) -> AsyncIterator[DocumentStore]:
    engine = create_engine(clean_docs_database)
    sessions: async_sessionmaker[AsyncSession] = session_maker(engine)
    yield DocumentStore(sessions)
    await engine.dispose()
