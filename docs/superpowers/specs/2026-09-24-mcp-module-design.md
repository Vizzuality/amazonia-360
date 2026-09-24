# MCP module design

Status: approved on 24 September 2026. Phase 1 implemented; phase 2 and the gatekeeper
evaluation not started. Branch `feat/mcp-module`, cut from
`develop` at `d92944d9`.

This spec supersedes decisions 1 and 5 of the internal architecture note
(`discovery/mcp-architecture.md`, 16 September 2026) and settles decision 6 for this phase. The
other decisions in that note (consumers, transport, authentication, the one-plane rule) stand.
Files under `discovery/` are local exploration notes and are not in the repository; everything this
spec needs from them is restated here.

## Purpose of this phase

Expose the physical and natural environment layers of the Ecuador module as MCP tools, and measure
what answering over an arbitrary area actually costs. The measurements are the deliverable as much
as the tools: they are what the aggregation decision (grid, precomputation or on-the-fly) will be
taken against.

The service is expected to run in staging only. Whether it ever reaches production is not decided,
and nothing in this design depends on that answer.

## Decisions

| # | Decision | Outcome | Change from the 16 September note |
|---|---|---|---|
| 1 | Where the server runs | A separate service in a top-level `mcp/` directory, deployed as a fourth container in the existing Elastic Beanstalk environment | Was a package inside `api/` |
| 2 | Database | A second database on the shared RDS instance, owned by the MCP service. Phase 2 | Same rule, new location |
| 3 | Catalogue | Metadata built in code, in the shape of the CMS contract, behind one function | Was a Postgres table fed by Payload |
| 4 | Aggregation over an area | Cheap tools for presence and counts; area tools accept the latency and report it | Was open |
| 5 | H3 grid | Not used. The MCP has no dependency on `api/` in this phase | Was the reason for decision 1 |

### Why a separate service

The reason to live inside `api/` was reuse of the H3 engine. The Ecuador layers are all published
feature services and none of them is in the grid, so this phase has nothing to reuse. What the two
would share is third-party dependencies (`shapely`, `polars`), and those go in a second
`pyproject.toml` without duplicating code.

Separation also keeps the MCP out of a service that ships to production, so staying in staging is a
deployment choice instead of a feature flag inside `api/`, and it avoids inheriting `api/`'s static
token auth and its `--root-path /api/` wiring.

If the product-level catalogue later needs grid indicators, the MCP calls `http://api:8000/grid/...`
over the internal Docker network. That is a cleaner boundary than importing `api/`'s repository.

The cost is small because deployment already generates a Docker Compose file with three containers
(`api`, `client`, `nginx`) on one instance, in `.github/workflows/cicd.yml`. A fourth container does
not need a new Beanstalk environment.

## Repository layout

```
mcp/
├── pyproject.toml        uv, Python 3.12, Ruff, Pyright
├── Dockerfile
├── alembic.ini           phase 2
├── README.md
├── examples/
│   └── catalogue.json    the document the CMS sends, committed and kept current by tests
├── src/mcp_server/
│   ├── server.py         create_mcp_server(): stdio or Streamable HTTP, same tool registrations
│   ├── tools/            MCP surface only: schemas, annotations, permission decorators
│   ├── handlers/         the real work; knows nothing about MCP
│   ├── catalogue/        ecuador.json, the ArcGIS snapshot, the schema, the loader and the sync
│   ├── arcgis/           async client for the published feature services
│   ├── geometry/         area-of-interest validation and local clipping
│   ├── measurement/      per-call timing and the JSON-lines log
│   ├── auth/             phase 2: OAuth provider ported from VizzHub
│   └── db/               phase 2: SQLAlchemy models and Alembic migrations
└── tests/
```

`handlers/` is the interface the rest of the system depends on. Each handler takes an area of
interest and an indicator and returns a result with its provenance, its caveats, the geometry it was
computed over and its timing. `tools/` is a thin wrapper that adapts a handler to MCP. The front end
will reach the same handlers through a REST router, which is a second thin wrapper and is not built
in this phase. If logic ends up in a tool function, that router has to duplicate it.

### Dependencies

Adopt on the Tech Radar: FastAPI, PostgreSQL, uv, Ruff, Pyright.

Not on the radar, approved for this project on 24 September 2026:

- `mcp` 2.x, the official Python SDK. In 2.x the `FastMCP` class VizzHub uses is renamed
  `MCPServer` (`from mcp.server.mcpserver import MCPServer`), so code ported from VizzHub needs
  that change.
