"""``amazonia360-docs``: the document side of the MCP.

- ``migrate`` creates or upgrades the document tables.
- ``serve`` runs the back office, the job worker and the file server for links, in
  one process on 127.0.0.1.
"""

import argparse
import fcntl
import logging
import os
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import IO

from mcp_server.documents.migrate import upgrade
from mcp_server.documents.settings import DocsSettings

LOCK_FILE = "serve.lock"
OPENAI_KEY = "OPENAI_API_KEY"
QDRANT_TIMEOUT_S = 1.0
NO_SETTINGS = (
    "Set DOCS_DATABASE_URL and DOCS_QDRANT_URL (see the README, Document search)."
)
NO_KEY = (
    f"amazonia360-docs serve needs {OPENAI_KEY}: it embeds passages and describes "
    "figures with OpenAI."
)
NO_EXTRA = "The back office needs the ingest extra: uv sync --extra ingest"
ALREADY_RUNNING = "amazonia360-docs serve is already running for this data directory."


def single_instance(path: Path) -> IO[str] | None:
    """Holds an exclusive lock for the process's lifetime; None if already held."""
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = path.open("w")
    try:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        handle.close()
        return None
    return handle


def serve(settings: DocsSettings) -> None:
    if not os.environ.get(OPENAI_KEY, "").strip():
        sys.exit(NO_KEY)
    # A second serve would fail the first one's running job as interrupted and
    # take its queued jobs before it failed to bind the port.
    lock = single_instance(settings.data_dir / LOCK_FILE)
    if lock is None:
        sys.exit(ALREADY_RUNNING)

    try:
        _serve(settings)
    finally:
        lock.close()


def _serve(settings: DocsSettings) -> None:
    try:
        import uvicorn
        from fastapi import FastAPI
    except ModuleNotFoundError as missing:
        sys.exit(f"{NO_EXTRA} ({missing})")
    import anyio
    import httpx
    from openai import AsyncOpenAI
    from qdrant_client import AsyncQdrantClient

    from mcp_server.db import create_engine, session_maker
    from mcp_server.documents.backoffice.app import create_backoffice
    from mcp_server.documents.embedding import OpenAIEmbedder
    from mcp_server.documents.index import DocumentIndex
    from mcp_server.documents.ingest.describe import (
        FigureDescriber,
        SummaryWriter,
        default_model,
    )
    from mcp_server.documents.ingest.jobs import Worker
    from mcp_server.documents.ingest.pipeline import Pipeline
    from mcp_server.documents.search import DocumentSearch
    from mcp_server.documents.store import DocumentStore
    from mcp_server.places import load_places

    engine = create_engine(settings.database_url)
    store = DocumentStore(session_maker(engine))
    client = AsyncQdrantClient(url=settings.qdrant_url)
    embedder = OpenAIEmbedder(AsyncOpenAI())
    index = DocumentIndex(client, embedder)
    places = load_places()
    search = DocumentSearch(store, index, embedder, settings, places)
    model = default_model()
    pipeline = Pipeline(
        store,
        index,
        embedder,
        FigureDescriber(model),
        SummaryWriter(model),
        settings,
    )
    worker = Worker(store, pipeline)

    async def qdrant_ok() -> bool:
        try:
            async with httpx.AsyncClient(timeout=QDRANT_TIMEOUT_S) as http:
                response = await http.get(f"{settings.qdrant_url}/healthz")
        except httpx.HTTPError:
            return False
        return response.is_success

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        await index.ensure_collections()
        stop = anyio.Event()
        async with anyio.create_task_group() as tasks:
            # It first fails the jobs a stopped process left running, then polls.
            tasks.start_soon(worker.run_forever, stop)
            yield
            stop.set()
        await client.close()
        await engine.dispose()

    app = create_backoffice(
        settings,
        store,
        index,
        search,
        pipeline,
        places=places,
        qdrant_ok=qdrant_ok,
        lifespan=lifespan,
    )
    uvicorn.run(app, host="127.0.0.1", port=settings.port)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="amazonia360-docs")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser(
        "serve", help="run the back office and the job worker on 127.0.0.1"
    )
    commands.add_parser("migrate", help="create or upgrade the document tables")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
    # One line per HTTP call, health checks included, would bury the job logs.
    for noisy in ("httpx", "httpx2"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    settings = DocsSettings.from_env()
    if settings is None:
        sys.exit(NO_SETTINGS)
    if args.command == "migrate":
        upgrade(settings.database_url)
    else:
        serve(settings)


if __name__ == "__main__":
    main()
