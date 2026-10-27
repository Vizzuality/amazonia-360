# Document search in the Amazonia 360 MCP — Design

Date: 2026-10-27
Status: draft, pending approval
Jira: AM-762 (item 13 of the AI PoC, optional: internal documents queryable with attribution)

## 1. Intent

A demo for the IDB team of the full cycle of document search inside the Amazonia 360 MCP:
someone uploads a document in a back office, the pipeline splits it into passages and
describes its figures, a person approves the descriptions, and in Claude a question about a
place in the Ecuador module is answered with the MCP's layer figures and the passage of a
paper or report that backs them, linked to the page or figure it comes from.

Both halves have to convince: the combined answer with its citation, and that the IDB could
put its own documents through the same pipeline.

It also extends `discovery/deliverables/ai-poc-document-search.md`, which measured search and
figure reading but lists "the answer itself" as not measured. Afterwards the owner will decide
whether it moves to staging with third-party embedding APIs; this design keeps that move small.

The pipeline and back office already exist in synthbrain (`/Volumes/Work/Dev/synthbrain`, a
private project of the owner about studio gear). This work rebuilds them here, adapted:
no wording about synths or devices anywhere, all in English.

## 2. Goals

1. Ingest PDFs and public web reports into a searchable index, with figure descriptions that a
   person approves before they become searchable (synthbrain's review flow).
2. Document tools in the existing `amazonia360` MCP server, so one connector answers with
   both layer data and documents.
3. Every passage returned carries a link to its PDF page, figure crop or web section, and the
   link opens.
4. Topics: a curated list (name + other names, optionally tied to a `place_id` of the
   module) assigned to documents, usable as a search filter.
5. The demo corpus is the six sources of the document-search test
   (`discovery/deliverables/doc-search/sources/` and the two MAAP URLs), with topics assigned.
6. The query path is the one staging would run: embeddings and figure descriptions through
   APIs, no local model in the MCP process.

## 3. Non-goals

- Deploying to staging. Decided after the demo.
- YouTube, Whisper and manual notes (synthbrain source types with no use here).
- Local models (MLX vision models, sentence-transformers). BGE-M3 stays a documented option
  behind the embedder interface, not built.
- Authentication on the back office. It runs on the owner's machine.
- Keeping document versions. A new upload of the same document replaces the old one, as in
  synthbrain.
- A chat UI in the back office.

## 4. Anti-goals

The same practices as the rest of the MCP, held by server instructions and tests:

- Figures from a document combined with, or compared as equal to, figures from an MCP
  indicator. They come from different years and methods; the answer states each with its
  source.
- An answer about documents that does not come from a returned passage.
- A citation link that does not open, or opens the wrong page.
- A near passage stretched to answer a question the documents do not cover.
- Any leftover synthbrain wording (device, manual, gear, studio) in UI, tool descriptions or
  instructions.

## 5. Constraints

- Lives in `mcp/` on branch `feat/mcp-module`. Push only there; no PR or merge.
- Python 3.12, `uv`, Black + Ruff, the repo's naming and comment conventions.
- Code, UI and docs in English.
- The MCP's runtime dependencies stay light: ingestion dependencies (Docling, OCR, HTML
  parsing) go in an optional dependency group, not in the base install.
