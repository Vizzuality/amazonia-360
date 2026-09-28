import argparse
import os
import sys
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
    """Brings the mcp schema to the latest revision. The schema itself must exist:
    in staging it is provisioned, owned by the mcp role, and that role cannot
    create schemas."""
    command.upgrade(_config(url), "head")


def main() -> None:
    parser = argparse.ArgumentParser(prog="amazonia360-mcp-db")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("upgrade", help="apply the pending migrations")
    revision = sub.add_parser("revision", help="write a migration from the models")
    revision.add_argument("-m", "--message", required=True)
    args = parser.parse_args()
    url = os.environ.get("MCP_DATABASE_URL")
    if not url:
        sys.exit("MCP_DATABASE_URL is not set")
    if args.command == "upgrade":
        upgrade(url)
    else:
        command.revision(_config(url), message=args.message, autogenerate=True)
