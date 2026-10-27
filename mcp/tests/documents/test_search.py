from collections.abc import AsyncIterator
from dataclasses import replace
from pathlib import Path

import pytest
from qdrant_client import AsyncQdrantClient

from mcp_server.config import ConfigError
from mcp_server.documents.index import DocumentIndex
from mcp_server.documents.models import (
    Document,
    Passage,
    Topic,
    make_passage_id,
)
from mcp_server.documents.search import DocumentSearch, build_document_search
from mcp_server.documents.settings import DocsSettings
from mcp_server.places import load_places

from .fakes import FakeEmbedder

pytestmark = [
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
    pytest.mark.filterwarnings("ignore:Failed to obtain server version"),
]

SETTINGS = DocsSettings("db", "qdrant", "http://127.0.0.1:8770", Path("data"))


class FakeStore:
    def __init__(self, topics: list[Topic], documents: list[Document]) -> None:
        self.topics = topics
        self.documents = {d.id: d for d in documents}

    async def list_topics(self) -> list[Topic]:
        return self.topics

    async def get_document(self, document_id: str) -> Document | None:
        return self.documents.get(document_id)

    async def list_documents(self, topic_id: str | None = None) -> list[Document]:
        return [
            d
            for d in self.documents.values()
            if topic_id is None or topic_id in d.topic_ids
        ]


def doc(
    document_id: str,
    topics: tuple[str, ...] = (),
    summary: str = "Summary.",
    status: str = "approved",
) -> Document:
    return Document(
        id=document_id,
        type="pdf",
        title=f"Title {document_id}",
        origin=f"uploads/{document_id}.pdf",
        authors_year="Finer 2008",
        summary=summary,
        summary_status=status,  # type: ignore[arg-type]
        topic_ids=topics,
    )


def passage(document_id: str, text: str, topics: tuple[str, ...], page: int = 3):
    return Passage(
        passage_id=make_passage_id(document_id, "i1", 0),
        document_id=document_id,
        document_type="pdf",
        ingest_id="i1",
        section_path="Intro",
        text=text,
        embed_text=text,
        origin="text",
        page=page,
        topic_ids=topics,
    )


TOPICS = [
    Topic("water", "Water quality"),
    Topic("forest", "Forest loss"),
    Topic("forest-law", "Forest law"),
    Topic("yasuni", "Yasuní oil", place_id="protected_area:Yasuní"),
]
DOCS = [
    doc("finer-2008", ("water",), summary="Oil and water quality in Sucumbios."),
    doc("hansen", ("forest",), summary="Global forest change."),
    doc("draft", ("water",), summary="Not reviewed.", status="pending_review"),
    doc("yasuni-oil", ("yasuni",), summary="Oil blocks in Yasuní."),
]


@pytest.fixture
async def index() -> AsyncIterator[tuple[DocumentIndex, FakeEmbedder]]:
    embedder = FakeEmbedder()
    client = AsyncQdrantClient(":memory:")
    result = DocumentIndex(client, embedder)
    await result.ensure_collections()
    await result.upsert(
        [
            passage("hansen", "deforestation forest cover loss", ("forest",)),
            passage("yasuni-oil", "deforestation near oil roads", ("yasuni",)),
        ]
    )
    for d in DOCS:
        vector = (await embedder.embed_documents([d.summary]))[0].dense
        await result.upsert_summary(d, vector, "link")
    embedder.calls = 0
    yield result, embedder
    await client.close()


def make_search(
    index: tuple[DocumentIndex, FakeEmbedder], **overrides: float
) -> DocumentSearch:
    values = {"passage_min_score": 0.3, "summary_min_score": 0.6, "sparse_weight": 0.0}
    return DocumentSearch(
        FakeStore(TOPICS, DOCS),
        index[0],
        index[1],
        SETTINGS,
        load_places(),
        **(values | overrides),
    )


@pytest.fixture
def search(index: tuple[DocumentIndex, FakeEmbedder]) -> DocumentSearch:
    return make_search(index)


async def test_unapproved_summary_is_never_related(search: DocumentSearch) -> None:
    result = await search.search("Not reviewed", topic="water")
    assert "draft" not in {d.document_id for d in result.related_documents}


async def test_related_documents_come_back_when_no_passage_answers(
    search: DocumentSearch,
) -> None:
    result = await search.search("oil and water quality in Sucumbios")
    assert result.passages == []
    assert [d.document_id for d in result.related_documents] == ["finer-2008"]
    assert result.related_documents[0].matched_by == "summary"


async def test_a_document_with_a_passage_is_not_also_listed_as_related(
    search: DocumentSearch,
) -> None:
    result = await search.search("deforestation forest cover loss")
    assert [p.document_id for p in result.passages] == ["hansen"]
    assert result.passages[0].link == (
        "http://127.0.0.1:8770/files/uploads/hansen.pdf#page=3"
    )
    assert "hansen" not in {d.document_id for d in result.related_documents}


async def test_query_is_embedded_once(
    search: DocumentSearch, index: tuple[DocumentIndex, FakeEmbedder]
) -> None:
    await search.search("deforestation")
    assert index[1].calls == 1


