# Amazonia 360 MCP server

Answers questions about the physical and natural environment of the Ecuador module over an
area of interest. Design: `docs/superpowers/specs/2026-09-24-mcp-module-design.md`.

## Run

```bash
cd mcp
uv sync
uv run amazonia360-mcp        # stdio
```

### From Claude Code

```bash
claude mcp add amazonia360 -- uv --directory "$(pwd)" run amazonia360-mcp
```

### From Claude Desktop

In `claude_desktop_config.json`, with the absolute path to this directory. Claude Desktop does
not inherit your shell's `PATH`, so give `uv` as an absolute path too (`which uv`):

```json
{
  "mcpServers": {
    "amazonia360": {
      "command": "/absolute/path/to/uv",
      "args": ["--directory", "/absolute/path/to/mcp", "run", "amazonia360-mcp"]
    }
  }
}
```

If the repository is on a volume other than the boot disk and macOS has not given Claude
Desktop access to it, `uv` exits with "Current directory does not exist": the process may enter
the directory but not list it, and uv needs to. Launching the virtualenv's entry point directly
avoids uv (run `uv sync` first so `.venv` exists):

```json
"amazonia360": {
  "command": "/bin/sh",
  "args": ["-c", "cd /absolute/path/to/mcp && exec .venv/bin/amazonia360-mcp"]
}
```

### Over HTTP, with OAuth

```bash
uv run amazonia360-mcp-db upgrade              # the database first
uv run amazonia360-mcp-db allow you@example.org
uv run amazonia360-mcp-http
```

This needs the variables in the `MCP_PUBLIC_URL`, `MCP_DATABASE_URL`, `MCP_GOOGLE_CLIENT_ID`,
`MCP_GOOGLE_CLIENT_SECRET` and `MCP_ALLOWED_REDIRECT_URIS` rows of the settings table below; the
server refuses to start over HTTP when any of the required ones is missing.
For local use, `MCP_PUBLIC_URL=http://localhost:8000/mcp` works with a Google OAuth client
whose redirect is `http://localhost:8000/mcp/oauth/callback`. `.env.staging.default` lists what
staging needs, without values, and where each value comes from.

The emails that can sign in are in the `mcp.allowed_emails` table, managed with the same
CLI, which reads `MCP_DATABASE_URL`:

```bash
uv run amazonia360-mcp-db allow ana@example.org [--by NAME]   # --by defaults to the OS user
uv run amazonia360-mcp-db revoke ana@example.org
uv run amazonia360-mcp-db list                                # email, added by, added at
```

Emails are stored stripped and lowercased. The server reads the table on every sign-in,
request and refresh, with no cache, so a change applies to the next request without a restart.
`revoke` also deletes the email's tokens and codes, so access ends at once. With the table
empty the server starts, logs that nobody can sign in, and refuses every account.
`MCP_ALLOWED_EMAILS` is no longer read; if it is still set, the server logs a warning at
startup.

Behind a reverse proxy, the proxy must forward the original `Host` header (`proxy_set_header
Host $host;` in nginx): the server only accepts requests for the host in `MCP_PUBLIC_URL`.

## Tools

Each group is registered in `create_mcp_server` (`src/mcp_server/server.py`). Every area tool
takes an `indicator_id`, and either an `area` (GeoJSON) or a `place_id`.

| Tool | What it returns | Defined in |
|---|---|---|
| `list_indicators` | The module's indicators, with the tools each one can be asked through | `tools/catalogue.py` |
| `describe_indicator` | Unit, value type, provenance and caveats of one indicator | `tools/catalogue.py` |
| `find_places` | Provinces, cantons and protected areas with a name, each with its `place_id` | `tools/places.py` |
| `list_places` | Every place of a kind, or the cantons of one province | `tools/places.py` |
| `categories_in_area` | Which classes of a categorical layer are present. Fast | `tools/area.py` |
| `count_in_area` | How many features of a count layer fall in the area. Fast | `tools/area.py` |
| `class_shares_in_area` | Share of the area's pixels in each class of a classed raster. Fast | `tools/area.py` |
| `area_by_category` | Hectares of each class, clipped to the area. Slow | `tools/area.py` |
| `map_area_by_category` | The figures of `area_by_category`, with a map for the user | `maps/__init__.py` |
| `map_class_shares_in_area` | The shares of `class_shares_in_area`, with a map for the user | `maps/__init__.py` |

