"""``amazonia360-mcp-catalogue``: keep the catalogue files beside this module current.

- ``sync`` reads ArcGIS and rewrites ``ecuador.snapshot.json``.
- ``schema`` rewrites ``indicator.schema.json`` from the pydantic model.
- ``export`` prints the joined catalogue, the output the CMS is expected to match.
"""

import argparse
import asyncio
import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

from mcp_server.catalogue import SNAPSHOT_FILE, list_indicators, load_curated
from mcp_server.catalogue.models import IndicatorMetadata
from mcp_server.catalogue.sync import sync_catalogue

HERE = Path(__file__).parent
SCHEMA_FILE = "indicator.schema.json"


def indicator_schema() -> dict[str, Any]:
    # Validation mode describes what the CMS sends; computed fields such as
    # `available` are the MCP's own and stay out.
    schema = IndicatorMetadata.model_json_schema(mode="validation")
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        **schema,
        "title": "Amazonia 360 indicator, as the MCP takes it in",
        "description": (
            "One indicator as the CMS sends it to the MCP when an editor publishes, "
            "mapped from the Payload document, in locale en. Not Payload's REST "
            "response: see the mapping table in the MCP README."
        ),
    }


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", "utf-8")


async def _sync(timeout_s: float) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=timeout_s) as http:
        # Whole seconds, so a re-sync with no real change is a small diff.
        now = datetime.now(UTC).replace(microsecond=0)
        return await sync_catalogue(http, load_curated(), now)


def main() -> None:
    parser = argparse.ArgumentParser(prog="amazonia360-mcp-catalogue")
    commands = parser.add_subparsers(dest="command", required=True)
    sync = commands.add_parser("sync", help="read ArcGIS, rewrite the snapshot")
    sync.add_argument("--timeout", type=float, default=60.0)
    commands.add_parser("schema", help="rewrite the JSON Schema")
    commands.add_parser("export", help="print the joined catalogue")
    args = parser.parse_args()
    logging.basicConfig(level=logging.WARNING, format="%(message)s")

    if args.command == "sync":
        snapshot = asyncio.run(_sync(args.timeout))
        write_json(HERE / SNAPSHOT_FILE, snapshot)
        for indicator_id, sync_entry in snapshot["indicators"].items():
            print(f"{indicator_id}: {sync_entry['sync_status']}")
    elif args.command == "schema":
        write_json(HERE / SCHEMA_FILE, indicator_schema())
    else:
        exported = {
            "locale": "en",
            "indicators": [
                i.model_dump(mode="json", exclude={"available"})
                for i in list_indicators()
            ],
        }
        print(json.dumps(exported, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