- SQLAlchemy with Alembic, for the phase 2 database.
- `httpx`, as the async HTTP client for ArcGIS.
- Jev, Laya, and the `anthropic` SDK for the Haiku control, for the gatekeeper evaluation.

## Transport and the two phases

`create_mcp_server()` returns a stdio server when called without auth arguments, and a Streamable
HTTP server when called with them, from the same tool registrations. That lets auth arrive later
without rewriting the tools.

**Phase 1, development over stdio.** Catalogue, ArcGIS client, handlers, tools, measurement. Run
locally from Claude Code or Claude Desktop. No database, no auth, no deployment.

**Phase 2, remote in staging.** OAuth provider and token verifier ported from VizzHub, the database,
Streamable HTTP mounted behind nginx at `/mcp/`, and the deployment below. The size of the VizzHub
port is still unscoped: `provider.py` is about 15 KB and depends on VizzHub's own models and
permission resolver.

Two known traps for phase 2, both from the VizzHub implementation:

- `MCPServer.streamable_http_app()` still defaults `streamable_http_path` to `/mcp`. Behind a
  `/mcp/` location that yields `/mcp/mcp`. Pass `streamable_http_path="/"`.
- Behind the load balancer the `Host` header is the public domain. The transport security settings
  need the public hostnames in `allowed_hosts`, or requests are rejected with an error that looks
  like a routing fault.

## Deployment (phase 2)

- **Image.** A new ECR repository through the existing `modules/ecr` Terraform module, and a
  `build_mcp` job in `cicd.yml` copied from `build_api`.
- **Container.** Added to the generated `docker-compose.yml` for staging only.
- **Proxy.** `infrastructure/source_bundle/proxy/conf.d/application.conf` is shared by every
  environment. An `upstream mcp` block that points to a container absent in production stops nginx
  from starting, because nginx resolves upstream hosts at startup. The `/mcp/` location has to be
  generated per environment in the deploy step, the same way the Compose file is.
- **Database.** A second database on the shared RDS instance, for example `amazonia360-staging-mcp`
  with its own user. `.ebextensions/database-provisioning.config` creates exactly one database and
  one user per environment from fixed `TF_DB_*` variables. It needs either a second set of variables
  or a loop over a list, and `modules/env/database.tf` needs a second generated password, for
  staging only.
- **Local.** The `database` service in the root `docker-compose.yml` gets the second database
  through an init script.

A schema inside the existing staging database was rejected: it shares a user with Payload, so a
permissions mistake or a stray migration on one side reaches the other. A new RDS instance was
rejected as a monthly cost with nothing to show for it over a second database.

## Catalogue

`catalogue/` exposes `get_indicator_metadata(indicator_id)` and `list_indicators(...)`. In this
phase they read two JSON files: `ecuador.json`, curated by hand, and `ecuador.snapshot.json`, the
contract's `sync` group written by `amazonia360-mcp-catalogue sync` from ArcGIS. When the CMS
feeds the catalogue, only the source behind those two functions changes.

*Changed on 24 September 2026:* the first cut kept the catalogue as a Python literal, with the
published record counts typed into caveat text. That text went stale the moment a layer was
republished, and Carbon had in fact been published while the file still said it was not.

Field names and vocabularies follow the contract on `feat/cms-indicator-metadata-contract`
(`client/src/cms/fields/metadata.ts` and `metadata-vocabularies.ts`): `value_type`, `aggregation`,
`decimals`, `spatial_coverage`, `ai_answerable`, `caveats`, the `provenance` group (`source_org`,
`source_url`, `license`, `source_citation`, `data_vintage`, `update_cadence`, `method_url`) and the
`sync` group (`arcgis_item_id`, `queryable_fields`, the edit dates, `sync_status`). The TypeScript
files are not copied; their vocabulary values are repeated in `catalogue/models.py` as `Literal`
types, because this service shares no code with the client, and have to be kept in step by hand.

Three fields are ours and marked as proposals in the schema: `category_field`, `documented_count`
and `sync.published_count`. The record-count warning is computed from the last two at answer time,
never stored in `caveats`, which the contract reserves for text a person wrote.

Two things to hold on to from the contract:

- `ai_answerable` defaults to false. Every layer exposed by the demo has to set it explicitly.
- Nothing is required. Completeness is checked by a test over the catalogue module, which can name
  the indicator and the field that is missing.

### Scope: the physical and natural environment

