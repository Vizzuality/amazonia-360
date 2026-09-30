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

## Places

`find_places` returns provinces, cantons and protected areas by name; every area tool takes the
`place_id` it returns instead of `area`.

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

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `MCP_CALL_LOG` | `var/calls.jsonl` | One JSON line per tool call, with timing |
| `ARCGIS_TIMEOUT_S` | `65` | Per-request timeout against ArcGIS; just above ArcGIS Online's own cut at about 59 s |
| `MCP_PUBLIC_URL` | *(required over HTTP)* | The server's public URL, e.g. `https://staging.amazoniaforever360.org/mcp` |
| `MCP_DATABASE_URL` | *(required over HTTP)* | The `mcp` role's connection string |
| `MCP_GOOGLE_CLIENT_ID` | *(required over HTTP)* | A Google OAuth client of its own, with redirect `…/mcp/oauth/callback` |
| `MCP_GOOGLE_CLIENT_SECRET` | *(required over HTTP)* | Its secret |
| `MCP_ALLOWED_REDIRECT_URIS` | Claude, ChatGPT and any loopback address | The redirect allowlist, with the defaults above |
| `MCP_PORT` | `8000` | The port `amazonia360-mcp-http` listens on |

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
