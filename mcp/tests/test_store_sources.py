from datetime import UTC, datetime
from pathlib import Path

import pytest
from shapely.geometry import MultiPolygon, Polygon, box
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import Feature
from mcp_server.catalogue.models import Layer
from mcp_server.store.files import LayerStore
from mcp_server.store.models import LayerManifest, PlaceFigures
from mcp_server.store.sources import (
    ArcGISSource,
    AreaRequest,
    LocalCopySource,
    Measurement,
    PrecomputedSource,
    SourceName,
    SourceSelector,
)
from mcp_server.store.split import split_by_grid
from tests.test_models import indicator

pytestmark = pytest.mark.anyio

SEPTEMBER = datetime(2026, 9, 1, tzinfo=UTC)
OCTOBER = datetime(2026, 10, 1, tzinfo=UTC)
LAYER = Layer(service_url="https://example.test/x", layer_id=0, category_field="c")
AOI = box(-77.9, -1.1, -77.8, -1.0)
FEATURES: list[Feature] = [
    ("Bosque", box(-78.0, -1.2, -77.85, 0.0)),
    ("Páramo", box(-77.85, -1.2, -77.0, 0.0)),
]


class FakeClient:
    def __init__(self, features: list[Feature]) -> None:
        self._features = features

    async def features(
        self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
    ) -> list[Feature]:
        return self._features


class Fixed:
    def __init__(self, name: SourceName, answer: Measurement | None) -> None:
        self.name = name
        self._answer = answer

    async def measure(self, request: AreaRequest) -> Measurement | None:
        return self._answer


def _request(
    edit: datetime | None = OCTOBER,
    *,
    aoi: Polygon | MultiPolygon = AOI,
    place_id: str | None = None,
    with_shapes: bool = False,
) -> AreaRequest:
    ind = indicator(
        {"sync_status": "ok", "queryable_fields": ["c"], "layer_last_edit": edit}
    )
    return AreaRequest(ind, LAYER, aoi, place_id, with_shapes)


def _answer(source: SourceName) -> Measurement:
    return Measurement({"a": 1.0}, [], 0, 0, source, None)


def _manifest(edit: datetime | None, pieces: int = 1) -> LayerManifest:
    return LayerManifest(
        indicator_id=210,
        layer_last_edit=edit,
        simplification=0.001,
        cell_deg=0.1,
        features=pieces,
        pieces=pieces,
        built_at=OCTOBER,
    )


def _figures(edit: datetime | None = OCTOBER, generated_at: str = "g1") -> PlaceFigures:
    return PlaceFigures(
        indicator_id=210,
        layer_last_edit=edit,
        places_generated_at=generated_at,
        hectares={"ec-1": {"Bosque": 12.5}},
    )


async def test_selector_uses_the_first_source_that_answers() -> None:
    selector = SourceSelector(
        [
            Fixed("precomputed", None),
            Fixed("local_copy", _answer("local_copy")),
            Fixed("arcgis", _answer("arcgis")),
        ]
    )
    assert (await selector.measure(_request())).source == "local_copy"


async def test_selector_raises_when_no_source_answers() -> None:
    selector = SourceSelector([Fixed("precomputed", None), Fixed("local_copy", None)])
    with pytest.raises(RuntimeError):
        await selector.measure(_request())


async def test_local_copy_steps_aside_when_its_version_is_not_the_catalogue_s(
    tmp_path: Path,
) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(SEPTEMBER), [("Bosque", box(-78, -2, -77, 0))])
    assert await LocalCopySource(store).measure(_request(OCTOBER)) is None


async def test_local_copy_steps_aside_when_there_is_no_copy(tmp_path: Path) -> None:
    assert await LocalCopySource(LayerStore(tmp_path)).measure(_request()) is None


async def test_local_copy_with_no_edit_date_matches_only_a_catalogue_without_one(
    tmp_path: Path,
) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(None), [("Bosque", box(-78, -2, -77, 0))])
    source = LocalCopySource(store)
    assert await source.measure(_request(OCTOBER)) is None
    assert await source.measure(_request(None)) is not None


async def test_local_copy_matches_the_live_path_on_the_same_features(
    tmp_path: Path,
) -> None:
    pieces = split_by_grid(FEATURES, 0.1)
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(OCTOBER, len(pieces)), pieces)

    live = await ArcGISSource(FakeClient(FEATURES), 0.001).measure(_request())
    copy = await LocalCopySource(store).measure(_request())

    assert live is not None and copy is not None
    assert copy.source == "local_copy" and live.source == "arcgis"
    assert copy.hectares.keys() == live.hectares.keys() == {"Bosque", "Páramo"}
    for category, ha in live.hectares.items():
        assert copy.hectares[category] == pytest.approx(ha, rel=1e-5)
    assert copy.vertices_received == 0
    assert live.features == 2 and live.vertices_received > 0
    assert copy.layer_version == OCTOBER
    # Only a copy has a version; the live layer is whatever ArcGIS holds now.
    assert live.layer_version is None


async def test_local_copy_can_return_shapes(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(OCTOBER), [("Bosque", box(-78, -2, -77, 0))])
    measured = await LocalCopySource(store).measure(_request(with_shapes=True))
    assert measured is not None
    assert [s["properties"]["category"] for s in measured.shapes] == ["Bosque"]


async def test_local_copy_outside_every_piece_is_empty(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(OCTOBER), [("Bosque", box(10, 10, 11, 11))])

    measured = await LocalCopySource(store).measure(_request())

    assert measured is not None
    assert measured.hectares == {}
    assert measured.source == "local_copy"
    assert measured.features == 0


async def test_precomputed_needs_a_place_and_no_shapes(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    store.write_figures(_figures())
    source = PrecomputedSource(store, "g1")

    assert await source.measure(_request(place_id=None)) is None
    assert await source.measure(_request(place_id="ec-1", with_shapes=True)) is None
    assert await source.measure(_request(place_id="ec-2")) is None
    measured = await source.measure(_request(place_id="ec-1"))

    assert measured is not None
    assert measured.hectares == {"Bosque": 12.5}
    assert measured.source == "precomputed"
    assert (measured.features, measured.shapes, measured.vertices_received) == (
        0,
        [],
        0,
    )


async def test_precomputed_steps_aside_on_a_new_places_snapshot(
    tmp_path: Path,
) -> None:
    store = LayerStore(tmp_path)
    store.write_figures(_figures())
    assert (
        await PrecomputedSource(store, "g2").measure(_request(place_id="ec-1")) is None
    )


async def test_precomputed_steps_aside_on_a_new_layer_version(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    store.write_figures(_figures(SEPTEMBER))
    assert (
        await PrecomputedSource(store, "g1").measure(_request(place_id="ec-1")) is None
    )
    assert (
        await PrecomputedSource(LayerStore(tmp_path / "none"), "g1").measure(
            _request(place_id="ec-1")
        )
        is None
    )