Thirteen of the consultant's twenty-three layers, by the consultant's own topic and subtopic
assignment: every layer under Nature, plus Territory / Physical Geography. Twelve are in
`client/datum/indicators.ECU.json`:

| id | Layer | Subtopic |
|---|---|---|
| 202 | Areas under restoration actions | Forest Dynamics and Carbon |
| 203 | Restoration priority areas | Forest Dynamics and Carbon |
| 204 | Bioclimates | Climate Patterns |
| 208 | Deforestation 2020–2022 | Forest Dynamics and Carbon |
| 209 | Hydrographic Demarcations | Physical Geography |
| 210 | Ecosystems | Natural Ecosystems |
| 211 | Geomorphology | Physical Geography |
| 214 | Flooding Regime | Natural Ecosystems |
| 217 | Thermotypes | Climate Patterns |
| 218 | Climate Types | Climate Patterns |
| 219 | Biogeographic Units | Natural Ecosystems |
| 222 | Water Recharge Zone | Physical Geography |

The thirteenth, Carbon by forest stratum (206), was found published on 24 September 2026: its item
has been public since 15 September, with 5 strata in field `Estrato` and a mean density
`Carbono_t_ha`. It is available, with a caveat that total carbon for an area is not computed.

`value_type`, `aggregation` and the category field of each layer are not in `indicators.ECU.json`
and have to be curated per layer. That is content work, and it is part of phase 1.

### Catalogue intake from the CMS (phase 2)

Decision 5 of the 16 September note stands: the MCP does not read Payload. The CMS sends the
catalogue to the MCP, and the MCP keeps its own copy.

*Changed on 24 September 2026:* the first version of this section sent one indicator per
publish, wrapped in an envelope with `event` and `updated_at`, and needed separate hooks for
delete and unpublish plus a reconciliation job. The user chose instead to send **the whole
published catalogue on every change**. It costs a larger payload (about 20 KB for the 13
Ecuador layers, a few hundred KB for the whole regional catalogue, sent only when something
changes) and removes most of the ways a callback drifts:

| Drift | With the whole catalogue |
|---|---|
| Two changes arrive out of order | Each export carries `generated_at`; the MCP keeps the newest. Nothing is merged, so versions never mix |
| Delete or unpublish | No event needed: the indicator stops appearing |
| The MCP is down during a change | The next export carries the full state and corrects it |
| A change that bypasses the editor (seed, migration) | A scheduled export, for example daily, as the safety net |

The document is `examples/catalogue.json`, validated by `catalogue.schema.json`: `locale`,
`generated_at` and `indicators`, published only. It is not Payload's REST response; the CMS maps
each document to it (table in `mcp/README.md`). The CMS's ArcGIS sync job must trigger an export
too, not only the editor. The CMS side should test its export against the schema, since that is
what catches a drifting mapping.

On the MCP side the local files already go through the same path: they are joined into one
catalogue document and validated by `load_document`, which is what the endpoint will call. The
endpoint and storage in the MCP's database are phase 2.

## Tools

| Tool | Answers | Measured cost |
|---|---|---|
| `list_indicators` | What exists, filterable by topic and subtopic | No network call |
| `describe_indicator` | Unit, provenance, dates, caveats, value type | No network call |
| `categories_in_area` | Which classes of a categorical layer are present | 0.19–0.37 s |
| `count_in_area` | How many discrete features fall inside | 0.19–0.37 s |
| `area_by_category` | How many hectares of each class fall inside | 4.6–16.7 s per layer |

A tool refuses an operation that the layer's `value_type` does not support before calling ArcGIS,
for example `area_by_category` on a count layer.

### Why area is expensive, and what the tool does about it

Asking ArcGIS for the sum of `Area_ha` over intersecting features returns the full area of every
polygon that touches the area of interest, not the part inside it. On a canton of 151,804 ha that
overestimates Geomorphology by ×36 and Ecosystems by ×42, in 0.2 s and with nothing in the response
to show it. That query is never used.

`area_by_category` fetches the geometries with server-side simplification (`maxAllowableOffset`
0.001, which introduced at most 0.02% error in the September measurements) and clips them locally
with shapely. One layer per call. The latency is accepted in this phase and reported in every
response, so the aggregation decision can be taken on real usage.

## Response shape

Every handler returns the same envelope. The values below are illustrative:

