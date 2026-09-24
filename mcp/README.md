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
| `resource[0].layer_id` (text) | `resource.layer_id`, integer |
| `caveats[].text` (row `id` dropped) | `caveats[].text` |
| `sync` group, written by the CMS's ArcGIS sync job | `sync`, same fields |
| `name`, `description_short`, `description`, `unit`, contract fields | same names |
| `order`, visualization fields, `_status`, timestamps | not sent |

Fields whose schema description starts with "Proposal" are not in the CMS contract yet;
each description says where it would go in Payload.

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `MCP_CALL_LOG` | `var/calls.jsonl` | One JSON line per tool call, with timing |
| `ARCGIS_TIMEOUT_S` | `60` | Per-request timeout against ArcGIS |

## Test

```bash
uv run pytest            # unit tests, no network
uv run pytest -m live    # against the published services
```