Paths are under `src/mcp_server/`. `tests/test_readme.py` fails when this table and the
server's tools differ.

## Document tools

Registered only when `DOCS_DATABASE_URL` and `DOCS_QDRANT_URL` are set (see
[Document search](#document-search)); without them the server has the tools above and nothing
else.

| Tool | What it returns | Defined in |
|---|---|---|
| `list_topics` | The topics of the indexed documents, and every document with its id, title and year | `tools/documents.py` |
| `search_documents` | Passages that answer a query, each with document, section, page and link, plus documents that match by summary only | `tools/documents.py` |
| `get_document_section` | The full text of one section of a document | `tools/documents.py` |

`tests/documents/test_tools.py` fails when this table and the registered tools differ.

## Document search

Papers and reports are indexed in Postgres and Qdrant and searched through the document tools.

1. Start both services: `docker compose -f docker-compose.docs.yml up -d` (Postgres on
   `localhost:5433`, Qdrant on `localhost:6343`).
2. Install the ingestion extra: `uv sync --extra ingest`.
3. Create the tables: `uv run amazonia360-docs migrate`.
4. Run the back office, which uploads and reviews documents, manages topics, tests a
   question and serves the files that links point at: `uv run amazonia360-docs serve`, then
   open `http://127.0.0.1:8770`. It needs `OPENAI_API_KEY`, and runs the job worker in the
   same process.

The demo corpus (six sources, eight topics) loads with `amazonia360-docs seed` and
`amazonia360-docs load-demo <folder with the four PDFs>`; `amazonia360-docs eval
tests/documents/fixtures/questions.yaml` measures retrieval over it.

In Claude Desktop, add these to the `env` of the server's entry:

| Variable | Value |
|---|---|
| `DOCS_DATABASE_URL` | The Postgres connection string of the documents database |
| `DOCS_QDRANT_URL` | The Qdrant URL |
| `DOCS_PUBLIC_URL` | The URL where `amazonia360-docs serve` is reachable, used for passage links |
| `OPENAI_API_KEY` | Embeds the query; the server fails to start without it when documents are configured |

## Places

`find_places` returns provinces, cantons and protected areas by name; every area tool takes the
`place_id` it returns instead of `area`. `list_places` returns every place of a kind, or the
cantons of one province, for questions over several places.

## Catalogue

The indicators live in three files in `src/mcp_server/catalogue/`:

| File | What it holds | Who writes it |
|---|---|---|
| `ecuador.json` | Everything a person decides: value type, `ai_answerable`, caveats, provenance | By hand |
| `ecuador.snapshot.json` | The contract's `sync` group, read from ArcGIS | `amazonia360-mcp-catalogue sync` |
| `catalogue.schema.json` | JSON Schema of the whole catalogue document | `amazonia360-mcp-catalogue schema` |

The server joins the first two into one catalogue document. `examples/catalogue.json` is
that document, committed: it is what the CMS will send.

```bash
uv run amazonia360-mcp-catalogue sync               # re-read ArcGIS; also rewrites the example
uv run amazonia360-mcp-catalogue schema             # after changing catalogue/models.py
uv run amazonia360-mcp-catalogue export --out examples/catalogue.json   # after editing ecuador.json
```

`sync` and `schema` write into the source tree, so run them from a checkout, not from an
installed package. Tests fail when the schema or the example is stale; the live suite fails
when the snapshot is behind ArcGIS.

Besides the module's 13 layers, `ecuador.json` holds five classed rasters of the regional
platform (slope, land cover, forest cover, canopy height, grassland), with the front end's
ids, raster functions and legends copied from `client/datum/indicators.json`. They are
answered by `class_shares_in_area`: the share of the area's pixels in each class. Their
items live on the IDB portal, which the sync finds through each server's `/rest/info`.

`ecuador.json` spells out every field, nulls included, on purpose: a null there is a field
nobody has decided about yet. Today every `provenance` field is null for that reason; the
CMS is expected to fill them.

### What the CMS sends

On every change to the catalogue (create, edit, publish, unpublish, delete, and each ArcGIS
sync) the CMS sends the whole published catalogue, drafts excluded, in locale `en`, shaped as
`examples/catalogue.json` and validated by `catalogue.schema.json`. Sending everything each
time is what keeps the two from drifting: a missed or out-of-order export is corrected by the
next one, and a deleted indicator simply stops appearing.

This is not Payload's REST response. The CMS maps each document:

| Payload document (`?locale=en&depth=0`) | MCP catalogue |
|---|---|
| `id` (text, e.g. `"210"`) | `id`, integer |
| `subtopic` (relationship id) | `subtopic`, integer |
| `resource[0]` (one-item blocks list) | `resource`, one object |
| `resource[0].blockType` | `resource.type` |
| `resource[0].url` | `resource.url` |
| `resource[0].layer_id` (text) | `resource.layer_id`, integer (feature only) |
| `resource[0].rasterFunction` (JSON, imagery) | `resource.raster_function`, unchanged |
| `resource[0].legend` (group, imagery) | `resource.legend`, `{type, items: [{label, color}]}` |
| `resource[0].aggregation` (imagery) | `resource.aggregation` |
| `caveats[].text` (row `id` dropped) | `caveats[].text` |
| `sync` group, written by the CMS's ArcGIS sync job | `sync`, same fields |
| `name`, `description_short`, `description`, `unit`, contract fields | same names |
| `order`, visualization fields, `_status`, timestamps | not sent |

Fields whose schema description starts with "Proposal" are not in the CMS contract yet;
each description says where it would go in Payload.

## Maps

`map_area_by_category` and `map_class_shares_in_area` return the same figures as their plain
counterparts
and ask the host to show a map next to the answer, as an
[MCP Apps](https://github.com/modelcontextprotocol/ext-apps) view. The pages, in `src/mcp_server/maps/`,
use MapLibre from jsDelivr and OpenFreeMap tiles, and the front end's tokens and Montserrat. What
only the page needs (clipped shapes, a raster image) travels in the result's `_meta`, not in the
text the model reads. Hosts without MCP Apps get the figures alone.

## Skill

`skills/amazonia360/SKILL.md` tells the model how to use the tools: the order of calls, what to
do when a place name matches several places, which indicators answer an ambiguous word, and how
to read a result. It is installed by hand:

- Claude Desktop and claude.ai: zip the folder (`cd skills && zip -r amazonia360.zip amazonia360`)
  and upload it under Settings → Capabilities → Skills.
- Claude Code: copy `skills/amazonia360` into `.claude/skills/` of the project, or
  `~/.claude/skills/`.

`tests/test_skill.py` fails when a tool is missing from the skill, or when the skill names an
indicator that cannot be answered.

## Chat API

`POST <MCP_PUBLIC_URL>/chat` is the front end's chat: it takes an AG-UI `RunAgentInput`, runs
the measurement's question loop over this server in process, and streams AG-UI events back
over SSE. TanStack AI's `ChatClient` and `useChat` read it with `fetchServerSentEvents`. The
model key stays in this service; the front end holds none. The contract is the spec
`docs/superpowers/specs/2026-10-22-mcp-chat-api-design.md`.

```bash
# Locally, alone, with no OAuth and no database, on http://127.0.0.1:8001/chat
MCP_CHAT_DEV_TOKENS="ana:$(openssl rand -hex 24)" ANTHROPIC_API_KEY=... uv run amazonia360-mcp-chat
```

| Setting | What it does |
|---|---|
| `MCP_CHAT_MODEL` | Label from `measurement/models.toml` (`sonnet` by default); its provider's key must be set |
| `MCP_CHAT_DEV_TOKENS` | `name:token` pairs, one per developer, 32 characters or more, until the front end issues its JWT |
| `MCP_CHAT_JWKS_URL`, `MCP_CHAT_JWT_ISSUER` | The front end's public keys and issuer, for its JWTs (`aud` `amazonia360-ai`, 10 minutes at most) |
| `MCP_CHAT_ALLOWED_ORIGINS` | The front end's origins, comma-separated; `localhost` is allowed while development tokens are set |
| `MCP_CHAT_MAX_TURNS`, `MCP_CHAT_MAX_SECONDS` | Per question, 60 and 300 by default |
| `MCP_CHAT_RUN_LOG` | One line per question: user, thread, model, turns, tokens, cost (`var/chat-runs.jsonl`) |
| `MCP_CHAT_PORT` | Port of the local command (8001) |

With no token setting, `/chat` answers 503. Tool calls go to `var/calls.jsonl` with the token's
user and the thread id. `examples/chat/` holds recorded streams of real questions, each with its
request, for the front end to build against before the endpoint is deployed.

### From the front end

Checked with `@tanstack/ai-client` and `@tanstack/ai-react` 1.0.0.

1. **Get a development token.** Ask for one; it is added to `MCP_CHAT_DEV_TOKENS` under your
   name. Keep it in your local `.env`, never in code or a deployed bundle: anyone who reads it
   spends the model key. It goes once the front end's backend issues the JWT; the header does
   not change.
2. **Point at the API.** The base URL is `<MCP_PUBLIC_URL>` on staging, or
   `http://127.0.0.1:8001` with the local command. Your origin must be in
   `MCP_CHAT_ALLOWED_ORIGINS`; `localhost` on any port is allowed while development tokens are
   set.
3. **Connect.**

```tsx
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";

const { messages, sendMessage, isLoading, error } = useChat({
  // Required. One id per conversation.
  threadId,
  connection: fetchServerSentEvents(`${AI_API_URL}/chat`, async () => ({
    // Read per request, so a JWT can be refreshed later.
    headers: { Authorization: `Bearer ${await getToken()}` },
  })),
  // The language of the answer: "en", "es" or "pt".
  forwardedProps: { locale },
  onChunk: (chunk) => {
    if (chunk.type === "CUSTOM" && chunk.name === "amazonia360:run-summary") {
      // { model, turns, toolCalls, costUsd, elapsedMs }
    }
  },
});
```

4. **Read the figures from the tool results, not the text.** Each assistant message has
   `parts`. A part with `type: "tool-call"` has `name` (the tool), `input` (its arguments) and
   `output`, the tool's result already parsed: for the area tools, a `Result` with `value`,
   `unit`, `computed_over`, `coverage`, `place` and `caveats` (the output schema of each tool
   describes every field). `input.indicator_id` and `input.place_id` say what to show on the
   map. Text parts (`type: "text"`) hold the model's answer.
5. **Handle errors.** A refused request reaches `onError` (and `error`) as a `StreamHttpError`
   whose `status` is 401 (no or bad token), 400 (bad body) or 503 (chat off, or no model key).
   A run that fails halfway ends with `RUN_ERROR`; `error.message` is a sentence to show, and
   the parts already received stay.
6. **Keep the history if you want it after a reload.** By default it lives in memory.
   `persistence: localStoragePersistence()` (or the session-storage and IndexedDB adapters from
   `@tanstack/ai-client`) keeps it in the browser. Do not set `persistence: true`: it asks the
   server to rebuild the thread, and this API stores none.

**Without the API**, replay a recorded stream with `fetchClient`:

```ts
import morona from "./examples/chat/morona-canton.sse?raw";

const replay = async () =>
  new Response(morona, { headers: { "Content-Type": "text/event-stream" } });

useChat({ threadId, connection: fetchServerSentEvents("/chat", { fetchClient: replay }) });
```

Whatever is sent, the reply is the recorded one; `run-error.sse` shows the error path.

## Layer store

A local copy of each module vector layer, split into small pieces, and precomputed hectares
for every named place. `area_by_category` reads them instead of asking ArcGIS, so an answer
that took seconds takes milliseconds. The store is generated, never committed.

```bash
uv run amazonia360-mcp-catalogue store                  # build the layers that changed, then the places
uv run amazonia360-mcp-catalogue store --rebuild 210    # rebuild one or more layers by id
uv run amazonia360-mcp-catalogue store --rebuild-all    # rebuild every layer
```

`store` skips a layer whose copy already matches the catalogue's `layer_last_edit`.
`--store PATH` overrides the location, and `sync` ends with the same step. A full rebuild takes
about 5 minutes and the store is about 53 MB.

`MCP_LAYER_STORE` sets where the server reads the store (default `var/layer-store`); it loads
at start without a network call. `MCP_AREA_SOURCES` lists the sources in order, from
`precomputed`, `local_copy` and `arcgis` (default: all three). Live ArcGIS always closes the
list, so without a store, or for a layer with no current copy, the server answers from ArcGIS.
A copy or a precomputed figure answers only when it was built from the layer version in the
loaded catalogue.

Every `area_by_category` result says its source and, for the first two, the layer version.
`class_shares_in_area`, `categories_in_area` and `count_in_area` still ask ArcGIS.

The decided staging plan: the container image build runs the sync and `store`, and a new layer
version reaches staging with the next deployment.

Measured medians of `area_by_category` over the three trial boxes, ArcGIS only against the
store (`docs/superpowers/evaluations/2026-10-19-mcp-layer-store-measurement.md`):

| Layer | ArcGIS only | With the store |
|---|---|---|
| 206 Carbon by forest stratum | 7.2 s | 11 ms |
| 208 Deforestation 2020-2022 | 5.5 s | 4 ms |
| 210 Ecosystems | 3.6 s | 21 ms |

A drawn area the size of Yasuni is still slow: on layer 210 it takes about 9 s from the copy
and about 16 s from ArcGIS. Yasuni named by its place id is answered from precomputed figures
and does not pay that cost.

## Timing run

`amazonia360-mcp-timing` times every tool on every available indicator over the three fixed
areas in `examples/areas.geojson` (20 × 20 km boxes on Puyo, Tena and Nuevo Rocafuerte), one call
at a time, and appends each call to `var/timing.jsonl`. A round is 75 calls and takes about
two and a half minutes. It exists to measure how often ArcGIS takes far longer than usual.

```sh
# From mcp/, where var/ lives. 24 rounds, one an hour; caffeinate keeps the Mac awake
mkdir -p var
caffeinate -i nohup uv run amazonia360-mcp-timing run > var/timing.out 2>&1 &
uv run amazonia360-mcp-timing summary   # per tool and layer: median, max, over 10 s and 60 s
```

## Model measurement

`amazonia360-mcp-measure` asks the base questions in `measurement/questions.json` to several
models, each with the server's instructions and the skill as its system prompt and the server's
tools, and records what each answer cost, how long it took and which tools it called. Every
question gets a fresh server over stdio, so no answer leans on an earlier one. Questions 20 and
21 need AM-757 and run only when named with `--questions`.

It needs the `measure` dependency group (`uv sync --group measure`; `dev` includes it) and the
key of each provider in the run, from the environment: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`DEEPSEEK_API_KEY`.

Models are listed in `measurement/models.toml`, one `[[model]]` per label, with the provider,
the model id and its prices in dollars per million tokens, the date they were read and the page
they were read from. A model with any of those empty is refused before any call. The DeepSeek
prices are the peak rates, so their figures are an upper bound; off-peak is half.

```sh
# From mcp/. First round: one model per provider, at most 20 USD in all
uv run amazonia360-mcp-measure estimate --models sonnet,openai-mid,deepseek-mid
uv run amazonia360-mcp-measure run --models sonnet,openai-mid,deepseek-mid --max-spend 20
uv run amazonia360-mcp-measure summary var/model-runs/<run_id>
```

`estimate` prices the run assuming each question's expected calls and no caching, so a model
that makes more calls costs more than the estimate; the spending cap is the guard.
`run` prints the same estimate,
asks before going on (`--yes` skips the question), sends one short message to every model to
check that it accepts the tool schemas, and only then starts the questions. `--max-spend` caps
the whole run: when it is reached the current question stops mid-way (ended `spend_cap`) and
the run ends.
`--max-turns` (60) and `--max-seconds` (600) limit each question. `--sources arcgis` runs the
server without the layer store. Ctrl-C stops the run and keeps the finished questions.

Each run lands in `var/model-runs/<run_id>/`, the run id being the UTC start time:

- `run.json`: the models with their prices, the questions, store on or off, the limits, how
  each provider caches, that reasoning effort was left at each provider's default, and the
  server commit.
- `trace.jsonl`: one line per question, with every turn's tokens, every tool call, the price,
  the time and the answer. The server's own lines in `var/calls.jsonl` carry the same run id
  and question number.
- `summary.md`: per model, the price per question, the total, the median and longest time,
  the tool calls, the questions not ended by an answer and the answers cut short (a stop reason
  such as `max_tokens` or `refusal`), with whether caching was on and each model's prices, the date
  read and the page. These are the figures the D6 report
  takes.
- `answers.md`: per question, the text, the expected answer, and each model's answer with its
  price, time and calls, to grade by hand.

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `MCP_CALL_LOG` | `var/calls.jsonl` | One JSON line per tool call, with timing |
| `ARCGIS_TIMEOUT_S` | `65` | Per-request timeout against ArcGIS; just above ArcGIS Online's own cut at about 59 s |
| `MCP_LAYER_STORE` | `var/layer-store` | Where the server reads the layer store, and where `store` writes it |
| `MCP_AREA_SOURCES` | `precomputed,local_copy,arcgis` | Order of the sources for `area_by_category`; `arcgis` always closes it |
| `MCP_PUBLIC_URL` | *(required over HTTP)* | The server's public URL, e.g. `https://staging.amazoniaforever360.org/mcp` |
| `MCP_DATABASE_URL` | *(required over HTTP)* | The `mcp` role's connection string |
| `MCP_GOOGLE_CLIENT_ID` | *(required over HTTP)* | A Google OAuth client of its own, with redirect `…/mcp/oauth/callback` |
| `MCP_GOOGLE_CLIENT_SECRET` | *(required over HTTP)* | Its secret |
| `MCP_ALLOWED_REDIRECT_URIS` | Claude, ChatGPT and any loopback address | The redirect allowlist, with the defaults above |
| `MCP_PORT` | `8000` | The port `amazonia360-mcp-http` listens on |
| `DOCS_DATABASE_URL`, `DOCS_QDRANT_URL` | *(unset: no document tools)* | The documents database and the Qdrant index; both turn the document tools on |
| `DOCS_PUBLIC_URL` | `http://127.0.0.1:8770` | Base of the links in passages |
| `DOCS_DATA_DIR` | `var/documents` | Uploads and extracted figures |
| `DOCS_PORT` | `8770` | The port `amazonia360-docs serve` listens on |
| `OPENAI_API_KEY` | *(required with document tools)* | Embeddings for queries |

## Test

```bash
uv run pytest            # unit tests, no network
uv run pytest -m live    # against the published services
```

The OAuth and storage tests need a local PostgreSQL database, no Docker:

```bash
createdb amazonia360_mcp_test
export MCP_TEST_DATABASE_URL=postgresql://<user>@localhost:5432/amazonia360_mcp_test
uv run pytest
```

The default selection (`-m 'not live'`) includes the database tests; without
`MCP_TEST_DATABASE_URL` they are skipped. The fixture drops the `mcp` schema before each run and
refuses any database whose name does not end in `_test`.
