"""The local copy must give the figures ArcGIS gives, on the areas people ask about.

Runs against the store the server reads (``MCP_LAYER_STORE``, default
``var/layer-store``) and skips when it has not been built.
"""

import asyncio
from collections.abc import AsyncIterator

import httpx
import pytest
from shapely.geometry import MultiPolygon, Polygon

from mcp_server.arcgis.client import ArcGISClient, ArcGISError
from mcp_server.catalogue import list_indicators
from mcp_server.catalogue.models import IndicatorMetadata
from mcp_server.config import Settings
from mcp_server.handlers.area import SIMPLIFICATION_DEG
from mcp_server.places import load_places
from mcp_server.store.build import area_capable
from mcp_server.store.files import LayerStore
from mcp_server.store.sources import (
    ArcGISSource,
    AreaRequest,
    LocalCopySource,
    Measurement,
)

pytestmark = [pytest.mark.live, pytest.mark.anyio]

INDICATORS = area_capable(list_indicators())
CONCURRENT_QUERIES = 4


def _tolerance_ha(live_ha: float) -> float:
    return max(1.0, 0.005 * live_ha)


def _place_ids() -> list[str]:
    places = load_places()
    ids = [
        "province:Pastaza",
        "canton:Napo/Tena",
        "protected_area:Yasuní",
        *(p.id for p in places.of_kind("canton", province="Napo").places),
        *(p.id for p in places.of_kind("protected_area").places),
    ]
    return list(dict.fromkeys(ids))


LIVE_ATTEMPTS = 3


async def _live_measure(live: ArcGISSource, request: AreaRequest) -> Measurement:
    # ArcGIS Online drops a connection now and then; that says nothing about parity.
    for attempt in range(LIVE_ATTEMPTS):
        try:
            measurement = await live.measure(request)
        except ArcGISError:
            if attempt == LIVE_ATTEMPTS - 1:
                raise
            await asyncio.sleep(2 * (attempt + 1))
        else:
            assert measurement is not None
            return measurement
    raise AssertionError("unreachable")


@pytest.fixture(scope="module")
def store() -> LayerStore:
    path = Settings.from_env().layer_store_path
    if not (path / "layers").is_dir():
        pytest.skip(f"No layer store at {path}; build it with the store command.")
    return LayerStore(path)


@pytest.fixture(scope="module")
def boundaries(store: LayerStore) -> dict[str, Polygon | MultiPolygon]:
    generated_at = load_places().snapshot.generated_at
    found = {pid: store.boundary(pid, generated_at) for pid in _place_ids()}
    missing = [pid for pid, geom in found.items() if geom is None]
    if missing:
        pytest.skip(f"The store has no boundary for {missing}.")
    return {pid: geom for pid, geom in found.items() if geom is not None}


@pytest.fixture
async def live() -> AsyncIterator[ArcGISSource]:
    async with httpx.AsyncClient(timeout=120) as http:
        yield ArcGISSource(ArcGISClient(http), SIMPLIFICATION_DEG)


def test_the_places_to_compare_are_the_ones_the_brief_names() -> None:
    ids = _place_ids()
    assert "province:Pastaza" in ids and "protected_area:Yasuní" in ids
    assert sum(i.startswith("protected_area:") for i in ids) == 40
    assert sum(i.startswith("canton:Napo/") for i in ids) == 5


@pytest.mark.parametrize("indicator", INDICATORS, ids=lambda i: str(i.id))
async def test_the_copy_matches_arcgis(
    indicator: IndicatorMetadata,
    store: LayerStore,
    boundaries: dict[str, Polygon | MultiPolygon],
    live: ArcGISSource,
) -> None:
    layer = indicator.query_layer()
    assert layer is not None
    if store.manifest(indicator.id) is None:
        pytest.skip(f"The store has no copy of layer {indicator.id}.")
    local = LocalCopySource(store)
    gate = asyncio.Semaphore(CONCURRENT_QUERIES)

    async def compare(place_id: str) -> list[str]:
        request = AreaRequest(
            indicator, layer, boundaries[place_id], place_id, with_shapes=False
        )
        copy = await local.measure(request)
        assert copy is not None, f"layer {indicator.id}: the copy is stale"
        async with gate:
            theirs = await _live_measure(live, request)
        problems = []
        if copy.hectares.keys() != theirs.hectares.keys():
            problems.append(
                f"{place_id}: classes differ, copy only "
                f"{sorted(copy.hectares.keys() - theirs.hectares.keys())}, live only "
                f"{sorted(theirs.hectares.keys() - copy.hectares.keys())}"
            )
        for name, live_ha in theirs.hectares.items():
            copy_ha = copy.hectares.get(name, 0.0)
            if abs(copy_ha - live_ha) > _tolerance_ha(live_ha):
                problems.append(
                    f"{place_id} / {name}: copy {copy_ha:.2f} ha, live {live_ha:.2f} ha"
                )
        return problems

    results = await asyncio.gather(*(compare(pid) for pid in boundaries))
    problems = [p for place in results for p in place]
    assert problems == [], "\n".join(problems)
