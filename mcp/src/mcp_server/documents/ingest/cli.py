"""``amazonia360-docs``: the document side of the MCP.

- ``migrate`` creates or upgrades the document tables.
- ``serve`` runs the back office, the job worker and the file server for links, in
  one process on 127.0.0.1.
- ``seed`` adds the demo topics.
- ``load-demo <dir>`` adds the six demo sources and runs their jobs.
- ``eval <questions.yaml>`` measures retrieval over the loaded corpus.
"""

import argparse
import fcntl
import logging
import os
import re
import shutil
import sys
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import IO, TYPE_CHECKING

from mcp_server.documents.migrate import upgrade
from mcp_server.documents.models import Document, Topic
from mcp_server.documents.settings import DocsSettings

if TYPE_CHECKING:
    from qdrant_client import AsyncQdrantClient
    from sqlalchemy.ext.asyncio import AsyncEngine

    from mcp_server.documents.embedding import OpenAIEmbedder
    from mcp_server.documents.index import DocumentIndex
    from mcp_server.documents.ingest.pipeline import Pipeline
    from mcp_server.documents.search import DocumentSearch
    from mcp_server.documents.store import DocumentStore
    from mcp_server.places import Places

LOCK_FILE = "serve.lock"
OPENAI_KEY = "OPENAI_API_KEY"
QDRANT_TIMEOUT_S = 1.0
EVAL_K = 8
HYBRID_SPARSE_WEIGHT = 1.0
NO_SETTINGS = (
    "Set DOCS_DATABASE_URL and DOCS_QDRANT_URL (see the README, Document search)."
)
NO_KEY = (
    f"amazonia360-docs needs {OPENAI_KEY}: it embeds passages and describes "
    "figures with OpenAI."
)
NO_EXTRA = "The back office needs the ingest extra: uv sync --extra ingest"
ALREADY_RUNNING = "amazonia360-docs serve is already running for this data directory."
NO_TOPICS = "Run amazonia360-docs seed first: the demo sources need its topics."

YASUNI_TOPIC = "yasuni"
DEMO_TOPICS = (
    Topic(YASUNI_TOPIC, "Yasuní", ("Yasuni", "Yasuní National Park")),
    Topic("oil-and-gas", "Oil and gas", ("petróleo", "hidrocarburos")),
    Topic("illegal-mining", "Illegal mining", ("minería ilegal",)),
    Topic("protected-areas", "Protected areas", ("áreas protegidas",)),
    Topic("deforestation", "Deforestation", ("deforestación",)),
    Topic("biodiversity", "Biodiversity", ("biodiversidad",)),
    Topic("redd", "REDD+", ("REDD",)),
    Topic("forest-fragmentation", "Forest fragmentation", ("fragmentación forestal",)),
)


@dataclass(frozen=True)
class DemoSource:
    id: str
    authors_year: str
    title: str
    topics: tuple[str, ...]
    url: str | None = None
    """A web report; without it the source is ``<id>.pdf`` in the demo folder."""


# The names of the document-search test (figure_set.TITLES) split in two, since the
# figure prompt joins them back as "<authors_year>, <title>". The MAAP reports add
# their year of publication, for citations.
DEMO_SOURCES = (
    DemoSource(
        "finer-2008-western-amazon-oil-gas-plosone",
        "Finer et al. (2008)",
        "Oil and Gas Projects in the Western Amazon, PLOS ONE",
        ("oil-and-gas", "deforestation"),
    ),
    DemoSource(
        "finer-2010-yasuni-plosone",
        "Bass et al. (2010)",
        "Global Conservation Significance of Ecuador's Yasuní National Park, PLOS ONE",
        (YASUNI_TOPIC, "biodiversity", "protected-areas"),
    ),
    DemoSource(
        "garcia-romero-2026-isprs-amazon-deforestation",
        "García-Romero et al. (2026)",
        "Ecuadorian Amazon Deforestation Hotspots Due to Oil Infrastructure "
        "Development in the 21st Century, ISPRS Archives",
        ("oil-and-gas", "deforestation"),
    ),
    DemoSource(
        "paredes-2026-redd-fragmentation-plosone",
        "Paredes et al. (2026)",
        "forest fragmentation in the REDD+ priority zones of Ecuador, PLOS ONE",
        ("redd", "forest-fragmentation", "deforestation"),
    ),
    DemoSource(
        "maap-82-yasuni-oil",
        "MAAP #82 (2018)",
        "Oil-related Deforestation in Yasuní National Park",
        (YASUNI_TOPIC, "oil-and-gas", "deforestation"),
        url="https://www.maapprogram.org/yasuni-eng/",
    ),
    DemoSource(
        "maap-221-mining-protected-areas",
        "MAAP #221 (2024)",
        "Illegal mining in protected areas of the Ecuadorian Amazon",
        ("illegal-mining", "protected-areas"),
        url="https://www.maapprogram.org/mining-protected-areas-ecuador/",
    ),
)


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


