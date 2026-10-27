import os
from typing import Literal, Protocol

from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from qdrant_client import AsyncQdrantClient

from mcp_server.config import ConfigError
from mcp_server.db import create_engine, session_maker
from mcp_server.documents.embedding import Embedded, Embedder, OpenAIEmbedder
from mcp_server.documents.index import DocumentIndex
from mcp_server.documents.links import document_link, passage_link
from mcp_server.documents.models import Document, Passage, Topic
from mcp_server.documents.resolve import resolve_topic
from mcp_server.documents.settings import DocsSettings
from mcp_server.documents.store import DocumentStore
from mcp_server.places import Places

# From `amazonia360-docs eval` on the demo corpus (27 October 2026). BM25 lowered
# recall at every weight tried (90.9% against 93.9% dense; 88.5% against 96.2% on
# Spanish questions over English documents), so search is dense only.
SPARSE_WEIGHT = 0.0
# A cosine similarity, so it only means something while SPARSE_WEIGHT is 0. The
# lowest-scoring passage that answers a question scored 0.43; a near passage on a
# question the documents do not answer scored up to 0.55, so no value separates them
# and the instructions do: answer only from a passage that answers.
PASSAGE_MIN_SCORE = 0.40
# Summaries of documents on another place scored 0.45 and 0.49 against a question
# (Sangay, Galápagos); on the place and theme asked, 0.60 to 0.69.
SUMMARY_MIN_SCORE = 0.50
DEFAULT_LIMIT = 8
MAX_LIMIT = 20
NO_PLACE_TOPIC = "No topic is tied to this place; searched every document."
UNKNOWN_PLACE = "No place has that place_id; searched every document."
NO_TOPIC = "No topic has that name. Call list_topics to see the topics."
AMBIGUOUS_TOPIC = "Several topics match. Ask which one is meant and search again."
OPENAI_KEY = "OPENAI_API_KEY"


class TopicOut(BaseModel):
    id: str = Field(description="Pass as topic to search_documents.")
    name: str
    place_id: str | None = Field(
        default=None, description="The place this topic is tied to, when it has one."
    )


class DocumentOut(BaseModel):
    document_id: str = Field(description="Pass as document_id to read a section.")
    title: str
    authors_year: str = Field(
        description="Short citation, such as 'Finer et al. 2008'."
    )
    type: Literal["pdf", "web"]
    topics: list[str] = Field(description="Ids of the topics the document belongs to.")


class TopicList(BaseModel):
    topics: list[TopicOut]
    documents: list[DocumentOut]


class PassageOut(BaseModel):
    document_id: str
    title: str
    authors_year: str
    section: str = Field(description="Heading path of the section the passage is in.")
    page: int | None = Field(default=None, description="PDF page, when known.")
    origin: str = Field(
        description="Where the passage was taken from: 'text', 'table' or 'figure'."
    )
    text: str
    link: str | None = Field(
        default=None, description="Where the passage can be read. Quote it."
    )


class RelatedDocument(BaseModel):
    document_id: str
    title: str
    authors_year: str
    summary: str = Field(description="Reviewed summary of the document.")
    topics: list[str] = Field(description="Ids of the topics the document belongs to.")
    link: str | None = None
    matched_by: Literal["summary", "topic"] = Field(
        description="'summary' when the summary answers the query; 'topic' when the "
        "document belongs to the topic or to the topic tied to the place."
    )


class SearchResult(BaseModel):
    passages: list[PassageOut]
    related_documents: list[RelatedDocument] = Field(
        description="Documents that may help although none of their passages "
        "answered the query. Mention them as leads, not as answers."
    )
    topic: str | None = Field(
        default=None, description="Id of the topic the search was restricted to."
    )
    candidates: list[TopicOut] = Field(
        default_factory=list,
        description="When the topic is ambiguous: the topics to ask the user about.",
    )
    note: str | None = None


class Section(BaseModel):
    document_id: str
    title: str
    section: str
    text: str
    link: str | None = None


class _Store(Protocol):
    async def list_topics(self) -> list[Topic]: ...

    async def get_document(self, document_id: str) -> Document | None: ...

    async def list_documents(self, topic_id: str | None = None) -> list[Document]: ...


