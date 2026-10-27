"""The back office over the test database, an in-memory Qdrant and fakes for
OpenAI and Docling. Imported by test modules after they skip without FastAPI."""

from pathlib import Path

import httpx
from qdrant_client import AsyncQdrantClient
from sqlalchemy.ext.asyncio import AsyncEngine

from mcp_server.db import create_engine, session_maker
from mcp_server.documents.backoffice.app import create_backoffice
from mcp_server.documents.index import DocumentIndex
from mcp_server.documents.ingest.jobs import Worker
from mcp_server.documents.ingest.pipeline import Pipeline
from mcp_server.documents.models import Document, Figure, Passage, make_passage_id
from mcp_server.documents.search import DocumentSearch
from mcp_server.documents.settings import DocsSettings
from mcp_server.documents.store import DocumentStore
from mcp_server.places import load_places

from ..fakes import FakeEmbedder
from ..ingest.conftest import FakeDescriber, FakeExtractor, FakeOcr, FakeSummaryWriter

BASE_URL = "http://127.0.0.1:8770"
NAPO = "napo"


class Backoffice:
    def __init__(
        self,
        store: DocumentStore,
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
        # Above zero: the fake embedder scores unrelated passages exactly 0.
        self.search = DocumentSearch(
            store,
            index,
            self.embedder,
            self.settings,
            load_places(),
            passage_min_score=0.05,
        )
        self.pipeline = Pipeline(
            store,
            index,
            self.embedder,
            FakeDescriber(),
            FakeSummaryWriter(),
            self.settings,
            pdf_extractor=FakeExtractor(),
            ocr_factory=lambda: FakeOcr(""),
        )
        self.worker = Worker(store, self.pipeline, poll_seconds=0.01)
        self.qdrant_up = True

        async def qdrant_ok() -> bool:
            return self.qdrant_up

        self.app = create_backoffice(
            self.settings,
            store,
            index,
            self.search,
            self.pipeline,
            qdrant_ok=qdrant_ok,
        )
        self.client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=self.app), base_url=BASE_URL
        )

    async def add_pdf(
        self,
        document_id: str = NAPO,
        sections: dict[str, str] | None = None,
        **overrides: object,
    ) -> Document:
        """An indexed PDF with its stored file and one passage per section."""
        values: dict[str, object] = {
            "id": document_id,
            "type": "pdf",
            "title": "Forest loss in the Napo basin",
            "origin": f"uploads/{document_id}.pdf",
            "authors_year": "Bass et al. (2010)",
            "status": "indexed",
        }
        document = Document(**{**values, **overrides})  # type: ignore[arg-type]
        await self.store.upsert_document(document)
        stored = self.settings.uploads_dir / f"{document_id}.pdf"
        stored.parent.mkdir(parents=True, exist_ok=True)
        stored.write_bytes(b"%PDF-1.7 stored")
        texts = sections or {"Results": "Roads along the Napo river cleared forest."}
        await self.index.upsert(
            [
                Passage(
                    passage_id=make_passage_id(document_id, "i1", ordinal),
                    document_id=document_id,
                    document_type=document.type,
                    ingest_id="i1",
                    section_path=section,
                    text=text,
                    embed_text=f"{section}\n{text}",
                    origin="text",
                    page=ordinal + 1,
                    position=ordinal,
                    topic_ids=document.topic_ids,
                )
                for ordinal, (section, text) in enumerate(texts.items())
            ]
        )
        return document

    async def add_figures(self, document_id: str, figures: list[Figure]) -> None:
        self.settings.figures_dir.mkdir(parents=True, exist_ok=True)
        for figure in figures:
            Path(figure.image_path).write_bytes(b"\x89PNG figure")
        await self.store.replace_figures(document_id, figures)

    async def document(self, document_id: str = NAPO) -> Document:
        found = await self.store.get_document(document_id)
        assert found is not None
        return found

    async def jobs(self, document_id: str = NAPO) -> list[tuple[str, str]]:
        return [(j.kind, j.status) for j in await self.store.active_jobs(document_id)]


async def build(
    clean_docs_database: str, tmp_path: Path
) -> tuple[Backoffice, AsyncEngine, AsyncQdrantClient]:
    engine = create_engine(clean_docs_database)
    client = AsyncQdrantClient(":memory:")
    embedder = FakeEmbedder()
    index = DocumentIndex(client, embedder)
    await index.ensure_collections()
    store = DocumentStore(session_maker(engine))
    return Backoffice(store, index, embedder, tmp_path), engine, client