def require_key() -> None:
    if not os.environ.get(OPENAI_KEY, "").strip():
        sys.exit(NO_KEY)


def serve(settings: DocsSettings) -> None:
    require_key()
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

    from mcp_server.documents.backoffice.app import create_backoffice
    from mcp_server.documents.ingest.jobs import Worker

    parts = _Parts.build(settings)
    pipeline = parts.pipeline()
    worker = Worker(parts.store, pipeline)

    async def qdrant_ok() -> bool:
        try:
            async with httpx.AsyncClient(timeout=QDRANT_TIMEOUT_S) as http:
                response = await http.get(f"{settings.qdrant_url}/healthz")
        except httpx.HTTPError:
            return False
        return response.is_success

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        await parts.index.ensure_collections()
        stop = anyio.Event()
        async with anyio.create_task_group() as tasks:
            # It first fails the jobs a stopped process left running, then polls.
            tasks.start_soon(worker.run_forever, stop)
            yield
            stop.set()
        await parts.close()

    app = create_backoffice(
        settings,
        parts.store,
        parts.index,
        parts.search(),
        pipeline,
        places=parts.places,
        qdrant_ok=qdrant_ok,
        lifespan=lifespan,
    )
    uvicorn.run(app, host="127.0.0.1", port=settings.port)


@dataclass
class _Parts:
    """The store, index and embedder every command shares, built in one place."""

    settings: DocsSettings
    engine: "AsyncEngine"
    client: "AsyncQdrantClient"
    store: "DocumentStore"
    embedder: "OpenAIEmbedder"
    index: "DocumentIndex"
    places: "Places"

    @classmethod
    def build(cls, settings: DocsSettings) -> "_Parts":
        from openai import AsyncOpenAI
        from qdrant_client import AsyncQdrantClient

        from mcp_server.db import create_engine, session_maker
        from mcp_server.documents.embedding import OpenAIEmbedder
        from mcp_server.documents.index import DocumentIndex
        from mcp_server.documents.store import DocumentStore
        from mcp_server.places import load_places

        engine = create_engine(settings.database_url)
        client = AsyncQdrantClient(url=settings.qdrant_url)
        embedder = OpenAIEmbedder(AsyncOpenAI())
        return cls(
            settings,
            engine,
            client,
            DocumentStore(session_maker(engine)),
            embedder,
            DocumentIndex(client, embedder),
            load_places(),
        )

    def search(self, **thresholds: float) -> "DocumentSearch":
        from mcp_server.documents.search import DocumentSearch

        return DocumentSearch(
            self.store,
            self.index,
            self.embedder,
            self.settings,
            self.places,
            **thresholds,
        )

    def pipeline(self) -> "Pipeline":
        from mcp_server.documents.ingest.describe import (
            FigureDescriber,
            SummaryWriter,
            default_model,
        )
        from mcp_server.documents.ingest.pipeline import Pipeline

        model = default_model()
        return Pipeline(
            self.store,
            self.index,
            self.embedder,
            FigureDescriber(model),
            SummaryWriter(model),
            self.settings,
        )

    async def close(self) -> None:
        await self.client.close()
        await self.engine.dispose()


# seed


