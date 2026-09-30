"""``amazonia360-mcp-catalogue``: keep the catalogue files current.

- ``sync`` reads ArcGIS and rewrites ``ecuador.snapshot.json``, the example export,
  ``places/places.snapshot.json`` and the module's outline, ``geometry/module.geojson``.
- ``schema`` rewrites ``catalogue.schema.json`` from the pydantic model.
- ``export`` writes the joined catalogue: the document the CMS is expected to send.
"""

import argparse
import asyncio
import json
import logging
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

from mcp_server import places
from mcp_server.catalogue import (
    SNAPSHOT_FILE,
    get_indicator_metadata,
    load_curated,
    local_document,
)
from mcp_server.catalogue.models import CatalogueDocument
from mcp_server.catalogue.sync import nothing_read, sync_catalogue
from mcp_server.geometry import aoi
from mcp_server.geometry.module_sync import (
    MODULE_SOURCE_INDICATOR,
    ModuleSyncError,
    dump_outline,
    sync_module,
)
from mcp_server.places.sync import PlacesSyncError, sync_places

HERE = Path(__file__).parent
SCHEMA_FILE = "catalogue.schema.json"
EXAMPLE_FILE = HERE.parents[2] / "examples" / "catalogue.json"


def catalogue_schema() -> dict[str, Any]:
    # Validation mode describes what the CMS sends; computed fields such as
    # `available` are the MCP's own and stay out.
    schema = CatalogueDocument.model_json_schema(mode="validation")
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        **schema,
        "title": "Amazonia 360 catalogue, as the MCP takes it in",
        "description": (
            "The whole published catalogue, which the CMS exports to the MCP on every "
            "change: create, edit, publish, unpublish, delete, and each ArcGIS sync. "
            "Locale en. Not Payload's REST response: see the mapping table in the "
            "MCP README."
        ),
    }


def exported_catalogue() -> dict[str, Any]:
    return local_document().model_dump(
        mode="json", exclude={"indicators": {"__all__": {"available"}}}
    )


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", "utf-8")


def _now() -> datetime:
    # Whole seconds, so a re-sync with no real change is a small diff.
    return datetime.now(UTC).replace(microsecond=0)


async def _sync(timeout_s: float) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=timeout_s) as http:
        return await sync_catalogue(http, load_curated(), _now())


async def _sync_places(timeout_s: float) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=timeout_s) as http:
        return await sync_places(http, _now())


async def _sync_module(timeout_s: float) -> dict[str, Any]:
    source = get_indicator_metadata(MODULE_SOURCE_INDICATOR)
    layer = source.query_layer() if source is not None else None
    if layer is None:
        raise ModuleSyncError(f"indicator {MODULE_SOURCE_INDICATOR} has no layer")
    async with httpx.AsyncClient(timeout=timeout_s) as http:
        return await sync_module(http, layer, _now())


def main() -> None:
    parser = argparse.ArgumentParser(prog="amazonia360-mcp-catalogue")
    commands = parser.add_subparsers(dest="command", required=True)
    sync = commands.add_parser("sync", help="read ArcGIS, rewrite the snapshot")
    sync.add_argument("--timeout", type=float, default=60.0)
    commands.add_parser("schema", help="rewrite the JSON Schema")
    export = commands.add_parser("export", help="write the joined catalogue")
    export.add_argument("--out", type=Path, help="file to write; stdout if omitted")
    args = parser.parse_args()
    logging.basicConfig(level=logging.WARNING, format="%(message)s")

    if args.command == "sync":
        snapshot = asyncio.run(_sync(args.timeout))
        # Writing it would mark every indicator unavailable over a network outage.
        if nothing_read(snapshot):
            sys.exit("No layer could be read; the snapshot was left as it was.")
        write_json(HERE / SNAPSHOT_FILE, snapshot)
        local_document.cache_clear()
        write_json(EXAMPLE_FILE, exported_catalogue())
        for indicator_id, sync_entry in snapshot["indicators"].items():
            print(f"{indicator_id}: {sync_entry['sync_status']}")
        try:
            places_snapshot = asyncio.run(_sync_places(args.timeout))
        except PlacesSyncError as exc:
            print(f"Places not read ({exc}); {places.SNAPSHOT_FILE} left as it was.")
        else:
            write_json(
                Path(places.__file__).parent / places.SNAPSHOT_FILE, places_snapshot
            )
            places.load_places.cache_clear()
            print(f"places: {len(places_snapshot['places'])}")
        try:
            outline = asyncio.run(_sync_module(args.timeout))
        except ModuleSyncError as exc:
            print(
                f"Module outline not read ({exc}); "
                f"{aoi.MODULE_FILE.name} left as it was."
            )
        else:
            aoi.MODULE_FILE.write_text(dump_outline(outline), "utf-8")
            aoi.module_outline.cache_clear()
            print(f"module outline: {outline['properties']['area_ha']} ha")
    elif args.command == "schema":
        write_json(HERE / SCHEMA_FILE, catalogue_schema())
    elif args.out:
        write_json(args.out, exported_catalogue())
    else:
        print(json.dumps(exported_catalogue(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
