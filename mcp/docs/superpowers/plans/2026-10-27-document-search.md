# Document Search in the MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document search inside the `amazonia360` MCP (three tools) plus a local back office
that ingests PDFs and web reports, with reviewed figure descriptions and document summaries,
for a demo to the IDB.

**Architecture:** A new package `mcp_server.documents`. Its query side (settings, store,
index, search service, tools) is imported by the MCP and depends only on base dependencies.
Its ingestion side (`documents.ingest`, `documents.backoffice`) is ported from synthbrain and
needs the optional `ingest` extra. Postgres (schema `mcp`, local) holds the registry and the
job queue; Qdrant (local Docker) holds passages and summaries.

**Tech Stack:** Python 3.12, SQLAlchemy async + asyncpg + Alembic (already in the MCP),
qdrant-client, FastEmbed (BM25), OpenAI (`text-embedding-3-small`, `gpt-6-luna` through
`langchain-openai`), Docling, RapidOCR, Beautiful Soup + lxml, FastAPI + Jinja2 + HTMX.

**Spec:** `docs/superpowers/specs/2026-10-27-document-search-design.md`

**Source to port:** `/Volumes/Work/Dev/synthbrain/src/synthbrain` (read-only; it stays as it
is). "Port X" means: copy the module, rename device → document/corpus wording, drop YouTube
and note code paths, swap SQLite for the async store of Task 2, and keep the behaviour and
its tests.

## Global Constraints

- Branch `feat/mcp-module`; commit per task; never push elsewhere, never open a PR or merge.
- Code, UI copy, tool descriptions and docs in English. No "device", "manual", "gear",
  "synth" or "studio" anywhere in `src/mcp_server/documents/` (Task 10 adds a test).
- Ruff (`E W F C B N I UP RUF`), line length 88, Pyright standard; comments only for why.
- The base install must not import Docling, RapidOCR, bs4, lxml, FastAPI or Jinja2:
  those go in `[project.optional-dependencies] ingest`.
- The document tools register only when `DocsSettings.from_env()` returns settings; the
  existing `README` tools test must keep passing unchanged.
- Never point anything at the staging database. Local defaults: Postgres on
  `localhost:5433`, Qdrant on `localhost:6343` (6333 is taken by synthbrain's Qdrant).
- Figure describer: model `gpt-6-luna`, `max_completion_tokens=4000`, images over 2,048 px on
  the long side downsized to JPEG quality 90, the prompt of
  `discovery/deliverables/doc-search/figure_set.py` (`PROMPT`) verbatim.
- Passages: at most 300 words, a section's paragraphs kept together (synthbrain's
  `sections_to_chunks`).
- Embeddings: `text-embedding-3-small`, 1,536 dimensions, batches of 64.

## Review Focus

1. A Spanish question over English sources: BM25 must not push the right passage down
   (spec 7.3). Task 10's eval pins hybrid recall ≥ dense recall − 3 points on
   `questions.yaml`.