async def seed(settings: DocsSettings) -> None:
    from mcp_server.db import create_engine, session_maker
    from mcp_server.documents.store import DocumentStore
    from mcp_server.places import load_places

    matches = load_places().find("Yasuní", "protected_area").places
    if len(matches) != 1:
        sys.exit(f"Expected one Yasuní protected area, found {len(matches)}.")
    engine = create_engine(settings.database_url)
    store = DocumentStore(session_maker(engine))
    try:
        for topic in DEMO_TOPICS:
            if topic.id == YASUNI_TOPIC:
                topic = Topic(topic.id, topic.name, topic.aliases, matches[0].id)
            await store.upsert_topic(topic)
            print(f"topic {topic.id}", f"-> {topic.place_id}" if topic.place_id else "")
    finally:
        await engine.dispose()


# load-demo


async def load_demo(settings: DocsSettings, folder: Path) -> None:
    require_key()
    try:
        import docling  # noqa: F401
    except ModuleNotFoundError as missing:
        sys.exit(f"{NO_EXTRA} ({missing})")
    pdfs = {s.id: folder / f"{s.id}.pdf" for s in DEMO_SOURCES if s.url is None}
    missing_pdfs = [str(p) for p in pdfs.values() if not p.is_file()]
    if missing_pdfs:
        sys.exit(f"Missing demo PDFs: {', '.join(missing_pdfs)}")

    parts = _Parts.build(settings)
    try:
        known = {t.id for t in await parts.store.list_topics()}
        if not {t for s in DEMO_SOURCES for t in s.topics} <= known:
            sys.exit(NO_TOPICS)
        await parts.index.ensure_collections()
        for source in DEMO_SOURCES:
            await add_source(parts.store, settings, source, pdfs.get(source.id))
        # The worker of a running serve would take these jobs anyway; two workers
        # would each fail the other's running job as interrupted.
        lock = single_instance(settings.data_dir / LOCK_FILE)
        if lock is None:
            print("serve is running: its worker will process the queued jobs.")
            return
        try:
            await _run_jobs(parts)
        finally:
            lock.close()
    finally:
        await parts.close()


async def add_source(
    store: "DocumentStore", settings: DocsSettings, source: DemoSource, pdf: Path | None
) -> None:
    """Adds and queues a demo source; one whose ingest failed is queued again."""
    from mcp_server.documents.ingest.pipeline import incoming_dir

    document = await store.get_document(source.id)
    if document is not None and document.status != "error":
        print(f"{source.id}: already added, left as it is")
        return
    if document is None:
        document = Document(
            id=source.id,
            type="web" if source.url else "pdf",
            title=source.title,
            origin=source.url or f"uploads/{source.id}.pdf",
            authors_year=source.authors_year,
            topic_ids=tuple(sorted(source.topics)),
        )
        await store.upsert_document(document)
    if pdf is None:
        await store.enqueue("ingest_web", document.id)
    else:
        upload = incoming_dir(settings) / f"{uuid.uuid4().hex}.pdf"
        upload.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(pdf, upload)
        await store.enqueue("ingest_pdf", document.id, {"path": str(upload)})
    print(f"{source.id}: queued")


async def _run_jobs(parts: _Parts) -> None:
    from langchain_core.callbacks import get_usage_metadata_callback

    from mcp_server.documents.ingest.jobs import Worker

    worker = Worker(parts.store, parts.pipeline())
    await parts.store.recover_interrupted()
    with get_usage_metadata_callback() as usage:
        while await worker.run_once():
            pass
    for doc in await parts.store.list_documents():
        figures = await parts.store.list_figures(doc.id)
        pending = sum(f.review_status == "pending_review" for f in figures)
        print(
            f"{doc.id}: {doc.status} {doc.error_message}".rstrip()
            + f", {doc.chunk_count} passages, {len(figures)} figures"
            f" ({pending} to review), summary {doc.summary_status}"
        )
    print(f"embedding tokens: {parts.embedder.tokens}")
    for model, tokens in usage.usage_metadata.items():
        print(
            f"{model}: {tokens['input_tokens']} input, "
            f"{tokens['output_tokens']} output tokens"
        )


# eval


@dataclass(frozen=True)
class Question:
    id: str
    question: str
    lang: str
    answerable: bool
    origin: str | None
    expected_answer: str
    expected_snippets: list[str]


@dataclass(frozen=True)
class Outcome:
    question: Question
    rank: int | None
    """Position of the first passage holding an expected snippet, from 1."""
    passages: int


