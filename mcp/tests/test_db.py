import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from mcp_server.db import engine_url
from mcp_server.db.models import SCHEMA, Base


@pytest.mark.parametrize(
    "url",
    [
        "postgres://u:p@h:5432/d",
        "postgresql://u:p@h:5432/d",
        "postgresql+asyncpg://u:p@h:5432/d",
    ],
)
def test_engine_url_uses_asyncpg(url: str) -> None:
    assert engine_url(url) == "postgresql+asyncpg://u:p@h:5432/d"


@pytest.mark.db
@pytest.mark.anyio
async def test_the_migration_matches_the_models(
    sessions: async_sessionmaker[AsyncSession],
) -> None:
    async with sessions() as session:
        connection = await session.connection()

        def diff(sync_connection) -> list:  # type: ignore[no-untyped-def]
            context = MigrationContext.configure(
                sync_connection,
                opts={"include_schemas": True, "version_table_schema": SCHEMA},
            )
            return compare_metadata(context, Base.metadata)

        assert await connection.run_sync(diff) == []


@pytest.mark.db
@pytest.mark.anyio
async def test_the_version_table_is_in_the_mcp_schema(
    sessions: async_sessionmaker[AsyncSession],
) -> None:
    async with sessions() as session:
        version = await session.scalar(
            text("SELECT version_num FROM mcp.alembic_version")
        )
    assert version == "0002"
