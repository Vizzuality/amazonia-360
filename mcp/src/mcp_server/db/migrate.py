import argparse
import asyncio
import getpass
import os
import sys
from collections.abc import Awaitable, Callable
from pathlib import Path

from alembic import command
from alembic.config import Config

from mcp_server.auth.store import AuthStore, normalise_email
from mcp_server.db import create_engine, session_maker

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


def _with_store[T](url: str, use: Callable[[AuthStore], Awaitable[T]]) -> T:
    async def run() -> T:
        engine = create_engine(url)
        try:
            return await use(AuthStore(session_maker(engine)))
        finally:
            await engine.dispose()

    return asyncio.run(run())


def _os_user() -> str | None:
    try:
        return getpass.getuser()
    except Exception:  # no login name in some containers
        return None


def allow(url: str, email: str, added_by: str | None) -> str:
    email = normalise_email(email)
    if _with_store(url, lambda store: store.allow(email, added_by)):
        return f"Added {email}."
    return f"{email} was already on the allowlist."


def revoke(url: str, email: str) -> str:
    email = normalise_email(email)
    r = _with_store(url, lambda store: store.revoke(email))
    deleted = f"deleted {r.tokens} tokens and {r.codes} codes"
    if r.listed:
        return f"Removed {email}; {deleted}, so access ends now."
    return f"{email} was not on the allowlist; {deleted}."


def list_allowed(url: str) -> str:
    rows = _with_store(url, lambda store: store.allowed_emails())
    if not rows:
        return "The allowlist is empty."
    return "\n".join(
        f"{r.email}\t{r.added_by or ''}\t{r.added_at.isoformat(timespec='seconds')}"
        for r in rows
    )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="amazonia360-mcp-db")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("upgrade", help="apply the pending migrations")
    revision = sub.add_parser("revision", help="write a migration from the models")
    revision.add_argument("-m", "--message", required=True)
    allowed = sub.add_parser("allow", help="let an email sign in")
    allowed.add_argument("email")
    allowed.add_argument("--by", help="who added it (default: the OS user)")
    revoked = sub.add_parser(
        "revoke", help="take an email off the allowlist and delete its tokens"
    )
    revoked.add_argument("email")
    sub.add_parser("list", help="the emails that can sign in")
    args = parser.parse_args(argv)
    url = os.environ.get("MCP_DATABASE_URL")
    if not url:
        sys.exit("MCP_DATABASE_URL is not set")
    try:
        if args.command == "upgrade":
            upgrade(url)
        elif args.command == "revision":
            command.revision(_config(url), message=args.message, autogenerate=True)
        elif args.command == "allow":
            print(allow(url, args.email, args.by or _os_user()))
        elif args.command == "revoke":
            print(revoke(url, args.email))
        else:
            print(list_allowed(url))
    except ValueError as exc:
        sys.exit(str(exc))
