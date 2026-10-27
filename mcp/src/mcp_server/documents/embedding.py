import threading
from dataclasses import dataclass
from typing import Protocol

import anyio.to_thread
from fastembed import SparseTextEmbedding
from openai import AsyncOpenAI

DENSE_MODEL = "text-embedding-3-small"
SPARSE_MODEL = "Qdrant/bm25"
BATCH_SIZE = 64


@dataclass(frozen=True)
class SparseVec:
    indices: list[int]
    values: list[float]


@dataclass(frozen=True)
class Embedded:
    dense: list[float]
    sparse: SparseVec


class Embedder(Protocol):
    tokens: int

    async def embed_documents(self, texts: list[str]) -> list[Embedded]: ...

    async def embed_query(self, text: str) -> Embedded: ...


class OpenAIEmbedder:
    def __init__(self, client: AsyncOpenAI, model: str = DENSE_MODEL) -> None:
        self._client = client
        self._model = model
        self._sparse_model: SparseTextEmbedding | None = None
        self._sparse_lock = threading.Lock()
        self.tokens = 0

    async def embed_documents(self, texts: list[str]) -> list[Embedded]:
        dense: list[list[float]] = []
        for start in range(0, len(texts), BATCH_SIZE):
            dense.extend(await self._dense(texts[start : start + BATCH_SIZE]))
        sparse = await anyio.to_thread.run_sync(self._sparse_documents, texts)
        return [Embedded(d, s) for d, s in zip(dense, sparse, strict=True)]

    async def embed_query(self, text: str) -> Embedded:
        (dense,) = await self._dense([text])
        sparse = await anyio.to_thread.run_sync(self._sparse_query, text)
        return Embedded(dense, sparse)

    async def _dense(self, batch: list[str]) -> list[list[float]]:
        response = await self._client.embeddings.create(model=self._model, input=batch)
        self.tokens += response.usage.total_tokens
        return [item.embedding for item in sorted(response.data, key=_by_index)]

    def _sparse(self) -> SparseTextEmbedding:
        # Loaded on first use, in a worker thread: loading may download the model.
        with self._sparse_lock:
            if self._sparse_model is None:
                self._sparse_model = SparseTextEmbedding(SPARSE_MODEL)
            return self._sparse_model

    def _sparse_documents(self, texts: list[str]) -> list[SparseVec]:
        return [_to_sparse_vec(e) for e in self._sparse().embed(texts)]

    def _sparse_query(self, text: str) -> SparseVec:
        return _to_sparse_vec(next(iter(self._sparse().query_embed(text))))


def _by_index(item: object) -> int:
    return item.index  # type: ignore[attr-defined]


def _to_sparse_vec(embedding: object) -> SparseVec:
    return SparseVec(
        indices=[int(i) for i in embedding.indices],  # type: ignore[attr-defined]
        values=[float(v) for v in embedding.values],  # type: ignore[attr-defined]
    )
