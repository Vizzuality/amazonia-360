import asyncio
import time
from itertools import pairwise
from typing import Any

import pytest
from shapely.geometry import box
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError, Feature
from mcp_server.catalogue.models import IndicatorMetadata, Layer
from mcp_server.geometry.area import geodesic_area_ha
from mcp_server.handlers import area as area_handlers_module
from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.errors import HandlerError
from tests.test_models import indicator

pytestmark = pytest.mark.usefixtures("fixed_catalogue")

TENA: dict[str, Any] = {
    "type": "Polygon",
    "coordinates": [
        [[-77.9, -1.1], [-77.8, -1.1], [-77.8, -1.0], [-77.9, -1.0], [-77.9, -1.1]]
    ],
}
LIMA: dict[str, Any] = {
    "type": "Polygon",
    "coordinates": [
        [[-77.1, -12.1], [-77.0, -12.1], [-77.0, -12.0], [-77.1, -12.0], [-77.1, -12.1]]
    ],
}


class FakeClient:
    def __init__(self, *, fail: bool = False, empty: bool = False) -> None:
        self.fail = fail
        self.empty = empty
        self.calls: list[str] = []

    async def count(self, layer: Layer, aoi: BaseGeometry) -> int:
        self.calls.append("count")
        return 3

    async def distinct(self, layer: Layer, aoi: BaseGeometry) -> list[str]:
        self.calls.append("distinct")
        if self.fail:
            raise ArcGISError("ArcGIS did not respond in time: x")
        return [] if self.empty else ["Bosque", "Páramo"]

    async def features(
        self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
    ) -> list[Feature]:
        self.calls.append("features")
        return [] if self.empty else [("Bosque", box(-79.0, -2.0, -77.0, 0.0))]

    async def renderer(self, layer: Layer) -> dict[str, Any] | None:
        self.calls.append("renderer")
        if self.fail:
            raise ArcGISError("ArcGIS did not respond in time: x")
        return {
            "type": "uniqueValue",
            "field1": layer.category_field,
            "uniqueValueInfos": [
                {
                    "value": "Bosque",
                    "label": "Bosque",
                    "symbol": {"color": [0, 100, 0, 255]},
                }
            ],
        }

    async def value_pairs(
        self, layer: Layer, aoi: BaseGeometry, field: str
    ) -> dict[str, set[str]]:
        self.calls.append("value_pairs")
        return {}


def handlers(client: FakeClient | None = None) -> AreaHandlers:
    return AreaHandlers(client or FakeClient())  # type: ignore[arg-type]


@pytest.mark.anyio
async def test_categories_in_area() -> None:
    result = await handlers().categories_in_area(210, TENA)
    assert result.value == ["Bosque", "Páramo"]
    assert result.computed_over.type == "feature_attributes"
    # A distinct-values query does not say how many polygons it read.
    assert result.computed_over.features is None
    assert result.computed_over.categories == 2
    assert result.coverage.status == "inside"
    assert result.timing.vertices_sent == 5


