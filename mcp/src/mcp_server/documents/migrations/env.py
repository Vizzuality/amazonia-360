import asyncio

from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.schema import SchemaItem

from mcp_server.db import create_engine
from mcp_server.documents.tables import SCHEMA, DocumentsBase

VERSION_TABLE = "documents_alembic_version"
_OURS = set(DocumentsBase.metadata.tables)


def _only_ours(
    obj: SchemaItem, name: str | None, type_: str, reflected: bool, compare_to: object
) -> bool:
    # The MCP's own tables share the schema; autogenerate must never see them.
    if type_ == "table":
        return f"{SCHEMA}.{name}" in _OURS
    table = getattr(obj, "table", None)
    return table is None or table.fullname in _OURS


def _run(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=DocumentsBase.metadata,
        include_schemas=True,
        include_object=_only_ours,
        version_table=VERSION_TABLE,
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