- Tech Radar, Adopt: Docling, Qdrant, PostgreSQL, FastAPI, OpenAI Embeddings, OpenAI vision
  models, FastEmbed (BM25), and since 27 October 2026 (handbook PR #19) Jinja2, HTMX,
  RapidOCR, Beautiful Soup and lxml.

## 6. Decisions made by the owner

- One MCP server, no second one. The document tools register in `create_mcp_server`.
- APIs from the start: OpenAI `text-embedding-3-small` for passages and questions, GPT-6 Luna
  for figure descriptions. Documents of the demo are public, so sending them to OpenAI is fine.
- One corpus with topics. A topic is anything (a place, "illegal mining", "REDD+"); topics are
  a managed list, a document can have several, and a topic can optionally point to a
  `place_id` so a conversation already on that place can filter by it.
- Demo data: the six sources of the test.
- Same guard practices as the existing MCP (section 4).
- Jinja2, HTMX, RapidOCR, Beautiful Soup and lxml are approved and added to the Tech Radar.
- The demo runs on the owner's machine and is shown on the owner's screen (section 7.0).

## 7. Architecture

```
 Back office + worker (FastAPI, optional deps)  ── writes ──▶ Postgres, schema mcp
        │ upload PDF / add URL                                   (documents, topics,
        ▼                                                         figures, jobs)
 extract (Docling / web) ─▶ chunk ─▶ embed (OpenAI) ─▶ Qdrant (Docker), collection documents
        └─▶ figures ─▶ OCR ─▶ describe (GPT-6 Luna) ─▶ review ─▶ embed approved ─▶ Qdrant
                                                                   ▲
 amazonia360 MCP (stdio / HTTP) ── list_topics, search_documents, get_document_section
        ▲
 Claude Desktop
```

Two processes from one package:

- **The MCP server**, as today, plus three document tools. Query path: embed the question
  through the API, hybrid query in Qdrant, read topics and documents from Postgres. No
  ingestion dependency is imported. If the document settings are missing, the tools are not
  registered and the server works as today.
- **The back office**, a new entry point (`amazonia360-docs`), which also runs the job worker
  and serves the stored files (PDFs, figure crops) that the links point to.

### 7.1 Data

Postgres, schema `mcp`, new Alembic migration (`0003_documents`). *[my call: Postgres instead
of synthbrain's SQLite, because the MCP already has the schema and the migrations, and
staging already has the database.]* For the demo it is a **local** Postgres, never the staging
database: the migration does not run on staging until the staging decision. The stdio entry
point gets a database connection only when the document settings are present.

### 7.0 Where the demo runs

On the owner's machine (owner's decision): Claude Desktop over stdio, Qdrant and Postgres in local Docker, the
back office on `127.0.0.1`. Links point at the back office's base URL (`DOCS_PUBLIC_URL`,
default `http://127.0.0.1:<port>`), so they open on the owner's screen, which is where the
demo is shown. Making links open for other people is part of the staging decision. The
document tools register only when the document settings are present, so the deployed
HTTP server and the front-end chat stay as they are.

- `topics`: `id` (slug), `name`, `aliases` (text array), `place_id` (nullable), timestamps.
- `documents`: `id`, `type` (`pdf` | `web`), `title`, `origin` (stored file path or URL),
  `authors_year` (free text such as "Bass et al. (2010)", for citations), `status`
  (`pending` | `processing` | `indexed` | `error`), `error_message`, `chunk_count`,
  `figure_count`, timestamps.
- `document_topics`: `document_id`, `topic_id`.
- `figures`: as synthbrain (`image_path`, `image_hash`, `generated_description`,
  `final_description`, `review_status`, `section_path`, `page`, `ocr_text`, size).