@pytest.mark.anyio
async def test_clipping_does_not_block_other_calls(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def slow_clip(
        aoi: BaseGeometry, features: list[Feature]
    ) -> dict[str, list[BaseGeometry]]:
        time.sleep(0.3)
        return {"Bosque": [box(-77.9, -1.1, -77.8, -1.0)]}

    monkeypatch.setattr(area_handlers_module, "clip_by_category", slow_clip)
    stamps: list[float] = []

    async def tick() -> None:
        for _ in range(50):
            stamps.append(time.perf_counter())
            await asyncio.sleep(0.01)

    ticker = asyncio.create_task(tick())
    await asyncio.sleep(0.02)
    result = await handlers().area_by_category(210, TENA)
    await ticker
    gaps = [b - a for a, b in pairwise(stamps)]
    assert max(gaps) < 0.15
    assert result.timing.clip_ms >= 300


@pytest.mark.anyio
async def test_count_in_area() -> None:
    result = await handlers().count_in_area(202, TENA)
    assert result.value == 3
    assert result.computed_over.type == "feature_count"
    assert result.unit == "restoration actions"


@pytest.mark.anyio
async def test_area_by_category_is_clipped_not_whole_polygons() -> None:
    result = await handlers().area_by_category(210, TENA)
    assert isinstance(result.value, dict)
    aoi_ha = geodesic_area_ha(box(-77.9, -1.1, -77.8, -1.0))
    assert result.value["Bosque"] == pytest.approx(aoi_ha, rel=1e-6)
    assert result.computed_over.type == "clipped_polygons"
    assert result.computed_over.simplification == 0.001
    assert result.timing.vertices_received > 0


def serve(monkeypatch: pytest.MonkeyPatch, indicator: IndicatorMetadata) -> None:
    monkeypatch.setattr(
        area_handlers_module, "get_indicator_metadata", lambda _id: indicator
    )


@pytest.mark.anyio
async def test_known_defects_travel_with_the_result(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    serve(
        monkeypatch,
        indicator(
            caveats=[{"text": "Written by a person."}],
            documented_count=7,
            sync={
                "sync_status": "ok",
                "queryable_fields": ["Ecosistema"],
                "published_count": 3,
            },
        ),
    )
    result = await handlers().categories_in_area(210, TENA)
    # Caveats carry only what a person wrote; the count check is its own field.
    assert result.caveats == ["Written by a person."]
    assert result.record_counts is not None
    assert (result.record_counts.documented, result.record_counts.published) == (7, 3)


@pytest.mark.anyio
async def test_an_unavailable_layer_is_refused_before_any_network_call(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    serve(monkeypatch, indicator(sync={"sync_status": "error"}))
    client = FakeClient()
    with pytest.raises(HandlerError, match="not available: sync status is error"):
        await handlers(client).categories_in_area(210, TENA)
    assert client.calls == []


@pytest.mark.anyio
async def test_computed_facts_are_fields_not_caveats() -> None:
    result = await handlers().categories_in_area(210, TENA)
    assert result.coverage.status == "inside"
    assert result.coverage.boundary == "bounding_box"
    assert result.caveats == []
    assert result.record_counts is None


@pytest.mark.anyio
async def test_partial_coverage_is_reported_in_the_coverage_field() -> None:
    straddling = {
        "type": "Polygon",
        "coordinates": [
            [[-79.6, -1.0], [-79.2, -1.0], [-79.2, -0.6], [-79.6, -0.6], [-79.6, -1.0]]
        ],
    }
    result = await handlers().categories_in_area(210, straddling)
    assert result.coverage.status == "partial"
    assert result.caveats == []


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("call", "indicator_id", "area", "message"),
    [
        ("categories_in_area", 999, TENA, "Unknown indicator"),
        ("area_by_category", 202, TENA, "does not support area"),
        ("count_in_area", 210, TENA, "does not support count"),
        ("categories_in_area", 210, LIMA, "outside the Ecuador module"),
        (
            "categories_in_area",
            210,
            {"type": "Point", "coordinates": [0, 0]},
            "Polygon",
        ),
    ],
)
async def test_refusals_happen_before_any_network_call(
    call: str, indicator_id: int, area: dict[str, Any], message: str
) -> None:
    client = FakeClient()
    with pytest.raises(HandlerError, match=message):
        await getattr(handlers(client), call)(indicator_id, area)
    assert client.calls == []


@pytest.mark.anyio
async def test_an_arcgis_failure_is_an_error_not_an_empty_result() -> None:
    with pytest.raises(HandlerError, match="did not respond"):
        await handlers(FakeClient(fail=True)).categories_in_area(210, TENA)


@pytest.mark.anyio
async def test_ai_answerable_false_is_a_refusal(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    serve(monkeypatch, indicator(ai_answerable=False))
    client = FakeClient()
    with pytest.raises(HandlerError, match="not cleared"):
        await handlers(client).categories_in_area(210, TENA)
    assert client.calls == []


def _with(monkeypatch: pytest.MonkeyPatch, **overrides: Any) -> None:
    layer = indicator(**overrides)
    monkeypatch.setattr(area_handlers_module, "get_indicator_metadata", lambda _: layer)


@pytest.mark.anyio
async def test_empty_on_a_partial_layer_means_nothing_is_mapped_here(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _with(monkeypatch, covers_module=False)
    result = await handlers(FakeClient(empty=True)).categories_in_area(210, TENA)
    assert result.value == []
    assert result.layer.covers_module is False
    assert result.layer.empty_result == "not_mapped_here"
    assert result.caveats == []


@pytest.mark.anyio
async def test_empty_on_a_layer_that_covers_the_module_is_unexpected(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _with(monkeypatch, covers_module=True)
    result = await handlers(FakeClient(empty=True)).area_by_category(210, TENA)
    assert result.value == {}
    assert result.layer.empty_result == "unexpected"


@pytest.mark.anyio
async def test_area_results_give_unclassified_hectares_as_a_number(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _with(monkeypatch, covers_module=False)
    result = await handlers(FakeClient(empty=True)).area_by_category(210, TENA)
    assert result.classified_ha == 0
    assert result.unclassified_ha == result.aoi_ha


@pytest.mark.anyio
async def test_classified_and_unclassified_add_up_to_the_area() -> None:
    result = await handlers().area_by_category(210, TENA)
    assert result.classified_ha is not None
    assert result.unclassified_ha is not None
    assert result.classified_ha + result.unclassified_ha == pytest.approx(
        result.aoi_ha, abs=0.02
    )
    assert result.layer.empty_result is None


@pytest.mark.anyio
async def test_nothing_is_said_about_emptiness_when_the_catalogue_does_not_know(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _with(monkeypatch)
    result = await handlers(FakeClient(empty=True)).categories_in_area(210, TENA)
    assert result.layer.covers_module is None
    assert result.layer.empty_result is None


@pytest.mark.anyio
async def test_presence_and_count_results_carry_no_hectare_split() -> None:
    result = await handlers().categories_in_area(210, TENA)
    assert result.classified_ha is None
    assert result.unclassified_ha is None


@pytest.mark.anyio
async def test_the_map_comes_from_the_same_query_as_the_figures() -> None:
    client = FakeClient()
    h = handlers(client)
    result, drawn = await h.area_by_category_map(210, TENA)
    plain = await h.area_by_category(210, TENA)
    assert result.value == plain.value
    assert client.calls.count("features") == 2
    # Fetched once, then kept: renderers change with a republish, not between calls.
    assert client.calls.count("renderer") == 1
    (shape,) = drawn.shapes["features"]
    assert shape["properties"] == {"category": "Bosque"}
    assert shape["geometry"]["type"] == "Polygon"
    assert drawn.styles["Bosque"]["swatch"] == "#006400"
    assert drawn.styles["Bosque"]["from_layer"] is True


@pytest.mark.anyio
async def test_a_map_without_the_renderer_falls_back_to_the_palette() -> None:
    class NoRenderer(FakeClient):
        async def renderer(self, layer: Layer) -> dict[str, Any] | None:
            raise ArcGISError("ArcGIS did not respond in time: x")

    result, drawn = await handlers(NoRenderer()).area_by_category_map(210, TENA)
    assert result.value
    assert drawn.styles["Bosque"]["from_layer"] is False
