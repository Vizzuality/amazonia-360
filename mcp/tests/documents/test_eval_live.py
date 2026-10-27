"""Retrieval over the loaded demo corpus (``amazonia360-docs seed`` and ``load-demo``).

Run with: uv run pytest -m live tests/documents/test_eval_live.py
"""

import os
from pathlib import Path

import pytest

from mcp_server.documents.ingest.cli import evaluate, load_questions
from mcp_server.documents.search import build_document_search
from mcp_server.documents.settings import DocsSettings
from mcp_server.places import load_places

pytestmark = [pytest.mark.live, pytest.mark.anyio]

QUESTIONS = Path(__file__).parent / "fixtures" / "questions.yaml"
# The document-search test measured 94% for text-embedding-3-small, dense.
MIN_RECALL = 0.91


async def test_the_demo_corpus_answers_the_questions_it_covers() -> None:
    settings = DocsSettings.from_env()
    if settings is None or not os.environ.get("OPENAI_API_KEY"):
        pytest.skip("needs DOCS_DATABASE_URL, DOCS_QDRANT_URL and OPENAI_API_KEY")
    search = build_document_search(settings, load_places())
    run = await evaluate(search, load_questions(QUESTIONS))
    assert run.recall() >= MIN_RECALL, run.misses()
    # No passage clears the threshold on a question the documents do not answer.
    assert set(run.unanswerable().values()) == {0}, run.unanswerable()
