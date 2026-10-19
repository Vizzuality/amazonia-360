from datetime import UTC, datetime
from pathlib import Path

import pytest
from shapely.geometry import box
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError, Feature
from mcp_server.catalogue.models import IndicatorMetadata, Layer
from mcp_server.geometry.area import clip_area_by_category
from mcp_server.places import Places
from mcp_server.places.models import PlacesSnapshot
from mcp_server.store.build import build_layers, build_places, stale_layers
from mcp_server.store.files import LayerStore
from mcp_server.store.models import LayerManifest
from tests.test_models import curated

pytestmark = pytest.mark.anyio

SEPTEMBER = datetime(2026, 9, 1, tzinfo=UTC)
OCTOBER = datetime(2026, 10, 1, tzinfo=UTC)
NOW = datetime(2026, 10, 19, tzinfo=UTC)
FEATURES: list[Feature] = [
    ("Bosque", box(-78.0, -1.2, -77.85, 0.0)),
    ("Páramo", box(-77.85, -1.2, -77.0, 0.0)),
]
BOUNDARY = box(-77.9, -1.1, -77.8, -1.0)


def make(indicator_id: int, edit: datetime, **overrides: object) -> IndicatorMetadata:
    return IndicatorMetadata.model_validate(
        {
            **curated(id=indicator_id, **overrides),
            "sync": {
                "sync_status": "ok",
                "queryable_fields": ["Ecosistema"],
                "layer_last_edit": edit,
            },
        }
    )


class FakeClient:
    def __init__(
        self, failing: set[int] | None = None, features: list[Feature] | None = None
    ) -> None:
        self.features = features or FEATURES
        self.downloads: list[tuple[str, float]] = []
        self._failing = failing or set()

    async def layer_features(
        self, layer: Layer, max_allowable_offset: float
    ) -> list[Feature]:
        self.downloads.append((layer.service_url, max_allowable_offset))
        if layer.layer_id in self._failing:
            raise ArcGISError("the service is down")
        return self.features

    async def boundary(self, url: str, layer_id: int, where: str) -> list[BaseGeometry]:
        if where == "missing":
            return []
        return [BOUNDARY]


async def build(
    store: LayerStore,
    indicators: list[IndicatorMetadata],
    client: FakeClient,
    only: list[int] | None = None,
) -> dict[int, str]:
    return await build_layers(
        client,
        store,
        indicators,
        only=only,
        cell_deg=0.1,
        simplification=0.001,
        now=NOW,
    )


def resource(layer_id: int) -> dict[str, object]:
    return {
        "resource": {
            "type": "feature",
            "url": "https://example.test/arcgis/rest/services/eco/FeatureServer",
            "layer_id": layer_id,
        }
    }


def test_stale_layers_lists_missing_and_outdated_copies(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    missing, outdated, current = make(1, OCTOBER), make(2, OCTOBER), make(3, OCTOBER)
    not_for_ai = make(4, OCTOBER, ai_answerable=False)
    store.write_layer(_manifest(2, SEPTEMBER), [])
    store.write_layer(_manifest(3, OCTOBER), [])
    stale = stale_layers(store, [missing, outdated, current, not_for_ai])
    assert stale == [1, 2]


def _manifest(indicator_id: int, edit: datetime) -> LayerManifest:
    return LayerManifest(
        indicator_id=indicator_id,
        layer_last_edit=edit,
        simplification=0.001,
        cell_deg=0.1,
        features=0,
        pieces=0,
        built_at=NOW,
    )


async def test_build_layers_builds_stale_and_skips_current(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(2, OCTOBER), [])
    client = FakeClient()
    result = await build(store, [make(1, OCTOBER), make(2, OCTOBER)], client)
    assert result == {1: "built", 2: "current"}
    manifest = store.manifest(1)
    assert manifest is not None
    assert manifest.layer_last_edit == OCTOBER
    assert manifest.simplification == 0.001
    assert manifest.features == 2
    assert len(client.downloads) == 1
    assert client.downloads[0][1] == 0.001


async def test_only_rebuilds_the_layers_asked_for_even_when_current(
    tmp_path: Path,
) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(1, OCTOBER), [])
    store.write_layer(_manifest(2, OCTOBER), [])
    result = await build(
        store, [make(1, OCTOBER), make(2, OCTOBER)], FakeClient(), only=[1]
    )
    assert result == {1: "built"}
    manifest = store.manifest(1)
    assert manifest is not None
    assert manifest.features == 2


async def test_a_failed_layer_keeps_its_previous_copy(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(1, SEPTEMBER), [])
    indicators = [make(1, OCTOBER), make(2, OCTOBER, **resource(7))]
    result = await build(store, indicators, FakeClient(failing={0}))
    assert result == {1: "the service is down", 2: "built"}
    manifest = store.manifest(1)
    assert manifest is not None
    assert manifest.layer_last_edit == SEPTEMBER


def _places() -> Places:
    place = {
        "kind": "canton",
        "province": "Napo",
        "area_ha": 1.0,
        "bbox": [-77.9, -1.1, -77.8, -1.0],
    }
    source = {"url": "https://example.test/b", "layer_id": 0}
    return Places(
        PlacesSnapshot.model_validate(
            {
                "generated_at": "2026-10-19T00:00:00Z",
                "places": [
                    {
                        **place,
                        "id": "canton:Napo/Tena",
                        "name": "Tena",
                        "source": {**source, "where": "tena"},
                    },
                    {
                        **place,
                        "id": "canton:Napo/Gone",
                        "name": "Gone",
                        "source": {**source, "where": "missing"},
                    },
                ],
            }
        )
    )


async def test_build_places_writes_boundaries_and_figures(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    await build(store, [make(1, OCTOBER)], FakeClient())
    result = await build_places(FakeClient(), store, _places(), [1])
    assert result == {1: "built"}
    boundary = store.boundary("canton:Napo/Tena", "2026-10-19T00:00:00Z")
    assert boundary is not None
    assert store.boundary("canton:Napo/Gone", "2026-10-19T00:00:00Z") is None
    figures = store.figures(1)
    assert figures is not None
    assert figures.layer_last_edit == OCTOBER
    assert figures.places_generated_at == "2026-10-19T00:00:00Z"
    copy = store.layer(1)
    assert copy is not None
    expected = clip_area_by_category(boundary, copy.pieces_in(boundary))
    assert figures.hectares == {"canton:Napo/Tena": expected}
    assert set(expected) == {"Bosque", "Páramo"}


async def test_build_places_reports_a_layer_without_a_copy(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    result = await build_places(FakeClient(), store, _places(), [9])
    assert result == {9: "no copy"}


async def test_a_layer_with_projected_coordinates_fails_and_keeps_its_copy(
    tmp_path: Path,
) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(1, SEPTEMBER), [])
    projected = [("Alta", box(-8_800_000.0, -500_000.0, -8_700_000.0, 70_000.0))]
    result = await build(store, [make(1, OCTOBER)], FakeClient(features=projected))
    assert "outside longitude/latitude range" in result[1]
    manifest = store.manifest(1)
    assert manifest is not None
    assert manifest.layer_last_edit == SEPTEMBER