- `jobs`: as synthbrain's queue (kind, document, payload, status, progress, error).
  *[builder's call how the worker claims jobs; `FOR UPDATE SKIP LOCKED` fits Postgres.]*

Qdrant: one collection `documents`, named vectors `dense` (1,536) and `sparse` (BM25).
Payload: `document_id`, `topic_ids` (keyword, indexed), `section_path`, `text`, `origin`
(`text` | `figure`), `page`, `figure_path`, `anchor`, `link`. Topic changes on a document
rewrite `topic_ids` on its points without re-embedding.

Files under a data directory (`var/documents/` by default): uploads and figure crops.

### 7.2 Ingestion

Ported from synthbrain with its behaviour kept: Docling extraction of PDFs, sections of web
pages, passages of at most 300 words that keep a section's paragraphs together, figure crops,
OCR of the text printed in figures, triage of the review queue, replace semantics (old
passages stay searchable until the new ingest succeeds), approved descriptions kept across
re-ingests when the image hash is unchanged.

Changes:

- Embedder: OpenAI `text-embedding-3-small` behind synthbrain's embedder interface
  (`embed_documents`, `embed_query`); BM25 from FastEmbed as now.
- Figure describer: GPT-6 Luna with the prompt of the test (`doc-search/figure_set.py`),
  output cap 4,000 tokens (reasoning models used the 700 cap up with nothing written),
  images over 2,048 px downsized.
- Web sources: public pages only, as synthbrain enforces.

### 7.3 Search

Cross-language search needs BM25 switched off or weighted down: in the test, BM25 found 12%
of the Spanish questions, and merging it lowered recall. *[builder's call how: dense only
when the question is not in English, or a weighted fusion; decided with the eval, see 7.6.]*

### 7.4 MCP tools

- `list_topics()`: topics with their other names, `place_id` and document count, plus the
  list of documents (title, authors and year, type, topics).
- `search_documents(query, topic=None, place_id=None, limit=8)`: passages over the whole
  corpus, filtered by topic when given (resolved by id or name, as synthbrain resolves
  devices: an ambiguous name returns candidates and no results), or by the topics tied to a
  `place_id`. Each result: text, document title and authors, section, page, `origin`
  (`text` | `figure`), link.
- `get_document_section(document_id, section_path)`: the full section when a passage is cut.

Topic and place filtering *[my call]*: the filter is exact, with no nesting between places
(a topic tied to the Yasuní protected area does not apply to Orellana province). A
`place_id` with no tied topic searches the whole corpus and says so in the response.
Instructions tell Claude to search the whole corpus by default and filter only when the
user asks about one topic or the results drift to other places, so regional sources
(Finer 2008, Paredes 2026) are not dropped from a question about one place.

Demo topics *[my call, editable in the back office]*: Yasuní (tied to the protected area),
oil and gas, illegal mining, protected areas, deforestation, biodiversity, REDD+, forest
fragmentation.

Instructions added to `INSTRUCTIONS`, written as rules across tools, in the style already
there:

- Answer about documents only from returned passages; when none covers the question, say the
  indexed documents do not cover it.
- State a document figure with its document and year, and an indicator figure with the
  indicator; never combine, total or compare them as the same measure.
- Give the link of every passage used; say when a passage is a figure description.
- Quote the sentence that states a number.

Tool and output descriptions follow the MCP's current conventions (output schemas, errors
through `handlers/errors.py`, call log).

### 7.5 Back office

Synthbrain's layout and screens, renamed, in English:

- Sidebar: topics, and "All documents".
- Documents: upload a PDF, add a web report URL, title and authors-year, topics, status and
  counts, re-run, delete, replace.
- Document page: what was indexed (passages by section).
- Figures: the review queue per document (crop next to the editable description; approve,
  discard, approve all), with synthbrain's triage buckets.
- Topics: create, edit name, other names and `place_id` (checked against the module's places).
- "Test a question": the exact output `search_documents` returns.

### 7.6 Checks

- Unit tests ported from synthbrain where the code is ported, with fakes for OpenAI and
  Qdrant as synthbrain has.
- Retrieval eval on `doc-search/questions.yaml` against the real index, so the demo index
  reproduces the 94% of the test or explains the gap.
- A demo script in `mcp/docs/` (questions to ask in Claude, what each should show), run
  once end to end before the demo, and its result added to the deliverable document.

## 8. Left to the builder

- Module layout inside `src/mcp_server/` (suggested: `documents/` for the query side,
  `documents/ingest/` and `documents/backoffice/` for the optional side).
- Sync or async in the back office and worker; the MCP side follows the MCP's async code.
- Port numbers, settings names (prefix `DOCS_`), the data directory.
- Which synthbrain tests are worth porting and which are synth-specific.
- The BM25 handling of section 7.3, from the eval.

## 9. Risks

- Docling and OCR make the optional install heavy (torch). That is the reason for the
  optional group; it matters only if ingestion moves to staging.
- Uploading a long PDF live takes minutes (38 figures to describe in one paper). The demo
  should show an upload of a short document and use the pre-indexed corpus for questions.
- GPT-6 Luna made errors in 3 of 21 descriptions in the test; review before indexing covers
  it, and the demo should show one fix.
