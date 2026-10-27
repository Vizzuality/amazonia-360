from pathlib import Path

import pytest

from mcp_server.documents.ingest import cli
from mcp_server.documents.ingest.cli import Question, evaluate, is_hit, load_questions
from mcp_server.documents.search import PassageOut, SearchResult
from mcp_server.documents.settings import DocsSettings
from mcp_server.documents.store import DocumentStore

ENV = {
    "DOCS_DATABASE_URL": "postgresql://postgres:postgres@localhost:5433/docs",
    "DOCS_QDRANT_URL": "http://localhost:6343",
}


@pytest.fixture
def docs_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name, value in ENV.items():
        monkeypatch.setenv(name, value)


def test_migrate_upgrades_the_documents_database(
    docs_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    upgraded: list[str] = []
    monkeypatch.setattr(cli, "upgrade", upgraded.append)
    cli.main(["migrate"])
    assert upgraded == [ENV["DOCS_DATABASE_URL"]]


def test_without_document_settings_it_says_what_to_set(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("DOCS_DATABASE_URL", raising=False)
    monkeypatch.delenv("DOCS_QDRANT_URL", raising=False)
    with pytest.raises(SystemExit) as stopped:
        cli.main(["migrate"])
    assert "DOCS_DATABASE_URL" in str(stopped.value)


def test_serve_needs_an_openai_key(
    docs_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(SystemExit) as stopped:
        cli.main(["serve"])
    assert "OPENAI_API_KEY" in str(stopped.value)


def test_serve_binds_to_loopback_on_the_configured_port(
    docs_env: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    pytest.importorskip("fastapi")
    import uvicorn

    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("DOCS_PORT", "8899")
    monkeypatch.setenv("DOCS_DATA_DIR", str(tmp_path))
    ran: dict[str, object] = {}

    def fake_run(app: object, host: str, port: int, **kwargs: object) -> None:
        ran.update(app=app, host=host, port=port)

    monkeypatch.setattr(uvicorn, "run", fake_run)
    cli.main(["serve"])
    assert (ran["host"], ran["port"]) == ("127.0.0.1", 8899)


def test_a_second_serve_refuses_to_start(
    docs_env: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("DOCS_DATA_DIR", str(tmp_path))
    held = cli.single_instance(tmp_path / cli.LOCK_FILE)
    assert held is not None
    try:
        with pytest.raises(SystemExit) as stopped:
            cli.main(["serve"])
        assert "already running" in str(stopped.value)
    finally:
        held.close()


QUESTIONS = Path(__file__).parents[1] / "fixtures" / "questions.yaml"


def _question(qid: str, lang: str = "es", snippets: tuple[str, ...] = ()) -> Question:
    return Question(
        id=qid,
        question=f"question {qid}",
        lang=lang,
        answerable=bool(snippets),
        origin="text" if snippets else None,
        expected_answer="",
        expected_snippets=list(snippets),
    )


def _passage(text: str) -> PassageOut:
    return PassageOut(
        document_id="d",
        title="T",
        authors_year="A",
        section="S",
        origin="text",
        text=text,
    )


class ScriptedSearch:
    """Returns the passages scripted for each question text."""

    def __init__(self, passages: dict[str, list[str]]) -> None:
        self._passages = passages

    async def search(self, query: str, limit: int = 8) -> SearchResult:
        texts = self._passages.get(query, [])[:limit]
        return SearchResult(passages=[_passage(t) for t in texts], related_documents=[])


def test_the_demo_questions_load() -> None:
    # A key Question does not have, such as device_id, would fail the load.
    questions = load_questions(QUESTIONS)
    assert len(questions) == 37
    assert sum(not q.answerable for q in questions) == 4


def test_a_hit_ignores_case_and_spacing() -> None:
    assert is_hit("About 180 Oil and\n gas  blocks cover", ["180 oil and gas blocks"])
    assert not is_hit("About 180 oil blocks", ["180 oil and gas blocks"])


@pytest.mark.anyio
async def test_eval_ranks_the_first_passage_with_a_snippet() -> None:
    questions = [
        _question("second", "es", ("180 blocks",)),
        _question("missed", "es", ("Tagaeri",)),
        _question("first", "en", ("7,580",)),
        _question("none", "es"),
    ]
    search = ScriptedSearch(
        {
            "question second": ["roads", "There are 180 BLOCKS."],
            "question missed": ["roads"],
            "question first": ["It covers 7,580 km²."],
            "question none": ["roads", "rivers"],
        }
    )
    run = await evaluate(search, questions)  # type: ignore[arg-type]
    assert [o.rank for o in run.outcomes] == [2, None, 1, None]
    assert run.recall() == pytest.approx(2 / 3)
    assert run.recall("es") == 0.5
    assert run.recall("en") == 1.0
    assert run.misses() == ["missed"]
    assert run.unanswerable() == {"none": 2}


@pytest.mark.db
@pytest.mark.anyio
async def test_seed_ties_yasuni_to_its_protected_area(
    clean_docs_database: str, store: DocumentStore
) -> None:
    settings = DocsSettings(clean_docs_database, "http://localhost:6343")
    await cli.seed(settings)
    await cli.seed(settings)
    topics = {t.id: t for t in await store.list_topics()}
    assert set(topics) == {t.id for t in cli.DEMO_TOPICS}
    assert topics["yasuni"].place_id == "protected_area:Yasuní"
    assert all(t.place_id is None for i, t in topics.items() if i != "yasuni")


def test_every_demo_source_uses_a_demo_topic() -> None:
    topics = {t.id for t in cli.DEMO_TOPICS}
    assert all(set(s.topics) <= topics for s in cli.DEMO_SOURCES)
    assert sum(s.url is None for s in cli.DEMO_SOURCES) == 4


@pytest.mark.db
@pytest.mark.anyio
async def test_a_demo_source_is_added_once_and_queued_again_after_an_error(
    store: DocumentStore, tmp_path: Path
) -> None:
    settings = DocsSettings("postgresql://unused", "http://unused", data_dir=tmp_path)
    for topic in cli.DEMO_TOPICS:
        await store.upsert_topic(topic)
    source = cli.DEMO_SOURCES[0]
    pdf = tmp_path / "source.pdf"
    pdf.write_bytes(b"%PDF-1.7 demo")

    await cli.add_source(store, settings, source, pdf)
    doc = await store.get_document(source.id)
    assert doc is not None
    assert (doc.type, doc.authors_year, doc.title) == (
        "pdf",
        "Finer et al. (2008)",
        "Oil and Gas Projects in the Western Amazon, PLOS ONE",
    )
    (job,) = await store.active_jobs(source.id)
    assert job.kind == "ingest_pdf"
    assert Path(job.payload["path"]).read_bytes() == pdf.read_bytes()

    await store.finish(job.id)
    await store.set_status(source.id, "indexed")
    await cli.add_source(store, settings, source, pdf)
    assert await store.active_jobs(source.id) == []

    await store.set_status(source.id, "error", "boom")
    await cli.add_source(store, settings, source, pdf)
    assert [j.kind for j in await store.active_jobs(source.id)] == ["ingest_pdf"]


@pytest.mark.db
@pytest.mark.anyio
async def test_a_web_source_is_queued_with_its_url(
    store: DocumentStore, tmp_path: Path
) -> None:
    settings = DocsSettings("postgresql://unused", "http://unused", data_dir=tmp_path)
    for topic in cli.DEMO_TOPICS:
        await store.upsert_topic(topic)
    source = next(s for s in cli.DEMO_SOURCES if s.url)
    await cli.add_source(store, settings, source, None)
    doc = await store.get_document(source.id)
    assert doc is not None and (doc.type, doc.origin) == ("web", source.url)
    assert [j.kind for j in await store.active_jobs(source.id)] == ["ingest_web"]
