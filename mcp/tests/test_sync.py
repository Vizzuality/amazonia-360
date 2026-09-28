from datetime import UTC, datetime
from typing import Any

import httpx
import pytest

from mcp_server.catalogue.models import CuratedIndicator
from mcp_server.catalogue.sync import (
    ARCGIS_ONLINE,
    ITEM_PATH,
    nothing_read,
    sync_catalogue,
    sync_indicator,
)
from tests.test_models import curated

NOW = datetime(2026, 9, 24, 10, 0, tzinfo=UTC)
LAYER_URL = "https://example.test/arcgis/rest/services/eco/FeatureServer/0"
ITEM_ID = "1108a9956a9b4076931c5a35e9decf3a"

LAYER_META: dict[str, Any] = {
    "serviceItemId": ITEM_ID,
    "editingInfo": {
        "lastEditDate": 1787133463622,
        "schemaLastEditDate": 1787133463622,
        "dataLastEditDate": 1787133463622,
    },
    "fields": [{"name": "fid"}, {"name": "Ecosistema"}, {"name": "Area_ha"}],
}


def transport(
    layer: dict[str, Any] | None = None,
    count: dict[str, Any] | None = None,
    item: dict[str, Any] | None = None,
    fail: bool = False,
) -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        if fail:
            raise httpx.ConnectError("down", request=request)
        url = str(request.url).split("?")[0]
        if url == LAYER_URL:
            return httpx.Response(200, json=layer or LAYER_META)
        if url == f"{LAYER_URL}/query":
            return httpx.Response(200, json=count or {"count": 51})
        if url == ARCGIS_ONLINE + ITEM_PATH.format(item_id=ITEM_ID):
            return httpx.Response(200, json=item or {"modified": 1789422927000})
        return httpx.Response(404)

    return httpx.MockTransport(handler)


async def run(indicator: CuratedIndicator, **kwargs: Any) -> Any:
    async with httpx.AsyncClient(transport=transport(**kwargs)) as http:
        return await sync_indicator(http, indicator, NOW)


def ecosystems(**overrides: Any) -> CuratedIndicator:
    raw = curated(**overrides)
    if raw["resource"] is not None:
        raw["resource"]["url"] = LAYER_URL.removesuffix("/0")
    return CuratedIndicator.model_validate(raw)


@pytest.mark.anyio
async def test_reads_the_layer_the_count_and_the_item() -> None:
    sync = await run(ecosystems())
    assert sync.sync_status == "ok"
    assert sync.arcgis_item_id == ITEM_ID
    assert sync.queryable_fields == ["fid", "Ecosistema", "Area_ha"]
    assert sync.published_count == 51
    assert sync.layer_last_edit == datetime(2026, 8, 19, 9, 57, 43, 622000, UTC)
    assert sync.item_modified == datetime(2026, 9, 14, 21, 55, 27, tzinfo=UTC)
    assert sync.synced_at == NOW


@pytest.mark.anyio
async def test_an_indicator_without_a_resource_has_nothing_to_read() -> None:
    # Nothing upstream is not the same as an upstream that could not be read.
    sync = await run(ecosystems(resource=None))
    assert sync.sync_status is None
    assert sync.synced_at == NOW


@pytest.mark.anyio
async def test_a_null_editing_info_is_read_as_no_dates() -> None:
    sync = await run(ecosystems(), layer={**LAYER_META, "editingInfo": None})
    assert sync.sync_status == "ok"
    assert sync.layer_last_edit is None


@pytest.mark.anyio
async def test_a_malformed_timestamp_is_an_error_not_a_crash() -> None:
    layer = {**LAYER_META, "editingInfo": {"dataLastEditDate": "yesterday"}}
    sync = await run(ecosystems(), layer=layer)
    assert sync.sync_status == "error"


@pytest.mark.anyio
async def test_a_malformed_url_is_an_error_not_a_crash() -> None:
    raw = curated()
    raw["resource"]["url"] = "http://[bad"
    sync = await run(CuratedIndicator.model_validate(raw))
    assert sync.sync_status == "error"