```json
{
  "indicator_id": 210,
  "value": { "Bosque siempreverde de tierras bajas": 77293 },
  "unit": "ha",
  "computed_over": {
    "type": "clipped_polygons", "features": 5, "categories": 1, "simplification": 0.001
  },
  "coverage": { "status": "inside", "provisional": true },
  "provenance": { "source_org": "...", "source_url": "...", "data_vintage": "..." },
  "caveats": ["The module boundary used for this check is a provisional bounding box; ..."],
  "aoi_ha": 151804.2,
  "timing": {
    "total_ms": 16700, "arcgis_ms": 9100, "clip_ms": 7300,
    "vertices_sent": 38, "vertices_received": 412000
  }
}
```

`computed_over` is the one-plane rule of the 16 September note: the answer says which geometry it
used, so the text can say it and the map can draw the same thing. In this phase every answer is in
the ArcGIS plane, so the rule holds by construction.

## Inputs

The area of interest is a GeoJSON Polygon or MultiPolygon in WGS84, with a vertex limit so that a
client cannot send a province at full resolution. The limit is set from the first measurements.

Lookup by administrative unit name is out of scope: it needs a boundaries layer, and the module
polygon is still pending.

## Errors

No plausible number is returned without a signal.

- **Area outside the module, or partly outside.** The response says so. Until
  `ECU_MOD_POLIG_LIMITE_WGS84` is delivered, the check uses a provisional envelope and the response
  declares that it is provisional. In a partial result `aoi_ha` still counts the whole area, and
  the caveat says so; once the real boundary arrives the result should also carry the hectares
  inside the module (`aoi_inside_ha`), which a bounding box cannot give honestly.
- **Layers with known defects.** Where the record count in the consultant's documentation
  (`documented_count`) differs from the published layer (`sync.published_count`), the warning is
  computed at answer time and attached to every result and to `describe_indicator`. On 24
  September 2026 that is five layers: 204, 208, 214, 217 and 219. Defects a person has written
  up go in `caveats` and travel the same way. A layer that does not respond is an explicit error.
- **Layers that are not available.** No resource, no clean sync, or a missing `value_type` or
  `category_field`: the refusal names which, before any network call.
- **ArcGIS slow or down.** Every call has a timeout. A timeout returns an error, never a partial
  result shaped like a complete one.
- **Invalid geometry.** Self-intersecting or oversized input is rejected before any network call,
  with the reason.

## Measurement

Each response carries `timing`, and each call appends one JSON line to a local log: tool,
indicator, area of the input in hectares, vertices sent, vertices received, and the timing
breakdown. Phase 1 writes to a file. In phase 2 the same records can go to the database if the file
proves insufficient.

## Testing

- Unit tests for the ArcGIS client against hand-written payloads in the shape of the live ones,
  and for handlers and tools against a fixed catalogue, so re-syncing the committed snapshot
  cannot break them. Recorded responses are still to do (open question 7).
- Tests that fail when `catalogue.schema.json` or `examples/catalogue.json` is stale.
- A clipping test with synthetic geometries whose clipped area is known, so that returning full
  polygon areas instead of clipped ones fails a test.
- A catalogue completeness test that names the indicator and the field that is missing.
- A smoke suite against the live services, marked separately and not run in CI.

## Question gatekeeper (evaluation)

In the front-end path, a user's question reaches our backend before any handler runs. The
gatekeeper decides there whether the question is on topic and whether the Ecuador proof of concept
can answer it. In this phase it is built and evaluated only. It is wired to the front end in the
map phase.

It is not an MCP tool. A remote MCP server never sees the user's question, only the tool calls the
host model chooses to make, so there is no "before the MCP" in Claude Desktop. There, coverage is
enforced inside each tool, as described under Tools and Errors.

### Two steps, and only the first uses a model

1. **Classify.** A decision model turns the question into typed fields. It reads the question and
   never writes an answer, so it has to understand Spanish, Portuguese and English but does not
   have to produce any of them.
2. **Check coverage.** Deterministic code checks the typed fields against the catalogue: the
   indicator exists, `ai_answerable` is true, the operation is allowed by the layer's `value_type`,
   the area falls inside the module, and whether the layer carries a known defect. The area comes
   from the map, not from the text, so nothing is extracted from the question.

Whether the data covers a question is therefore answered by the catalogue and can be audited. Only
the classifier changes between candidates.

```python
class Classification(TypedDict):
    on_topic: bool                  # physical and natural environment of Ecuador
    subtopic_id: int | None
    indicator_id: int | None        # one of the 13 in-scope layers, or None
    operation: Literal["presence", "count", "area", "other"] | None
    confidence: dict[str, float]    # per field, as returned by the model
```