2. A question with no answering passage but a related document (e.g. "¿Qué dicen los
   documentos sobre la calidad del agua en Sucumbíos?"): `passages` empty or below
   threshold, `related_documents` non-empty; Task 4 tests it with fakes.
3. A document whose summary is not approved never appears in `related_documents`, and a
   figure description not approved is never a passage; Tasks 4 and 8 test both.
4. Re-uploading a document while its previous version is indexed: old passages stay
   searchable until the new ingest finishes, approvals of unchanged figures survive; Task 8.
5. Every `link` in a tool response opens: PDF links carry `#page=N`, figure links resolve to
   an existing file under the data directory, web links keep the section anchor; Task 9
   requests each kind through the back office's files route.

---

## File structure

```
src/mcp_server/documents/
  __init__.py
  settings.py        DocsSettings
  models.py          Topic, Document, Figure, Job (dataclasses), Passage
  store.py           DocumentStore (async SQLAlchemy over the tables of 0003)
  tables.py          SQLAlchemy models of the document tables
  embedding.py       Embedded, SparseVec, Embedder protocol, OpenAIEmbedder
  index.py           DocumentIndex (AsyncQdrantClient: passages + summaries)
  links.py           passage_link, figure_url, file_url
  resolve.py         resolve_topic
  search.py          DocumentSearch (list_topics, search, section) + response models
  ingest/            optional extra
    __init__.py
    sections.py      port of extract/sections.py
    pdf.py           port of extract/pdf.py
    web.py           port of extract/web.py
    ocr.py           port of figures/ocr.py
    triage.py        port of figures/triage.py
    describe.py      FigureDescriber, SummaryWriter
    pipeline.py      ingest_pdf, ingest_web, describe_figures, index_approved_figures,
                     write_summary, index_summary, delete_document
    jobs.py          Worker (claims jobs from the store)
    cli.py           amazonia360-docs: serve, seed, load-demo, eval
  backoffice/        optional extra
    app.py, views.py, templates/, static/ (htmx.min.js, app.css from synthbrain)
src/mcp_server/tools/documents.py   register_document_tools
src/mcp_server/db/migrations/versions/0003_documents.py
docker-compose.docs.yml
tests/documents/...                  one test file per module above
tests/documents/fixtures/            small PDF, small HTML page, questions.yaml copy
docs/document-search-demo.md
```

---

### Task 1: Settings, local services and dependencies

**Files:**
- Create: `src/mcp_server/documents/__init__.py`, `src/mcp_server/documents/settings.py`,
  `docker-compose.docs.yml`
- Modify: `pyproject.toml` (base deps `qdrant-client>=1.20`, `fastembed>=0.9.1`,
  `openai>=2`; extra `ingest = ["docling>=2.142.1", "rapidocr>=3.10", "beautifulsoup4>=4.15",
  "lxml>=6.1", "fastapi>=0.162", "jinja2>=3.1.6", "python-multipart>=0.0.32", "pillow"]`;
  script `amazonia360-docs = "mcp_server.documents.ingest.cli:main"`; marker
  `qdrant: needs DOCS_TEST_QDRANT_URL`)
- Test: `tests/documents/test_settings.py`

**Interfaces:**
- Produces: `DocsSettings` (frozen dataclass): `database_url: str`, `qdrant_url: str`,
  `public_url: str` (default `http://127.0.0.1:8770`), `data_dir: Path` (default
  `var/documents`), `port: int` (default 8770); `DocsSettings.from_env(env=None) ->
  DocsSettings | None` reading `DOCS_DATABASE_URL`, `DOCS_QDRANT_URL`, `DOCS_PUBLIC_URL`,
  `DOCS_DATA_DIR`, `DOCS_PORT`. Properties `uploads_dir`, `figures_dir`.

- [ ] **Step 1: Write the failing tests**

```python
def test_without_database_or_qdrant_there_are_no_settings() -> None:
    assert DocsSettings.from_env({}) is None
    assert DocsSettings.from_env({"DOCS_DATABASE_URL": "postgresql://x/y"}) is None

def test_defaults() -> None:
    s = DocsSettings.from_env(
        {"DOCS_DATABASE_URL": "postgresql://x/y", "DOCS_QDRANT_URL": "http://q:6343"}
    )
    assert s is not None
    assert s.public_url == "http://127.0.0.1:8770"
    assert s.figures_dir == Path("var/documents/figures")

def test_public_url_loses_its_trailing_slash() -> None: ...
```

- [ ] **Step 2: Run** `uv run pytest tests/documents/test_settings.py -v` → FAIL (module missing)
- [ ] **Step 3: Implement `DocsSettings`**; write `docker-compose.docs.yml` with
  `postgres:17` (db `amazonia360_docs`, port `5433:5432`, an init script that runs
  `CREATE SCHEMA mcp` and creates `amazonia360_docs_test` too) and `qdrant/qdrant`
  (`6343:6333`), named volumes, `restart: unless-stopped`.
- [ ] **Step 4: Run** the tests → PASS; `uv sync --extra ingest` succeeds;
  `docker compose -f docker-compose.docs.yml up -d` and both ports answer.
- [ ] **Step 5: Commit** `feat(mcp): document search settings and local services (AM-762)`

### Task 2: Tables and the document store

**Files:**
- Create: `src/mcp_server/db/migrations/versions/0003_documents.py`,
  `src/mcp_server/documents/tables.py`, `src/mcp_server/documents/models.py`,
  `src/mcp_server/documents/store.py`
- Modify: `tests/conftest.py` (`TABLES` gains the five new tables)
- Test: `tests/documents/test_store.py` (marker `db`)

**Interfaces:**
- Produces (`models.py`, dataclasses):
  - `Topic(id: str, name: str, aliases: tuple[str, ...], place_id: str | None)`
  - `Document(id: str, type: Literal["pdf", "web"], title: str, origin: str,
    authors_year: str, status: str, error_message: str, chunk_count: int,
    figure_count: int, summary: str, summary_status: Literal["none", "pending_review",
    "approved"], topic_ids: tuple[str, ...])`
  - `Figure` as synthbrain's `models.Figure` with `document_id` for `device_id`/`source_id`
  - `Job(id: int, kind: str, document_id: str, payload: dict, status: str,
    progress: int, total: int, error_message: str)`
  - `JOB_KINDS = ("ingest_pdf", "ingest_web", "describe_figures", "index_figures",
    "write_summary", "index_summary", "delete_document")`
- Produces (`store.py`): `DocumentStore(sessions: async_sessionmaker[AsyncSession])` with
  async methods: `upsert_topic(Topic)`, `delete_topic(id)`, `list_topics() ->
  list[Topic]`, `get_topic(id)`, `upsert_document(Document)`, `get_document(id)`,
  `list_documents(topic_id: str | None = None) -> list[Document]`,
  `set_document_topics(id, topic_ids)`, `set_status(id, status, error="")`,
  `set_counts(id, chunks, figures)`, `set_summary(id, text, status)`,
  `delete_document(id)`, `replace_figures(document_id, figures)` (keeps
  `final_description` and `review_status` of figures whose `image_hash` is unchanged),
  `list_figures(document_id)`, `get_figure(document_id, figure_id)`,
  `set_generated(document_id, figure_id, text)`, `set_ocr(...)`,
  `review(document_id, figure_id, description, status)`, `approved_figures(document_id)`,
  `enqueue(kind, document_id, payload=None) -> Job`, `claim_next() -> Job | None`
  (`SELECT … FOR UPDATE SKIP LOCKED`), `set_progress`, `finish`, `fail`,
  `active_jobs(document_id=None)`, `recover_interrupted() -> int`.

- [ ] **Step 1: Write the failing tests** (port the intent of synthbrain's
  `test_registry.py`, `test_figure_store.py`, `test_jobs.py`), including:

```python
async def test_replacing_figures_keeps_approvals_of_unchanged_images(store) -> None:
    await store.replace_figures("d1", [fig("f1", hash_="a")])
    await store.review("d1", "f1", "Map of Yasuní", "approved")
    await store.replace_figures("d1", [fig("f1b", hash_="a"), fig("f2", hash_="b")])
    figures = {f.image_hash: f for f in await store.list_figures("d1")}
    assert figures["a"].review_status == "approved"
    assert figures["a"].final_description == "Map of Yasuní"
    assert figures["b"].review_status == "pending_review"

async def test_two_workers_never_claim_the_same_job(store) -> None: ...
async def test_a_running_job_is_failed_with_the_interrupted_message_on_recovery(store): ...
async def test_deleting_a_topic_removes_it_from_documents(store) -> None: ...
```

- [ ] **Step 2: Run** `uv run pytest tests/documents/test_store.py -v -m db` (with
  `MCP_TEST_DATABASE_URL=postgresql://postgres@localhost:5433/amazonia360_docs_test`) → FAIL
- [ ] **Step 3: Implement** the migration (schema `mcp`; `topics.aliases` and
  `documents` arrays as `ARRAY(Text)`; `document_topics` with FKs `ON DELETE CASCADE`;
  `jobs.payload` JSONB), the tables and the store.
- [ ] **Step 4: Run** → PASS; `uv run pytest` (the rest of the suite) still passes.
- [ ] **Step 5: Commit** `feat(mcp): document store and its tables (AM-762)`

### Task 3: Embedder and the Qdrant index

**Files:**
- Create: `src/mcp_server/documents/embedding.py`, `src/mcp_server/documents/index.py`
- Test: `tests/documents/test_embedding.py`, `tests/documents/test_index.py`

**Interfaces:**
- Produces: `SparseVec(indices: list[int], values: list[float])`,
  `Embedded(dense: list[float], sparse: SparseVec)`, `Embedder` protocol with async
  `embed_documents(texts: list[str]) -> list[Embedded]` and
  `embed_query(text: str) -> Embedded`; `OpenAIEmbedder(client: AsyncOpenAI,
  model="text-embedding-3-small")` (BM25 via `fastembed.SparseTextEmbedding("Qdrant/bm25")`,
  run in a thread); attribute `tokens: int` (running total).
- Produces: `Passage` (in `models.py`): synthbrain's `Chunk` with `document_id`,
  `topic_ids: tuple[str, ...]`, no `device_id`/`start_s`/`end_s`.
  `DocumentIndex(client: AsyncQdrantClient, embedder: Embedder, passages="documents",
  summaries="document_summaries")` with async `ensure_collections()`,
  `upsert(passages)`, `delete_document(document_id, keep_ingest_id=None)`,
  `delete_origin(document_id, origin)`, `set_topics(document_id, topic_ids)`,
  `search(query: Embedded, topic_ids: list[str] | None, limit: int,
  sparse_weight: float) -> list[tuple[Passage, float]]`,
  `section(document_id, section_path) -> list[Passage]`,
  `list_document(document_id) -> list[Passage]`,
  `upsert_summary(document: Document, summary_embedding: list[float], link: str)`,
  `delete_summary(document_id)`, `search_summaries(query: Embedded,
  topic_ids: list[str] | None, limit: int) -> list[tuple[str, float]]`
  (document ids with scores).

- [ ] **Step 1: Write the failing tests** with `AsyncQdrantClient(":memory:")` and a
  `FakeEmbedder` in `tests/documents/fakes.py` (deterministic vectors from word hashes,
  port of synthbrain's `tests/fakes.py`):

```python
async def test_topic_filter_returns_only_passages_of_that_topic(index) -> None: ...
async def test_a_new_ingest_replaces_the_old_only_when_asked(index) -> None:
    await index.upsert([passage("d1", ingest="old")])
    await index.upsert([passage("d1", ingest="new")])
    await index.delete_document("d1", keep_ingest_id="new")
    assert {p.ingest_id for p in await index.list_document("d1")} == {"new"}
async def test_sparse_weight_zero_is_dense_only(index) -> None: ...
async def test_set_topics_rewrites_payload_without_reembedding(index, embedder) -> None:
    calls = embedder.calls
    await index.set_topics("d1", ["mining"])
    assert embedder.calls == calls
```

  `test_embedding.py`: `OpenAIEmbedder` against an `httpx.MockTransport` OpenAI client:
  batches of 64, `tokens` adds up `usage.total_tokens`.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement.** Hybrid query: port `QdrantIndex.search`; with
  `sparse_weight == 0` query `dense` only; otherwise prefetch both and fuse with
  `models.FusionQuery(fusion=models.Fusion.RRF)`, then the BM25 list limited to
  `round(limit * sparse_weight)` in the prefetch. *(Exact weighting is tuned in Task 10.)*
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `feat(mcp): embeddings and Qdrant index for documents (AM-762)`

### Task 4: Search service with related documents

**Files:**
- Create: `src/mcp_server/documents/resolve.py`, `src/mcp_server/documents/links.py`,
  `src/mcp_server/documents/search.py`
- Test: `tests/documents/test_resolve.py`, `tests/documents/test_links.py`,
  `tests/documents/test_search.py`

**Interfaces:**
- Consumes: `DocumentStore`, `DocumentIndex`, `Embedder`, `DocsSettings`,
  `mcp_server.places.normalise`.
- Produces: `resolve_topic(name: str, topics: list[Topic]) -> TopicResolution`
  (`topic: Topic | None`, `candidates: list[Topic]`): exact id, then normalised name or
  alias, then unique prefix; several matches → candidates. *(No rapidfuzz: it is not on
  the Tech Radar.)*
- Produces: `passage_link(p: Passage, doc: Document, settings) -> str | None`,
  `file_url(path: str, settings) -> str | None` (port of synthbrain `links.py`: figure →
  `{public_url}/files/figures/<name>`; pdf → `{public_url}/files/uploads/<name>#page=N`;
  web → `origin#anchor`).
- Produces (`search.py`, pydantic output models): `TopicOut`, `DocumentOut`,
  `TopicList(topics, documents)`, `PassageOut(document_id, title, authors_year,
  section, page, origin, text, link)`, `RelatedDocument(document_id, title,
  authors_year, summary, topics, link, matched_by: Literal["summary", "topic"])`,
  `SearchResult(passages, related_documents, topic: str | None, candidates:
  list[TopicOut], note: str | None)`, `Section(document_id, title, section, text, link)`.
  `DocumentSearch(store, index, embedder, settings, places: Places)` with async
  `list_topics() -> TopicList`, `search(query, topic=None, place_id=None, limit=8)
  -> SearchResult`, `section(document_id, section_path) -> Section`.
  Constants `PASSAGE_MIN_SCORE`, `SUMMARY_MIN_SCORE`, `SPARSE_WEIGHT` (values from Task 10;
  start at `0.0`, `0.0`, `0.0`).

- [ ] **Step 1: Write the failing tests**:

```python
async def test_unapproved_summary_is_never_related(search, store) -> None: ...
async def test_related_documents_come_back_when_no_passage_answers(search) -> None:
    result = await search.search("calidad del agua en Sucumbíos")
    assert result.passages == []
    assert [d.document_id for d in result.related_documents] == ["finer-2008"]
async def test_a_document_with_a_passage_is_not_also_listed_as_related(search): ...
async def test_place_without_topic_searches_everything_and_says_so(search) -> None:
    result = await search.search("deforestation", place_id="canton:Tena")
    assert result.note == "No topic is tied to this place; searched every document."
async def test_ambiguous_topic_returns_candidates_and_no_results(search) -> None: ...
async def test_place_tied_topic_matches_documents_by_topic(search) -> None:
    # Yasuní topic tied to protected_area:Yasuní: matched_by == "topic"
```

- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement.** `search`: embed once; passages from `index.search`
  filtered by score; related from `index.search_summaries` above `SUMMARY_MIN_SCORE`
  plus documents carrying the resolved topic (or the topics tied to `place_id`),
  approved summaries only, minus documents already in `passages`; `limit` capped at 20.
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `feat(mcp): document search with related documents (AM-762)`

### Task 5: MCP tools and instructions

**Files:**
- Create: `src/mcp_server/tools/documents.py`
- Modify: `src/mcp_server/server.py` (`create_mcp_server(..., documents:
  DocumentSearch | None = None)`; when `None`, build one from `DocsSettings.from_env()` or
  skip; append `DOCUMENT_INSTRUCTIONS` to `INSTRUCTIONS` only when registered),
  `README.md` (new `## Document tools` section after `## Tools`, plus a `## Document
  search` section with setup: compose, `amazonia360-mcp-db` migrate against
  `DOCS_DATABASE_URL`, `amazonia360-docs serve`, Claude Desktop env vars)
- Test: `tests/documents/test_tools.py`

**Interfaces:**
- Consumes: `DocumentSearch`, `CallLog`, `log_lookup` from `tools/area.py`.
- Produces: `register_document_tools(server, documents: DocumentSearch, call_log)`
  registering `list_topics`, `search_documents(query, topic=None, place_id=None,
  limit=8)`, `get_document_section(document_id, section_path)`, read-only annotations,
  output models from Task 4.

`DOCUMENT_INSTRUCTIONS` (exact copy, appended after a blank line):

```
Documents: papers and reports indexed for the module. On every question about a place
or theme of the module, call search_documents alongside the data tools, not only when
the user mentions documents. Search the whole corpus; pass topic only when the user asks
about one topic or the results drift to other places.
Answer about documents only from passages. When related_documents has entries but no
passage answers the question, name those documents with their link and say they cover
the subject but do not answer the question; never answer from a summary as if it were a
passage. When both lists are empty, say the indexed documents do not cover it.
State a figure from a document with its document and year, and a figure from an
indicator with the indicator; never combine, total or compare them as the same measure.
Quote the sentence that states a number. Give the link of every passage used, and say
when a passage is a figure description (origin "figure").
```

- [ ] **Step 1: Write the failing tests**: a server built with a fake `DocumentSearch`
  lists the three tools and its instructions contain "call search_documents"; a server
  built without one has neither (and `test_readme.py` passes unchanged); the README's
  `## Document tools` table equals the three names; `search_documents` returns the
  structured `SearchResult`; a search error comes back as a tool error, never as empty
  results.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement**; `__main__.main` needs no change (the server builds the
  service from env).
- [ ] **Step 4: Run** `uv run pytest` → all PASS
- [ ] **Step 5: Commit** `feat(mcp): document tools in the MCP server (AM-762)`

### Task 6: Extraction port

**Files:**
- Create: `src/mcp_server/documents/ingest/{__init__,sections,pdf,web,ocr,triage}.py`
  (ports of synthbrain `extract/sections.py`, `extract/pdf.py`, `extract/web.py`,
  `figures/ocr.py`, `figures/triage.py`)
- Test: `tests/documents/ingest/test_{sections,pdf,web,ocr,triage}.py` (ports), fixtures
  in `tests/documents/fixtures/` (a 2-page PDF with one figure, an HTML page with two
  sections and an image)

**Interfaces:**
- Produces: `extract_pdf(path: Path, figures_dir: Path) -> ExtractedPdf`,
  `fetch_page(url) -> Page`, `parse_sections(html) -> tuple[str, list[Section]]`,
  `page_images(html, base_url) -> list[PageImage]`, `fetch_image(...)`,
  `sections_to_chunks(sections, title, document_id, document_type, ingest_id) ->
  list[Passage]`, `FigureOcr().read(path) -> str`, `bucket(figure) -> str`, `BUCKETS`.
  Same signatures as synthbrain minus `device_id`.

- [ ] **Step 1: Port the tests** (drop the synth-manual fixtures; keep tall-page tiling,
  public-host image rule, triage buckets). Mark Docling/OCR tests `slow` if they load
  models, as synthbrain does; add marker `slow` to `pyproject.toml`.
- [ ] **Step 2: Run** `uv run --extra ingest pytest tests/documents/ingest -v` → FAIL
- [ ] **Step 3: Port the modules.** Replace synthbrain's stop-word list in `triage.py` with
  generic map/chart words (legend, map, figure, shows, area, km, ha, north, south…);
  the synth-specific ones (knob, led, button) go.
- [ ] **Step 4: Run** (including `-m slow` once) → PASS
- [ ] **Step 5: Commit** `feat(mcp): PDF and web extraction for documents (AM-762)`

### Task 7: Figure descriptions and document summaries

**Files:**
- Create: `src/mcp_server/documents/ingest/describe.py`
- Test: `tests/documents/ingest/test_describe.py`

**Interfaces:**
- Produces: `FigureDescriber(model: BaseChatModel)` with
  `async describe(figure: Figure, document: Document) -> str` (prompt = `figure_set.PROMPT`
  with `title=f"{document.authors_year}, {document.title}"`, section, context, OCR text;
  image as base64 data URL, downsized per Global Constraints; reply `DECORATIVE` →
  stored as generated description `DECORATIVE`, triaged as discard candidate).
  `SummaryWriter(model)` with `async write(document: Document, headings: list[str],
  opening: str, captions: list[str]) -> str`. `default_model() -> ChatOpenAI(model=
  "gpt-6-luna", max_completion_tokens=4000)`.

Summary prompt (exact copy):

```
This is the start of {title}.
Section headings: {headings}
Opening text: {opening}
Figure captions: {captions}

Write a summary of 80 to 150 words for someone deciding whether this document is
relevant to a question: what it is about, the places it covers, the period, and what it
measures or reports. Only state what the text above says. Plain prose, no lists.
```

- [ ] **Step 1: Write the failing tests** with `langchain_core`'s
  `GenericFakeChatModel`: the prompt carries the authors-year title and OCR text; a
  3,000 px image reaches the model at 2,048 px; an empty reply raises
  `DescriptionError("empty description")` (the 700-token failure must not pass silently).
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `feat(mcp): figure descriptions and summaries with GPT-6 Luna (AM-762)`

### Task 8: Ingest pipeline and worker

**Files:**
- Create: `src/mcp_server/documents/ingest/pipeline.py`,
  `src/mcp_server/documents/ingest/jobs.py`
- Test: `tests/documents/ingest/test_pipeline.py`, `tests/documents/ingest/test_jobs.py`

**Interfaces:**
- Consumes: Tasks 2, 3, 6, 7.
- Produces: `Pipeline(store, index, embedder, describer, summary_writer, settings)` with
  async `run(job: Job, progress: Callable[[int, int], Awaitable[None]]) -> None`
  dispatching on `job.kind`: `ingest_pdf` / `ingest_web` (extract in a thread, upsert
  passages under a new `ingest_id`, delete the old ingest, replace figures, enqueue
  `describe_figures` and `write_summary`); `describe_figures` (OCR then describe each
  figure without a generated description); `index_figures` (approved figures →
  passages with `origin="figure"`, after `delete_origin(…, "figure")`); `write_summary`;
  `index_summary` (approved summary → `upsert_summary`); `delete_document`.
  `Worker(store, pipeline)` with `async run_forever(stop: anyio.Event)` and
  `async run_once() -> bool`; `recover_interrupted()` at start.
  Port of synthbrain `ingest.py`, `pipeline.py`, `jobs.py`.

- [ ] **Step 1: Write the failing tests** (fakes for extraction, describer, embedder;
  in-memory Qdrant; `db` marker):

```python
async def test_old_passages_stay_searchable_until_the_new_ingest_finishes(...)
async def test_a_failed_ingest_keeps_the_previous_version(...)
async def test_figures_are_searchable_only_after_approval_and_index_figures(...)
async def test_summary_is_related_only_after_approval_and_index_summary(...)
async def test_topic_change_updates_passages_and_summary_payloads(...)
async def test_interrupted_job_is_failed_with_a_rerun_message(...)
```

- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `feat(mcp): document ingest pipeline and worker (AM-762)`

### Task 9: Back office

**Files:**
- Create: `src/mcp_server/documents/backoffice/{__init__,app,views}.py`,
  `templates/` (ports of synthbrain's `base`, `_sidebar`, `device`→`documents`,
  `source`→`document`, `figures`, `_figure_card`, `_ask_results`, `_notice`,
  `_source_rows`→`_document_rows`, `_rename_form`; new `topics.html`, `_topic_form.html`,
  `_summary_card.html`), `static/` (copy `htmx.min.js`, `app.css`)
- Modify: `src/mcp_server/documents/ingest/cli.py` (`serve`: FastAPI app + worker in one
  process on `DOCS_PORT`, bound to `127.0.0.1`)
- Test: `tests/documents/backoffice/test_*.py` (ports of synthbrain's
  `test_backoffice_*.py` and `backoffice_env.py`)

**Interfaces:**
- Consumes: Tasks 2–8.
- Produces: `create_backoffice(settings, store, index, search, pipeline) -> FastAPI`
  with routes: `GET /` (all documents), `GET /topics`, `POST /topics`,
  `POST /topics/{id}`, `POST /topics/{id}/delete`, `POST /documents/pdf` (upload, title,
  authors_year, topic_ids), `POST /documents/web` (URL…), `GET /documents/{id}`,
  `POST /documents/{id}` (title, authors_year, topics), `POST /documents/{id}/rerun`,
  `POST /documents/{id}/delete`, `POST /documents/{id}/summary` (text, approve),
  `GET /documents/{id}/figures`, `POST /documents/{id}/figures/bulk`,
  `POST /documents/{id}/figures/{figure_id}`, `POST /ask` (renders exactly
  `DocumentSearch.search`), `GET /files/{kind}/{name}` (`kind` in `uploads`, `figures`;
  no path traversal), `GET /document-rows` (HTMX polling).
  `place_id` on a topic is validated with `Places.get`; unknown → form error.

- [ ] **Step 1: Write the failing tests**, including the Review Focus link check:
  each link kind returned by `/ask` for a seeded document returns 200 from the app
  (`/files/uploads/x.pdf` for a PDF link without the fragment, `/files/figures/f.png`),
  `GET /files/uploads/../settings.py` → 404, a topic with an unknown `place_id` → 422 with
  the message, and the rendered HTML of every page contains none of the words of the
  Global Constraints ban list.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Port and implement.** Layout as synthbrain (left sidebar with topics and
  "All documents", detail panel on the right).
- [ ] **Step 4: Run** → PASS; `uv run --extra ingest amazonia360-docs serve` opens on
  `http://127.0.0.1:8770` and a PDF upload reaches `indexed`.
- [ ] **Step 5: Commit** `feat(mcp): back office for document search (AM-762)`

### Task 10: Demo corpus, eval and demo script

**Files:**
- Modify: `src/mcp_server/documents/ingest/cli.py` (`seed` topics of the spec,
  `load-demo <dir>` uploads the four PDFs and two MAAP URLs with the titles of
  `figure_set.TITLES`, their authors-year and topics; `eval <questions.yaml>` prints
  recall@8 dense / hybrid / by language using `DocumentSearch.search`)
- Modify: `src/mcp_server/documents/search.py` (the three constants, from the eval)
- Create: `tests/documents/fixtures/questions.yaml` (copy of
  `discovery/deliverables/doc-search/questions.yaml`, `device_id` lines removed),
  `tests/documents/test_wording.py`, `docs/document-search-demo.md`
- Test: `tests/documents/test_eval_live.py` (marker `live`: needs the loaded corpus and
  `OPENAI_API_KEY`)

Demo topics and assignments:

| Document | Topics |
|---|---|
| Finer et al. (2008) | oil and gas, deforestation |
| Bass et al. (2010) | Yasuní, biodiversity, protected areas |
| García-Romero et al. (2026) | oil and gas, deforestation |
| Paredes et al. (2026) | REDD+, forest fragmentation, deforestation |
| MAAP #82 | Yasuní, oil and gas, deforestation |
| MAAP #221 | illegal mining, protected areas |

Topic `yasuni` ties to the module's Yasuní protected area id (look it up with
`Places.find("Yasuní", "protected_area")`).

- [ ] **Step 1: Write `test_wording.py`**: no file under `src/mcp_server/documents/`
  matches `\b(device|manual|gear|synth\w*|studio)\b` (case-insensitive). Run → FAIL until
  leftovers are gone, then PASS.
- [ ] **Step 2: Load the corpus** (`seed`, `load-demo`), review figures and summaries in
  the back office (approve GPT-6 Luna's output where right, fix one, discard the logo).
- [ ] **Step 3: Run the eval** and set `SPARSE_WEIGHT`, `PASSAGE_MIN_SCORE`,
  `SUMMARY_MIN_SCORE`. Pass: hybrid recall@8 ≥ 91% overall (the test measured 94% for
  3-small dense) and ≥ dense − 3 points; the 4 unanswerable questions return no passage
  above `PASSAGE_MIN_SCORE`. Record the numbers in the commit message.
- [ ] **Step 4: Write `docs/document-search-demo.md`**: setup, then five questions with
  what each must show: (1) Yasuní deforestation, layers + MAAP #82 passage with link;
  (2) number of oil blocks in the western Amazon, Finer passage; (3) a figure-only
  answer from an approved description, said to be a figure; (4) water quality in
  Sucumbíos, related documents but no answer; (5) mercury in Podocarpus, not covered.
  Plus the live upload of MAAP #221 and one figure review.
- [ ] **Step 5: Run the demo once** in Claude Desktop over stdio and note the result of
  each question in the demo doc.
- [ ] **Step 6: Commit** `feat(mcp): demo corpus, eval and demo script for document search (AM-762)`