class DocumentSearch:
    def __init__(
        self,
        store: _Store,
        index: DocumentIndex,
        embedder: Embedder,
        settings: DocsSettings,
        places: Places,
        *,
        passage_min_score: float = PASSAGE_MIN_SCORE,
        summary_min_score: float = SUMMARY_MIN_SCORE,
        sparse_weight: float = SPARSE_WEIGHT,
    ) -> None:
        self._store = store
        self._index = index
        self._embedder = embedder
        self._settings = settings
        self._places = places
        self._passage_min_score = passage_min_score
        self._summary_min_score = summary_min_score
        self._sparse_weight = sparse_weight

    async def list_topics(self) -> TopicList:
        topics = await self._store.list_topics()
        documents = await self._store.list_documents()
        return TopicList(
            topics=[_topic_out(t) for t in topics],
            documents=[_document_out(d) for d in documents],
        )

    async def search(
        self,
        query: str,
        topic: str | None = None,
        place_id: str | None = None,
        limit: int = DEFAULT_LIMIT,
    ) -> SearchResult:
        limit = min(max(limit, 1), MAX_LIMIT)
        topics = await self._store.list_topics()
        scope, candidates, note = self._scope(topic, place_id, topics)
        if scope is None:
            return SearchResult(
                passages=[], related_documents=[], candidates=candidates, note=note
            )
        topic_ids = [t.id for t in scope]
        embedded = await self._embedder.embed_query(query)
        hits = await self._index.search(
            embedded, topic_ids or None, limit, self._sparse_weight
        )
        hits = [(p, s) for p, s in hits if s >= self._passage_min_score]
        passages = await self._passages(hits)
        answered = {p.document_id for p in passages}
        related = await self._related(embedded, topic_ids, limit, answered)
        return SearchResult(
            passages=passages,
            related_documents=related,
            topic=scope[0].id if topic and len(scope) == 1 else None,
            note=note,
        )

    async def section(self, document_id: str, section_path: str) -> Section:
        doc = await self._store.get_document(document_id)
        if doc is None:
            raise LookupError(f"No document has the id {document_id!r}.")
        passages = await self._index.section(document_id, section_path)
        if not passages:
            raise LookupError(
                f"Document {document_id!r} has no section {section_path!r}."
            )
        return Section(
            document_id=doc.id,
            title=doc.title,
            section=section_path,
            text="\n\n".join(p.text for p in passages),
            link=passage_link(passages[0], doc, self._settings),
        )

    def _scope(
        self, topic: str | None, place_id: str | None, topics: list[Topic]
    ) -> tuple[list[Topic] | None, list[TopicOut], str | None]:
        """The topics to restrict to ([] means everything), or None to stop."""
        if topic:
            resolved = resolve_topic(topic, topics)
            if resolved.topic:
                return [resolved.topic], [], None
            if resolved.candidates:
                candidates = [_topic_out(t) for t in resolved.candidates]
                return None, candidates, AMBIGUOUS_TOPIC
            return None, [], NO_TOPIC
        if place_id:
            if self._places.get(place_id) is None:
                return [], [], UNKNOWN_PLACE
            tied = [t for t in topics if t.place_id == place_id]
            return tied, [], None if tied else NO_PLACE_TOPIC
        return [], [], None

    async def _passages(self, hits: list[tuple[Passage, float]]) -> list[PassageOut]:
        docs: dict[str, Document | None] = {}
        out: list[PassageOut] = []
        for passage, _ in hits:
            if passage.document_id not in docs:
                docs[passage.document_id] = await self._store.get_document(
                    passage.document_id
                )
            doc = docs[passage.document_id]
            if doc is None:
                continue
            out.append(
                PassageOut(
                    document_id=doc.id,
                    title=doc.title,
                    authors_year=doc.authors_year,
                    section=passage.section_path,
                    page=passage.page,
                    origin=passage.origin,
                    text=passage.text,
                    link=passage_link(passage, doc, self._settings),
                )
            )
        return out

    async def _related(
        self, embedded: Embedded, topic_ids: list[str], limit: int, answered: set[str]
    ) -> list[RelatedDocument]:
        matched: dict[str, Literal["summary", "topic"]] = {}
        summary_hits = await self._index.search_summaries(
            embedded, topic_ids or None, limit
        )
        for document_id, score in summary_hits:
            if score >= self._summary_min_score:
                matched[document_id] = "summary"
        for topic_id in topic_ids:
            for doc in await self._store.list_documents(topic_id):
                matched.setdefault(doc.id, "topic")
        related: list[RelatedDocument] = []
        for document_id, how in matched.items():
            if document_id in answered:
                continue
            doc = await self._store.get_document(document_id)
            if doc is None or doc.summary_status != "approved":
                continue
            related.append(
                RelatedDocument(
                    document_id=doc.id,
                    title=doc.title,
                    authors_year=doc.authors_year,
                    summary=doc.summary,
                    topics=list(doc.topic_ids),
                    link=document_link(doc, self._settings),
                    matched_by=how,
                )
            )
        return related[:limit]


def build_document_search(settings: DocsSettings, places: Places) -> DocumentSearch:
    if not os.environ.get(OPENAI_KEY, "").strip():
        raise ConfigError(f"Document search needs {OPENAI_KEY} to embed queries.")
    embedder = OpenAIEmbedder(AsyncOpenAI())
    client = AsyncQdrantClient(url=settings.qdrant_url)
    store = DocumentStore(session_maker(create_engine(settings.database_url)))
    return DocumentSearch(
        store, DocumentIndex(client, embedder), embedder, settings, places
    )


def _topic_out(topic: Topic) -> TopicOut:
    return TopicOut(id=topic.id, name=topic.name, place_id=topic.place_id)


def _document_out(doc: Document) -> DocumentOut:
    return DocumentOut(
        document_id=doc.id,
        title=doc.title,
        authors_year=doc.authors_year,
        type=doc.type,
        topics=list(doc.topic_ids),
    )