@pytest.mark.anyio
async def test_no_category_field_skips_the_field_check() -> None:
    sync = await run(ecosystems(category_field=None))
    assert sync.sync_status == "ok"


@pytest.mark.anyio
async def test_a_missing_category_field_is_an_error() -> None:
    layer = {**LAYER_META, "fields": [{"name": "fid"}, {"name": "Area_ha"}]}
    sync = await run(ecosystems(), layer=layer)
    assert sync.sync_status == "error"
    assert sync.queryable_fields == ["fid", "Area_ha"]


@pytest.mark.anyio
async def test_an_arcgis_error_body_is_an_error() -> None:
    sync = await run(ecosystems(), layer={"error": {"code": 400, "message": "x"}})
    assert sync.sync_status == "error"


@pytest.mark.anyio
async def test_a_network_failure_is_an_error_not_a_crash() -> None:
    sync = await run(ecosystems(), fail=True)
    assert sync.sync_status == "error"


@pytest.mark.anyio
async def test_an_inaccessible_item_keeps_the_layer_readings() -> None:
    sync = await run(ecosystems(), item={"error": {"code": 403, "message": "no"}})
    assert sync.sync_status == "item_inaccessible"
    assert sync.published_count == 51
    assert sync.item_modified is None


@pytest.mark.anyio
async def test_a_malformed_item_date_is_an_inaccessible_item() -> None:
    sync = await run(ecosystems(), item={"modified": "yesterday"})
    assert sync.sync_status == "item_inaccessible"
    assert sync.published_count == 51


@pytest.mark.anyio
async def test_a_run_without_network_reads_nothing() -> None:
    document = {"locale": "en", "indicators": [curated(), curated(id=211)]}
    async with httpx.AsyncClient(transport=transport(fail=True)) as http:
        snapshot = await sync_catalogue(http, document, NOW)
    assert nothing_read(snapshot)


def test_one_readable_layer_is_enough_to_keep_the_run() -> None:
    snapshot = {
        "indicators": {
            "210": {"sync_status": "error"},
            "211": {"sync_status": "item_inaccessible"},
            "206": {"sync_status": None},
        }
    }
    assert not nothing_read(snapshot)


def test_a_catalogue_without_resources_is_not_a_failed_run() -> None:
    assert not nothing_read({"indicators": {"206": {"sync_status": None}}})


@pytest.mark.anyio
async def test_sync_catalogue_writes_one_entry_per_indicator() -> None:
    document = {"locale": "en", "indicators": [curated()]}
    document["indicators"][0]["resource"]["url"] = LAYER_URL.removesuffix("/0")
    async with httpx.AsyncClient(transport=transport()) as http:
        result = await sync_catalogue(http, document, NOW)
    assert result["generated_at"] == "2026-09-24T10:00:00Z"
    assert result["indicators"]["210"]["sync_status"] == "ok"
    assert result["indicators"]["210"]["published_count"] == 51


@pytest.mark.anyio
async def test_an_image_service_gives_its_pixel_size_and_its_portal_item() -> None:
    from tests.test_models import raster_indicator

    canopy = raster_indicator()
    assert canopy.resource is not None
    image_url = canopy.resource.url
    portal = "https://example.test/portal"

    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url).split("?")[0]
        if url == image_url:
            return httpx.Response(
                200,
                json={
                    "serviceItemId": ITEM_ID,
                    "pixelSizeX": 0.008983,
                    "spatialReference": {"wkid": 4326},
                },
            )
        if url == "https://example.test/image/rest/info":
            return httpx.Response(200, json={"owningSystemUrl": portal})
        if url == portal + ITEM_PATH.format(item_id=ITEM_ID):
            return httpx.Response(200, json={"modified": 1789422927000})
        return httpx.Response(404)

    curated_canopy = CuratedIndicator.model_validate(
        canopy.model_dump(exclude={"sync", "available"})
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
        sync = await sync_indicator(http, curated_canopy, NOW)
    assert sync.sync_status == "ok"
    assert sync.pixel_size_deg == 0.008983
    assert sync.published_count is None
    assert sync.item_modified is not None
