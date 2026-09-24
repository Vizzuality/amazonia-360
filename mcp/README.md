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

In `claude_desktop_config.json`, with the absolute path to this directory:

```json
{
  "mcpServers": {
    "amazonia360": {
      "command": "uv",
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
| `indicator.schema.json` | JSON Schema of one indicator after the two are joined | `amazonia360-mcp-catalogue schema` |

```bash
uv run amazonia360-mcp-catalogue sync     # re-read ArcGIS; a failing layer becomes unavailable
uv run amazonia360-mcp-catalogue schema   # after changing catalogue/models.py
uv run amazonia360-mcp-catalogue export   # the joined catalogue, for the CMS team to compare
```

`sync` and `schema` write into the source tree, so run them from a checkout, not from an
installed package. The live suite fails when the snapshot is behind ArcGIS.

`ecuador.json` spells out every field, nulls included, on purpose: it is the image of what
the CMS will send, so a missing field there means a field nobody has decided about yet.

### What the CMS sends

The schema is the MCP's intake format: what the CMS posts to the MCP when an editor
publishes an indicator, in locale `en`. It is not Payload's REST response. The CMS maps its
document to it:

| Payload document (`?locale=en&depth=0`) | MCP intake |
|---|---|
| `id` (text, e.g. `"210"`) | `id`, integer |
| `subtopic` (relationship id) | `subtopic`, integer |
| `resource[0]` (one-item blocks list) | `resource`, one object |
| `resource[0].blockType` | `resource.type` |
| `resource[0].url` | `resource.url` |
| `resource[0].layer_id` (text) | `resource.layer_id`, integer |
| `caveats[].text` (row `id` dropped) | `caveats[].text` |
| `name`, `unit`, contract fields | same names |
| `description`, `order`, visualization fields, `_status`, timestamps | not sent |

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
