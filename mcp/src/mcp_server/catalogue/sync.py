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

from mcp_server.catalogue.models import (
    CuratedIndicator,
    FeatureResource,
    ImageryResource,
    Sync,
)

ARCGIS_ONLINE = "https://www.arcgis.com"
ITEM_PATH = "/sharing/rest/content/items/{item_id}"

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


def nothing_read(snapshot: dict[str, Any]) -> bool:
    """True when every layer failed, which points at the network, not the layers."""
    statuses = [
        entry["sync_status"]
        for entry in snapshot["indicators"].values()
        if entry["sync_status"] is not None
    ]
    return bool(statuses) and all(status == "error" for status in statuses)


async def sync_indicator(
    http: httpx.AsyncClient, indicator: CuratedIndicator, now: datetime
) -> Sync:
    if indicator.resource is None:
        return Sync(synced_at=now)
    try:
        if isinstance(indicator.resource, ImageryResource):
            return await _read_image(http, indicator.resource, now)
        return await _read_layer(http, indicator, indicator.resource, now)
    except Exception as exc:
        # The docstring's promise: one bad layer never stops the run.
        log.warning("%s: layer unreadable: %r", indicator.id, exc)
        return Sync(synced_at=now, sync_status="error")


async def _read_layer(
    http: httpx.AsyncClient,
    indicator: CuratedIndicator,
    resource: FeatureResource,
    now: datetime,
) -> Sync:
    layer_url = f"{resource.url}/{resource.layer_id}"
    meta = await _get_json(http, layer_url)
    count = await _get_json(
        http, f"{layer_url}/query", {"where": "1=1", "returnCountOnly": "true"}
    )
    fields = [f["name"] for f in meta["fields"]]
    editing = meta.get("editingInfo") or {}
    readings = Sync(
        arcgis_item_id=meta["serviceItemId"],
        queryable_fields=fields,
        layer_last_edit=_from_ms(editing.get("dataLastEditDate")),
        schema_last_edit=_from_ms(editing.get("schemaLastEditDate")),
        published_count=int(count["count"]),
        synced_at=now,
    )
    if indicator.category_field is not None and indicator.category_field not in fields:
        log.warning(
            "%s: category field %r not in the layer",
            indicator.id,
            indicator.category_field,
        )
        return readings.model_copy(update={"sync_status": "error"})
    return await _with_item(http, indicator.id, readings)


async def _read_image(
    http: httpx.AsyncClient, resource: ImageryResource, now: datetime
) -> Sync:
    meta = await _get_json(http, resource.url)
    wkid = (meta.get("spatialReference") or {}).get("latestWkid") or (
        meta.get("spatialReference") or {}
    ).get("wkid")
    # In any other reference the pixel size is not in degrees.
    pixel = float(meta["pixelSizeX"]) if wkid == 4326 else None
    readings = Sync(
        arcgis_item_id=meta.get("serviceItemId"),
        pixel_size_deg=pixel,
        synced_at=now,
    )
    # The regional rasters' items live on the IDB's own portal, not on ArcGIS
    # Online; the server names its portal in its info.
    root = resource.url.split("/rest/services/")[0]
    info = await _get_json(http, f"{root}/rest/info")
    portal = info.get("owningSystemUrl") or ARCGIS_ONLINE
    return await _with_item(http, resource.url, readings, portal)


async def _with_item(
    http: httpx.AsyncClient,
    what: object,
    readings: Sync,
    portal: str = ARCGIS_ONLINE,
) -> Sync:
    if readings.arcgis_item_id is None:
        log.warning("%s: the service names no item", what)
        return readings.model_copy(update={"sync_status": "item_inaccessible"})
    try:
        url = portal + ITEM_PATH.format(item_id=readings.arcgis_item_id)
        item = await _get_json(http, url)
        modified = _from_ms(item.get("modified"))
    except (_SyncError, httpx.HTTPError, ValueError) as exc:
        log.warning("%s: item unreadable: %r", what, exc)
        return readings.model_copy(update={"sync_status": "item_inaccessible"})
    return readings.model_copy(update={"item_modified": modified, "sync_status": "ok"})


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
    if not isinstance(value, int | float):
        raise _SyncError(f"not an epoch in milliseconds: {value!r}")
    return datetime.fromtimestamp(value / 1000, UTC)


def _iso(moment: datetime) -> str:
    return moment.astimezone(UTC).isoformat().replace("+00:00", "Z")