async def test_place_without_topic_searches_everything_and_says_so(
    search: DocumentSearch,
) -> None:
    result = await search.search("deforestation", place_id="canton:Napo/Tena")
    assert result.note == "No topic is tied to this place; searched every document."
    assert result.passages


async def test_unknown_place_searches_everything_and_says_so(
    search: DocumentSearch,
) -> None:
    result = await search.search("deforestation", place_id="canton:Nowhere")
    assert result.note == "No place has that place_id; searched every document."


async def test_ambiguous_topic_returns_candidates_and_no_results(
    search: DocumentSearch,
) -> None:
    result = await search.search("deforestation", topic="fore")
    assert result.passages == []
    assert result.related_documents == []
    assert [c.id for c in result.candidates] == ["forest", "forest-law"]
    assert result.note


async def test_unknown_topic_says_so(search: DocumentSearch) -> None:
    result = await search.search("deforestation", topic="mining")
    assert result.passages == []
    assert result.candidates == []
    assert result.note and "list_topics" in result.note


async def test_topic_restricts_passages(search: DocumentSearch) -> None:
    result = await search.search("deforestation", topic="Water quality")
    assert result.topic == "water"
    assert result.passages == []


async def test_place_tied_topic_matches_documents_by_topic(
    search: DocumentSearch,
) -> None:
    result = await search.search("unrelated words", place_id="protected_area:Yasuní")
    assert result.note is None
    assert [(d.document_id, d.matched_by) for d in result.related_documents] == [
        ("yasuni-oil", "topic")
    ]


async def test_limit_is_capped(
    index: tuple[DocumentIndex, FakeEmbedder],
) -> None:
    search = make_search(index, passage_min_score=-1.0)
    result = await search.search("deforestation", limit=500)
    assert len(result.passages) == 2
    result = await search.search("deforestation", limit=0)
    assert len(result.passages) == 1


async def test_defaults_come_from_module_constants(
    index: tuple[DocumentIndex, FakeEmbedder],
) -> None:
    search = DocumentSearch(
        FakeStore(TOPICS, DOCS), index[0], index[1], SETTINGS, load_places()
    )
    result = await search.search("deforestation")
    assert {p.document_id for p in result.passages} == {"hansen", "yasuni-oil"}


async def test_list_topics(search: DocumentSearch) -> None:
    result = await search.list_topics()
    assert [t.id for t in result.topics] == [t.id for t in TOPICS]
    assert result.documents[0].document_id == "finer-2008"
    assert result.documents[0].topics == ["water"]


async def test_section_joins_its_passages(
    index: tuple[DocumentIndex, FakeEmbedder],
) -> None:
    await index[0].upsert(
        [
            replace(
                passage("hansen", "second", ("forest",)),
                passage_id=make_passage_id("hansen", "i1", 1),
                position=1,
            )
        ]
    )
    result = await make_search(index).section("hansen", "Intro")
    assert result.text == "deforestation forest cover loss\n\nsecond"
    assert result.title == "Title hansen"
    assert result.link == "http://127.0.0.1:8770/files/uploads/hansen.pdf#page=3"


async def test_section_leaves_figure_descriptions_and_their_crops_out(
    index: tuple[DocumentIndex, FakeEmbedder],
) -> None:
    figure = replace(
        passage("hansen", "FIGURE DESC", ("forest",)),
        passage_id=make_passage_id("hansen", "fig", 0),
        ingest_id="fig",
        origin="figure",
        figure_path="figures/abc123.png",
    )
    await index[0].upsert([figure])
    result = await make_search(index).section("hansen", "Intro")
    assert result.text == "deforestation forest cover loss"
    assert result.link == "http://127.0.0.1:8770/files/uploads/hansen.pdf#page=3"


async def test_search_never_computes_bm25_when_the_sparse_weight_is_zero(
    index: tuple[DocumentIndex, FakeEmbedder],
) -> None:
    await make_search(index, sparse_weight=0.0).search("deforestation")
    assert index[1].sparse_queries == 0
    await make_search(index, sparse_weight=0.5).search("deforestation")
    assert index[1].sparse_queries == 1


async def test_section_of_unknown_document_or_section_raises(
    search: DocumentSearch,
) -> None:
    with pytest.raises(LookupError):
        await search.section("nope", "Intro")
    with pytest.raises(LookupError):
        await search.section("hansen", "Nowhere")


def test_build_requires_the_openai_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(ConfigError, match="OPENAI_API_KEY"):
        build_document_search(SETTINGS, load_places())


def test_build_makes_a_search_without_network_or_bm25(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def forbidden(*args: object, **kwargs: object) -> None:
        raise AssertionError("BM25 must not load at construction")

    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setattr("mcp_server.documents.embedding.SparseTextEmbedding", forbidden)
    settings = DocsSettings(
        "postgresql+asyncpg://u:p@unreachable.invalid:5432/db",
        "http://unreachable.invalid:6333",
    )
    assert isinstance(build_document_search(settings, load_places()), DocumentSearch)
