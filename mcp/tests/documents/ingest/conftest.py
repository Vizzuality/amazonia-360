import threading
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pytest
from qdrant_client import AsyncQdrantClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from mcp_server.db import create_engine, session_maker
from mcp_server.documents.index import DocumentIndex
from mcp_server.documents.ingest.describe import DescriptionError
from mcp_server.documents.ingest.jobs import Worker
from mcp_server.documents.ingest.pipeline import Pipeline, incoming_dir
from mcp_server.documents.models import (
    Document,
    Figure,
    Job,
    Passage,
    Topic,
    make_passage_id,
)
from mcp_server.documents.settings import DocsSettings
from mcp_server.documents.store import DocumentStore

from ..fakes import FakeEmbedder

DOCUMENT_ID = "napo"
FORESTS = Topic("forests", "Forests")
YASUNI = Topic("yasuni", "Yasuní")
FIRST_VERSION = {
    "Abstract": "We map forest loss in Yasuni between 2000 and 2020.",
    "Results": "Roads along the Napo river cleared most of the forest.",
}


@dataclass
class FakeExtraction:
    chunks: list[Passage]
    figures: list[Figure]


@dataclass
class FakeFigure:
    figure_id: str
    section_path: str
    context: str = ""


class FakeExtractor:
    """Stands in for Docling: one passage per section, figures as configured."""

    def __init__(self) -> None:
        self.sections = dict(FIRST_VERSION)
        self.figures = [FakeFigure("f1", "Results", "Figure 1. Roads and clearings")]
        self.error: Exception | None = None
        # (entered, release): the extraction waits for the test between the two.
        self.hold: tuple[threading.Event, threading.Event] | None = None

    def __call__(
        self, path: Path, document_id: str, ingest_id: str, figures_dir: Path
    ) -> FakeExtraction:
        if self.hold:
            entered, release = self.hold
            entered.set()
            release.wait(timeout=10)
        if self.error:
            raise self.error
        chunks = [
            Passage(
                passage_id=make_passage_id(document_id, ingest_id, ordinal),
                document_id=document_id,
                document_type="pdf",
                ingest_id=ingest_id,
                section_path=section,
                text=text,
                embed_text=f"{section}\n{text}",
                origin="text",
                page=ordinal + 1,
                position=ordinal,
            )
            for ordinal, (section, text) in enumerate(self.sections.items())
        ]
        figures = [
            Figure(
                figure_id=f.figure_id,
                document_id=document_id,
                image_path=str(figures_dir / f"{f.figure_id}.png"),
                image_hash=f"hash-{f.figure_id}",
                section_path=f.section_path,
                page=2,
                context=f.context,
            )
            for f in self.figures
        ]
        return FakeExtraction(chunks, figures)


class FakeDescriber:
    def __init__(self) -> None:
        self.seen: list[str] = []
        self.failing: set[str] = set()

    async def describe(self, figure: Figure, document: Document) -> str:
        self.seen.append(figure.figure_id)
        if figure.figure_id in self.failing:
            raise DescriptionError("empty description")
        return f"Map of roads and clearings in {figure.section_path}"


@dataclass
class FakeSummaryWriter:
    calls: list[tuple[list[str], str, list[str]]] = field(default_factory=list)

    async def write(
        self,
        document: Document,
        headings: list[str],
        opening: str,
        captions: list[str],
    ) -> str:
        self.calls.append((headings, opening, captions))
        return f"Forest loss along roads in the Napo basin ({document.title})."


class FakeOcr:
    def __init__(self, text: str) -> None:
        self._text = text

    def read(self, image_path: str) -> str:
        return self._text


class RecordingStore(DocumentStore):
    """Remembers every job enqueued, by the test or by the pipeline."""

    def __init__(self, sessions: async_sessionmaker[AsyncSession]) -> None:
        super().__init__(sessions)
        self.job_ids: list[int] = []

    async def enqueue(
        self, kind: str, document_id: str, payload: dict[str, Any] | None = None
    ) -> Job:
        job = await super().enqueue(kind, document_id, payload)
        if job.id not in self.job_ids:
            self.job_ids.append(job.id)
        return job

    async def latest_job(self, kind: str) -> Job:
        for job_id in reversed(self.job_ids):
            job = await self.get_job(job_id)
            if job is not None and job.kind == kind:
                return job
        raise AssertionError(f"No {kind} job was enqueued")


class Env:
    def __init__(
        self,
        store: RecordingStore,
        index: DocumentIndex,
        embedder: FakeEmbedder,
        data_dir: Path,
    ) -> None:
        self.store = store
        self.index = index
        self.embedder = embedder
        self.settings = DocsSettings(
            database_url="unused", qdrant_url="unused", data_dir=data_dir
        )
        self.extractor = FakeExtractor()
        self.describer = FakeDescriber()
        self.summary_writer = FakeSummaryWriter()
        self.ocr_text = "BLOCK 31"
        self.pipeline = Pipeline(
            store,
            index,
            self.embedder,
            self.describer,
            self.summary_writer,
            self.settings,
            pdf_extractor=self.extractor,
            ocr_factory=lambda: FakeOcr(self.ocr_text),
        )
        self.worker = Worker(store, self.pipeline, poll_seconds=0.01)

    async def run_all(self) -> None:
        while await self.worker.run_once():
            pass

    def upload(self, content: bytes = b"%PDF-1.7 first") -> Path:
        path = incoming_dir(self.settings) / f"{len(content)}-{hash(content)}.pdf"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return path

    async def add_pdf(self, content: bytes = b"%PDF-1.7 first") -> None:
        await self.store.upsert_topic(FORESTS)
        await self.store.upsert_topic(YASUNI)
        await self.store.upsert_document(
            Document(
                id=DOCUMENT_ID,
                type="pdf",
                title="Forest loss in the Napo basin",
                origin=f"uploads/{DOCUMENT_ID}.pdf",
                authors_year="Bass et al. (2010)",
                topic_ids=("forests",),
            )
        )
        await self.ingest(content)

    async def ingest(self, content: bytes) -> None:
        await self.store.enqueue(
            "ingest_pdf", DOCUMENT_ID, {"path": str(self.upload(content))}
        )
        await self.run_all()

    async def passages(self, origin: str | None = None) -> list[Passage]:
        return [
            p
            for p in await self.index.list_document(DOCUMENT_ID)
            if origin is None or p.origin == origin
        ]

    async def searched(self, question: str) -> list[str]:
        query = await self.embedder.embed_query(question)
        return [p.text for p, _ in await self.index.search(query, None, 10, 0.0)]

    async def related(self, question: str, topic_ids: list[str] | None) -> list[str]:
        query = await self.embedder.embed_query(question)
        return [d for d, _ in await self.index.search_summaries(query, topic_ids, 5)]


@pytest.fixture
async def env(clean_docs_database: str, tmp_path: Path) -> AsyncIterator[Env]:
    engine = create_engine(clean_docs_database)
    store = RecordingStore(session_maker(engine))
    client = AsyncQdrantClient(":memory:")
    embedder = FakeEmbedder()
    index = DocumentIndex(client, embedder)
    await index.ensure_collections()
    yield Env(store, index, embedder, tmp_path)
    await client.close()
    await engine.dispose()