A confidence below a per-field threshold leads to a clarifying question instead of an answer. The
thresholds are set from the evaluation, not in advance.

### Candidates

| Candidate | What it is | Why it is in the comparison |
|---|---|---|
| Jev | TypeSafe AI, proprietary, API, released 15 September 2026 | First candidate |
| Laya | Convai Innovations, Apache 2.0, 421M parameters, self-hosted, same week | Second candidate; runs inside the `mcp/` container |
| Keyword baseline | Names, aliases and subtopics from the catalogue | Floor: a model that does not beat this is not earning its cost |
| Small LLM with structured output | Claude Haiku 4.5 | Control: tells us whether a decision model beats the obvious alternative |

Things to hold on to:

- Laya's published comparison against Jev comes from its own author. Zero-shot it scores 0.362 on
  its own typed-decisions benchmark against a random baseline of 0.318, so it probably needs
  fine-tuning on our questions. Its accuracy degrades past about 20 options per choice question;
  twelve indicators are within that.
- With Jev the question leaves our infrastructure to a third party. That has to be acceptable to
  the IDB before real user questions go through it.
- Laya's memory footprint has to fit the Beanstalk instance alongside the other four containers.

### The evaluation set

Built by us, 150 to 200 questions, mostly Spanish with a share in Portuguese and English, since the
application has all three locales. Four groups:

| Group | Example | Expected |
|---|---|---|
| On topic, covered | ¿Qué ecosistemas hay en esta zona? | on topic, indicator 210, presence |
| On topic, not covered | ¿Cuántas toneladas de carbono hay en esta zona? | on topic, indicator 206, operation other: the layer holds a mean density per stratum and total carbon is not computed |
| Off topic | ¿Cuánta gente vive aquí? | off topic for this proof of concept |
| Ambiguous | ¿Cómo está el bosque? | low confidence, clarifying question |

Each question is labelled with every field of `Classification`. The set is split into a
development part and a held-out test part from the first commit, so that fine-tuning Laya or tuning
thresholds never sees the questions it is scored on.

### What is measured

- Accuracy per field, and for the whole classification.
- Calibration: whether a confidence of 0.8 is right about 80% of the time.
- Coverage at threshold: the share of questions answered rather than sent back, against the error
  rate among the ones answered.
- Latency, p50 and p95.
- The same metrics broken down by language.

### Layout

```
mcp/
├── src/mcp_server/gatekeeper/
│   ├── classify.py        Classification, the Classifier protocol, one adapter per candidate
│   └── coverage.py        the deterministic check against the catalogue
└── eval/
    ├── questions.dev.jsonl
    ├── questions.test.jsonl
    └── run.py             runs every candidate over a split and writes a report
```

## Out of scope for this phase

- Wiring the gatekeeper into the front end.
- The REST router for the front end, and the map phase.
- Any use of the H3 grid.
- Precomputing the Ecuador layers, against administrative units or against the grid.
- Reading the catalogue from Payload.
- The 80 further layers the consultant has announced, mostly census data.
- Production deployment.

## Open questions

1. How large the VizzHub OAuth port is. It gates phase 2.
2. The vertex limit on the input area, to be set from the first measurements.
3. How the five miscounted layers are resolved. It depends on a request to the consultant that
   is still unanswered. (Carbon, the other half of this question, was published on 15 September.)
4. Whether sending user questions to Jev is acceptable to the IDB.
5. Whether Laya needs fine-tuning, and on how many questions. Decided from the first zero-shot run.
6. Every `provenance` field is null. Filling it is data curation, and it belongs to whoever curates
   the catalogue in the CMS, not to this branch (decided 24 September 2026). The AGOL items hold
   most of it (`accessInformation`, `licenseInfo`, and the description for `data_vintage`). Two
   things the curator will meet: layer 218 (Tipos de clima) credits the environment ministry but
   its description names MAGAP–SIGAGRO as the source, and no item carries a formal citation.
   Needed before any demo that shows `describe_indicator`. *The catalogue shape itself was
   brought in line with the contract on 24 September 2026.*
7. Handler tests use hand-written ArcGIS payloads, not recorded ones. Record one live
   response each for `distinct`, `count` and a paginated `geojson` page (layer 210 over
   the Tena test area) and replay them through `httpx.MockTransport`.
8. Before phase 2 over HTTP: move local clipping off the event loop, put a ceiling on the
   whole call rather than per request, and close the `httpx.AsyncClient` in the server
   lifespan.
