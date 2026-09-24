"""Reads from ArcGIS what the contract's sync group holds, for every curated indicator.

This stands in for the CMS sync job until the CMS serves the contract. It never
raises for one bad layer: a failure is recorded as a ``sync_status``, which makes the
indicator unavailable, so a broken service cannot crash the whole run.
"""

import asyncio
import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from mcp_server.catalogue.models import CuratedIndicator, Sync

ITEM_URL = "https://www.arcgis.com/sharing/rest/content/items/{item_id}"

# The contract has no field for the reason, so it goes to whoever runs the sync.
log = logging.getLogger(__name__)


class _SyncError(Exception):
    pass


async def sync_catalogue(
    http: httpx.AsyncClient, curated: dict[str, Any], now: datetime
) -> dict[str, Any]:
    indicators = [CuratedIndicator.model_validate(i) for i in curated["indicators"]]
    syncs = await asyncio.gather(*(sync_indicator(http, i, now) for i in indicators))
    return {
        "generated_at": _iso(now),
        "indicators": {
            str(i.id): s.model_dump(mode="json")
            for i, s in zip(indicators, syncs, strict=True)
        },
    }


async def sync_indicator(
    http: httpx.AsyncClient, indicator: CuratedIndicator, now: datetime
) -> Sync:
    if indicator.resource is None:
        # No published service means there is nothing to reach.
        return Sync(synced_at=now, sync_status="item_inaccessible")
    layer_url = f"{indicator.resource.url}/{indicator.resource.layer_id}"
    try:
        meta = await _get_json(http, layer_url)
        count = await _get_json(
            http,
            f"{layer_url}/query",
            {"where": "1=1", "returnCountOnly": "true"},
        )
        fields = [f["name"] for f in meta["fields"]]
        editing = meta.get("editingInfo", {})
        item_id = meta["serviceItemId"]
        published = int(count["count"])
    except (_SyncError, httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
        log.warning("%s: layer unreadable: %r", indicator.id, exc)
        return Sync(synced_at=now, sync_status="error")

    readings: dict[str, Any] = {
        "arcgis_item_id": item_id,
        "queryable_fields": fields,
        "layer_last_edit": _from_ms(editing.get("dataLastEditDate")),
        "schema_last_edit": _from_ms(editing.get("schemaLastEditDate")),
        "published_count": published,
        "synced_at": now,
    }
    if indicator.category_field not in fields:
        log.warning(
            "%s: category field %r not in the layer",
            indicator.id,
            indicator.category_field,
        )
        return Sync(**readings, sync_status="error")
    try:
        item = await _get_json(http, ITEM_URL.format(item_id=item_id))
    except (_SyncError, httpx.HTTPError, ValueError) as exc:
        log.warning("%s: item unreadable: %r", indicator.id, exc)
        return Sync(**readings, sync_status="item_inaccessible")
    return Sync(
        **readings, item_modified=_from_ms(item.get("modified")), sync_status="ok"
    )


async def _get_json(
    http: httpx.AsyncClient, url: str, params: dict[str, str] | None = None
) -> dict[str, Any]:
    response = await http.get(url, params={**(params or {}), "f": "json"})
    response.raise_for_status()
    body = response.json()
    if not isinstance(body, dict) or "error" in body:
        raise _SyncError(f"{url}: {body}")
    return body


def _from_ms(value: Any) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(value / 1000, UTC)


def _iso(moment: datetime) -> str:
    return moment.astimezone(UTC).isoformat().replace("+00:00", "Z")
