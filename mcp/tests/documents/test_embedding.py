import json

import httpx
import pytest
from openai import AsyncOpenAI

from mcp_server.documents import embedding
from mcp_server.documents.embedding import BATCH_SIZE, OpenAIEmbedder

pytestmark = pytest.mark.anyio


def client_with(batches: list[int]) -> AsyncOpenAI:
    def handle(request: httpx.Request) -> httpx.Response:
        inputs = json.loads(request.content)["input"]
        batches.append(len(inputs))
        data = [
            {"object": "embedding", "index": i, "embedding": [float(i), 0.0]}
            for i in reversed(range(len(inputs)))
        ]
        usage = {"prompt_tokens": len(inputs), "total_tokens": len(inputs) * 2}
        return httpx.Response(
            200,
            json={
                "object": "list",
                "model": "text-embedding-3-small",
                "data": data,
                "usage": usage,
            },
        )

    return AsyncOpenAI(
        api_key="test",
        base_url="http://openai.test/v1",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handle)),  # type: ignore[arg-type],
    )


async def test_documents_go_in_batches_of_64_and_tokens_add_up() -> None:
    batches: list[int] = []
    embedder = OpenAIEmbedder(client_with(batches))
    texts = [f"forest word{i}" for i in range(BATCH_SIZE + 6)]
    result = await embedder.embed_documents(texts)
    assert batches == [64, 6]
    assert len(result) == 70
    assert embedder.tokens == 140
    assert [e.dense[0] for e in result[:3]] == [0.0, 1.0, 2.0]
    assert all(e.sparse.indices for e in result)


async def test_query_embedding_counts_tokens() -> None:
    batches: list[int] = []
    embedder = OpenAIEmbedder(client_with(batches))
    result = await embedder.embed_query("deforestation")
    assert batches == [1]
    assert embedder.tokens == 2
    assert result.sparse.indices


async def test_a_dense_only_query_never_loads_the_bm25_model(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def no_bm25(*args: object, **kwargs: object) -> None:
        raise AssertionError("BM25 model loaded")

    monkeypatch.setattr(embedding, "SparseTextEmbedding", no_bm25)
    embedder = OpenAIEmbedder(client_with([]))
    result = await embedder.embed_query("deforestation", sparse=False)
    assert result.dense == [0.0, 0.0]
    assert result.sparse.indices == []
