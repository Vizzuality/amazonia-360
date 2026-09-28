import asyncio

from alembic import context
from sqlalchemy.engine import Connection

from mcp_server.db import create_engine
from mcp_server.db.models import SCHEMA, Base


def _only_ours(name: str | None, type_: str, parent_names: object) -> bool:
    # Payload's tables live in public; autogenerate must never see them.
    return type_ != "schema" or name == SCHEMA


def _run(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=Base.metadata,
        include_schemas=True,
        include_name=_only_ours,
        version_table_schema=SCHEMA,
    )
    with context.begin_transaction():
        context.run_migrations()


async def _main() -> None:
    engine = create_engine(context.config.attributes["url"])
    async with engine.connect() as connection:
        await connection.run_sync(_run)
        await connection.commit()
    await engine.dispose()


asyncio.run(_main())
