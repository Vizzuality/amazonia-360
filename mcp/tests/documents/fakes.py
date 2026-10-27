import math
import re
import zlib
from collections import Counter

from mcp_server.documents.embedding import Embedded, SparseVec

FAKE_DENSE_SIZE = 1536


def _tokens(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower())


class FakeEmbedder:
    """Deterministic bag-of-words embedder so tests need no model or network."""

    def __init__(self) -> None:
        self.calls = 0
        self.tokens = 0
        self.sparse_queries = 0

    async def embed_documents(self, texts: list[str]) -> list[Embedded]:
        self.calls += 1
        return [self._embed(text) for text in texts]

    async def embed_query(self, text: str, *, sparse: bool = True) -> Embedded:
        self.calls += 1
        embedded = self._embed(text)
        if not sparse:
            return Embedded(embedded.dense, SparseVec([], []))
        self.sparse_queries += 1
        return embedded

    def _embed(self, text: str) -> Embedded:
        counts = Counter(zlib.crc32(t.encode()) for t in _tokens(text))
        dense = [0.0] * FAKE_DENSE_SIZE
        for token_hash, count in counts.items():
            dense[token_hash % FAKE_DENSE_SIZE] += count
        norm = math.sqrt(sum(x * x for x in dense)) or 1.0
        indices = sorted(counts)
        return Embedded(
            dense=[x / norm for x in dense],
            sparse=SparseVec(indices, [float(counts[i]) for i in indices]),
        )
