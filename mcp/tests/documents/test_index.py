from collections.abc import AsyncIterator

import pytest
from qdrant_client import AsyncQdrantClient

from mcp_server.documents.index import DocumentIndex, _summary_id
from mcp_server.documents.models import Document, Passage, make_passage_id

from .fakes import FakeEmbedder

pytestmark = [
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]


def passage(
    document_id: str = "d1",
    text: str = "forest cover loss",
    ingest: str = "i1",
    ordinal: int = 0,
    topics: tuple[str, ...] = (),
    section: str = "Intro",
    origin: str = "text",
) -> Passage:
    return Passage(
        passage_id=make_passage_id(document_id, ingest, ordinal),
        document_id=document_id,
        document_type="pdf",
        ingest_id=ingest,
        section_path=section,
        text=text,
        embed_text=text,
        origin=origin,
        position=ordinal,
        topic_ids=topics,
    )


@pytest.fixture
def embedder() -> FakeEmbedder:
    return FakeEmbedder()


@pytest.fixture
async def index(embedder: FakeEmbedder) -> AsyncIterator[DocumentIndex]:
    client = AsyncQdrantClient(":memory:")
    result = DocumentIndex(client, embedder)
    await result.ensure_collections()
    yield result
    await client.close()


async def test_ensure_collections_is_idempotent(index: DocumentIndex) -> None:
    await index.ensure_collections()


async def test_topic_filter_returns_only_passages_of_that_topic(
    index: DocumentIndex, embedder: FakeEmbedder
) -> None:
    await index.upsert(
        [
            passage("d1", "gold mining rivers", topics=("mining",)),
            passage("d2", "gold mining rivers", topics=("forest",)),
        ]
    )
    query = await embedder.embed_query("gold mining")
    hits = await index.search(query, ["mining"], limit=5, sparse_weight=1.0)
    assert {p.document_id for p, _ in hits} == {"d1"}
    hits = await index.search(query, None, limit=5, sparse_weight=1.0)
    assert {p.document_id for p, _ in hits} == {"d1", "d2"}


async def test_a_new_ingest_replaces_the_old_only_when_asked(
    index: DocumentIndex,
) -> None:
    await index.upsert([passage("d1", ingest="old")])
    await index.upsert([passage("d1", ingest="new")])
    assert {p.ingest_id for p in await index.list_document("d1")} == {"old", "new"}
    await index.delete_document("d1", keep_ingest_id="new")
    assert {p.ingest_id for p in await index.list_document("d1")} == {"new"}


async def test_delete_origin_keeps_other_origins(index: DocumentIndex) -> None:
    await index.upsert(
        [passage(ordinal=0), passage(ordinal=1, origin="figure", text="map")]
    )
    await index.delete_origin("d1", "figure")
    assert [p.origin for p in await index.list_document("d1")] == ["text"]


async def test_sparse_weight_zero_is_dense_only(
    index: DocumentIndex, embedder: FakeEmbedder
) -> None:
    await index.upsert([passage("d1", "gold mining rivers")])
    query = await embedder.embed_query("gold mining")
    hits = await index.search(query, None, limit=3, sparse_weight=0)
    assert [p.document_id for p, _ in hits] == ["d1"]
    assert hits[0][1] > 0.5


async def test_hybrid_finds_an_exact_term_through_the_sparse_list(
    index: DocumentIndex, embedder: FakeEmbedder
) -> None:
    await index.upsert(
        [
            passage("d1", "alpha beta gamma", ordinal=0),
            passage("d1", "zzyzx quarry", ordinal=1),
        ]
    )
    query = await embedder.embed_query("zzyzx")
    hits = await index.search(query, None, limit=1, sparse_weight=1.0)
    assert hits[0][0].text == "zzyzx quarry"


async def test_section_and_list_are_in_reading_order(index: DocumentIndex) -> None:
    await index.upsert(
        [
            passage(ordinal=2, section="A"),
            passage(ordinal=1, section="A"),
            passage(ordinal=3, section="B"),
        ]
    )
    assert [p.position for p in await index.section("d1", "A")] == [1, 2]
    assert len(await index.list_document("d1")) == 3


async def test_set_topics_rewrites_payload_without_reembedding(
    index: DocumentIndex, embedder: FakeEmbedder
) -> None:
    await index.upsert([passage("d1", topics=("forest",))])
    calls = embedder.calls
    await index.set_topics("d1", ["mining"])
    assert embedder.calls == calls
    (stored,) = await index.list_document("d1")
    assert stored.topic_ids == ("mining",)


async def test_summaries_search_and_delete(
    index: DocumentIndex, embedder: FakeEmbedder
) -> None:
    document = Document(
        id="d1",
        type="pdf",
        title="Napo",
        origin="napo.pdf",
        authors_year="Silva 2021",
        topic_ids=("forest",),
    )
    embedded = await embedder.embed_query("deforestation summary")
    await index.upsert_summary(document, embedded.dense, "https://example.org/d1")
    query = await embedder.embed_query("deforestation")
    hits = await index.search_summaries(query, ["forest"], limit=3)
    assert [d for d, _ in hits] == ["d1"]
    (stored,) = await index._client.retrieve(index._summaries, [_summary_id("d1")])
    assert stored.payload is not None
    assert stored.payload["authors_year"] == "Silva 2021"
    assert await index.search_summaries(query, ["mining"], limit=3) == []
    await index.set_topics("d1", ["mining"])
    assert [d for d, _ in await index.search_summaries(query, ["mining"], 3)] == ["d1"]
    await index.delete_summary("d1")
    assert await index.search_summaries(query, None, limit=3) == []