@dataclass(frozen=True)
class EvalRun:
    outcomes: list[Outcome]

    def recall(self, lang: str | None = None) -> float:
        scoped = [
            o
            for o in self.outcomes
            if o.question.answerable and lang in (None, o.question.lang)
        ]
        return sum(o.rank is not None for o in scoped) / len(scoped) if scoped else 0.0

    def misses(self) -> list[str]:
        return [
            o.question.id
            for o in self.outcomes
            if o.question.answerable and o.rank is None
        ]

    def unanswerable(self) -> dict[str, int]:
        """Passages returned for each question the documents do not answer."""
        return {
            o.question.id: o.passages
            for o in self.outcomes
            if not o.question.answerable
        }


def load_questions(path: Path) -> list[Question]:
    import yaml

    return [Question(**entry) for entry in yaml.safe_load(path.read_text())]


def is_hit(text: str, snippets: list[str]) -> bool:
    """Case and whitespace do not count, as in the document-search test."""
    normal = _normalize(text)
    return any(_normalize(s) in normal for s in snippets)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


async def evaluate(
    search: "DocumentSearch", questions: list[Question], k: int = EVAL_K
) -> EvalRun:
    outcomes: list[Outcome] = []
    for q in questions:
        passages = (await search.search(q.question, limit=k)).passages
        rank = next(
            (
                i
                for i, p in enumerate(passages, start=1)
                if q.answerable and is_hit(p.text, q.expected_snippets)
            ),
            None,
        )
        outcomes.append(Outcome(q, rank, len(passages)))
    return EvalRun(outcomes)


async def run_eval(settings: DocsSettings, path: Path, sparse_weight: float) -> None:
    from mcp_server.documents.search import PASSAGE_MIN_SCORE, SPARSE_WEIGHT

    require_key()
    questions = load_questions(path)
    parts = _Parts.build(settings)
    # Fused scores are ranks, not similarities: the passage threshold is set on
    # dense scores, so the hybrid run is measured without it.
    runs = {
        "dense": {"sparse_weight": 0.0},
        f"hybrid {sparse_weight:g}": {
            "sparse_weight": sparse_weight,
            "passage_min_score": 0.0,
        },
    }
    try:
        print(f"recall@{EVAL_K}, {len(questions)} questions")
        print(
            f"configured: SPARSE_WEIGHT={SPARSE_WEIGHT:g}",
            f"PASSAGE_MIN_SCORE={PASSAGE_MIN_SCORE:g}",
        )
        print(f"{'':12} {'all':>6} {'es':>6} {'en':>6}")
        details: list[str] = []
        for name, options in runs.items():
            run = await evaluate(parts.search(**options), questions)
            print(
                f"{name:12} {run.recall():6.1%} {run.recall('es'):6.1%} "
                f"{run.recall('en'):6.1%}"
            )
            details.append(f"{name} misses: {', '.join(run.misses()) or 'none'}")
            details.append(
                f"{name} passages on unanswerable questions: "
                + ", ".join(f"{q} {n}" for q, n in run.unanswerable().items())
            )
        print("\n".join(details))
    finally:
        await parts.close()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="amazonia360-docs")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser(
        "serve", help="run the back office and the job worker on 127.0.0.1"
    )
    commands.add_parser("migrate", help="create or upgrade the document tables")
    commands.add_parser("seed", help="add the demo topics")
    load = commands.add_parser(
        "load-demo", help="add the six demo sources and process them"
    )
    load.add_argument("folder", type=Path, help="folder with the four demo PDFs")
    measure = commands.add_parser(
        "eval", help="recall of the questions over the loaded corpus"
    )
    measure.add_argument("questions", type=Path, help="questions YAML file")
    measure.add_argument(
        "--sparse-weight",
        type=float,
        default=HYBRID_SPARSE_WEIGHT,
        help="BM25 weight of the hybrid run",
    )
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
    elif args.command == "serve":
        serve(settings)
    else:
        import anyio

        if args.command == "seed":
            anyio.run(seed, settings)
        elif args.command == "load-demo":
            anyio.run(load_demo, settings, args.folder)
        else:
            anyio.run(run_eval, settings, args.questions, args.sparse_weight)


if __name__ == "__main__":
    main()
