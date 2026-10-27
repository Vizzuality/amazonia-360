import uuid
from dataclasses import asdict, fields

from qdrant_client import AsyncQdrantClient, models

from mcp_server.documents.embedding import Embedded, Embedder, SparseVec
from mcp_server.documents.models import Document, Passage

DENSE = "dense"
SPARSE = "sparse"
DENSE_SIZE = 1536
PREFETCH_FACTOR = 4
SCROLL_PAGE = 256
PASSAGE_FIELDS = frozenset(f.name for f in fields(Passage))
PAYLOAD_INDEXES = ("document_id", "topic_ids")


class DocumentIndex:
    def __init__(
        self,
        client: AsyncQdrantClient,
        embedder: Embedder,
        passages: str = "documents",
        summaries: str = "document_summaries",
    ) -> None:
        self._client = client
        self._embedder = embedder
        self._passages = passages
        self._summaries = summaries

    async def ensure_collections(self) -> None:
        if not await self._client.collection_exists(self._passages):
            await self._client.create_collection(
                self._passages,
                vectors_config={DENSE: _dense_params()},
                sparse_vectors_config={
                    SPARSE: models.SparseVectorParams(modifier=models.Modifier.IDF)
                },
            )
        if not await self._client.collection_exists(self._summaries):
            await self._client.create_collection(
                self._summaries, vectors_config={DENSE: _dense_params()}
            )
        for collection in (self._passages, self._summaries):
            for field in PAYLOAD_INDEXES:
                await self._client.create_payload_index(
                    collection, field, models.PayloadSchemaType.KEYWORD
                )

    async def upsert(self, passages: list[Passage]) -> None:
        if not passages:
            return
        embedded = await self._embedder.embed_documents(
            [p.embed_text for p in passages]
        )
        points = [
            models.PointStruct(
                id=passage.passage_id,
                vector={DENSE: emb.dense, SPARSE: _sparse(emb.sparse)},
                payload=asdict(passage),
            )
            for passage, emb in zip(passages, embedded, strict=True)
        ]
        await self._client.upsert(self._passages, points)

    async def delete_document(
        self, document_id: str, keep_ingest_id: str | None = None
    ) -> None:
        must_not: list[models.Condition] | None = (
            [_match("ingest_id", keep_ingest_id)] if keep_ingest_id else None
        )
        await self._delete(
            models.Filter(must=[_match("document_id", document_id)], must_not=must_not)
        )

    async def delete_origin(self, document_id: str, origin: str) -> None:
        await self._delete(
            models.Filter(
                must=[_match("document_id", document_id), _match("origin", origin)]
            )
        )

    async def set_topics(self, document_id: str, topic_ids: list[str]) -> None:
        selector = models.Filter(must=[_match("document_id", document_id)])
        await self._client.set_payload(
            self._passages, {"topic_ids": topic_ids}, points=selector
        )
        await self._client.set_payload(
            self._summaries, {"topic_ids": topic_ids}, points=selector
        )

    async def search(
        self,
        query: Embedded,
        topic_ids: list[str] | None,
        limit: int,
        sparse_weight: float,
    ) -> list[tuple[Passage, float]]:
        selector = _topic_filter(topic_ids)
        dense = models.Prefetch(
            query=query.dense,
            using=DENSE,
            filter=selector,
            limit=limit * PREFETCH_FACTOR,
        )
        if sparse_weight == 0:
            response = await self._client.query_points(
                self._passages,
                query=query.dense,
                using=DENSE,
                query_filter=selector,
                limit=limit,
                with_payload=True,
            )
        else:
            sparse = models.Prefetch(
                query=_sparse(query.sparse),
                using=SPARSE,
                filter=selector,
                limit=max(1, round(limit * sparse_weight)) * PREFETCH_FACTOR,
            )
            response = await self._client.query_points(
                self._passages,
                prefetch=[dense, sparse],
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                query_filter=selector,
                limit=limit,
                with_payload=True,
            )
        return [(_passage(point.payload), point.score) for point in response.points]

    async def section(self, document_id: str, section_path: str) -> list[Passage]:
        passages = await self._scroll(
            models.Filter(
                must=[
                    _match("document_id", document_id),
                    _match("section_path", section_path),
                ]
            )
        )
        return sorted(passages, key=lambda p: p.position)

    async def list_document(self, document_id: str) -> list[Passage]:
        passages = await self._scroll(
            models.Filter(must=[_match("document_id", document_id)])
        )
        return sorted(passages, key=lambda p: (p.origin != "text", p.position))

    async def upsert_summary(
        self, document: Document, summary_embedding: list[float], link: str
    ) -> None:
        point = models.PointStruct(
            id=_summary_id(document.id),
            vector={DENSE: summary_embedding},
            payload={
                "document_id": document.id,
                "title": document.title,
                "link": link,
                "topic_ids": list(document.topic_ids),
            },
        )
        await self._client.upsert(self._summaries, [point])

    async def delete_summary(self, document_id: str) -> None:
        await self._client.delete(
            self._summaries,
            models.PointIdsList(points=[_summary_id(document_id)]),
        )

    async def search_summaries(
        self, query: Embedded, topic_ids: list[str] | None, limit: int
    ) -> list[tuple[str, float]]:
        response = await self._client.query_points(
            self._summaries,
            query=query.dense,
            using=DENSE,
            query_filter=_topic_filter(topic_ids),
            limit=limit,
            with_payload=["document_id"],
        )
        return [
            (str((point.payload or {})["document_id"]), point.score)
            for point in response.points
        ]

    async def _scroll(self, selector: models.Filter) -> list[Passage]:
        passages: list[Passage] = []
        offset = None
        while True:
            points, offset = await self._client.scroll(
                self._passages,
                scroll_filter=selector,
                limit=SCROLL_PAGE,
                offset=offset,
                with_payload=True,
            )
            passages.extend(_passage(point.payload) for point in points)
            if offset is None:
                return passages

    async def _delete(self, selector: models.Filter) -> None:
        await self._client.delete(
            self._passages, models.FilterSelector(filter=selector)
        )


def _dense_params() -> models.VectorParams:
    return models.VectorParams(size=DENSE_SIZE, distance=models.Distance.COSINE)


def _match(key: str, value: str) -> models.FieldCondition:
    return models.FieldCondition(key=key, match=models.MatchValue(value=value))


def _topic_filter(topic_ids: list[str] | None) -> models.Filter | None:
    if not topic_ids:
        return None
    return models.Filter(
        must=[
            models.FieldCondition(key="topic_ids", match=models.MatchAny(any=topic_ids))
        ]
    )


def _sparse(vec: SparseVec) -> models.SparseVector:
    return models.SparseVector(indices=vec.indices, values=vec.values)


def _summary_id(document_id: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"summary:{document_id}"))


def _passage(payload: dict | None) -> Passage:
    values = {k: v for k, v in (payload or {}).items() if k in PASSAGE_FIELDS}
    values["topic_ids"] = tuple(values.get("topic_ids", ()))
    return Passage(**values)
