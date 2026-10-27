from pathlib import Path

from alembic import command
from alembic.config import Config

MIGRATIONS = Path(__file__).parent / "migrations"


def _config(url: str) -> Config:
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS))
    config.attributes["url"] = url
    return config


def upgrade(url: str) -> None:
    """Brings the document tables to the latest revision. They have their own
    version table, so this never touches the MCP's migrations. The `mcp` schema
    must exist."""
    command.upgrade(_config(url), "head")
