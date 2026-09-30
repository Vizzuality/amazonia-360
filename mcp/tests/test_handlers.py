import threading
from typing import Any

import pytest
from shapely.geometry import box, shape
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError, Feature
from mcp_server.catalogue.models import IndicatorMetadata, Layer
from mcp_server.geometry.area import geodesic_area_ha
from mcp_server.handlers import area as area_handlers_module
from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.errors import HandlerError
from tests.test_models import indicator

pytestmark = pytest.mark.usefixtures("fixed_catalogue", "stand_in_module")

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

    async def boundary(self, url: str, layer_id: int, where: str) -> list[BaseGeometry]:
        self.calls.append("boundary")
        return [] if self.empty else [box(-77.9, -1.1, -77.8, -1.0)]

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

    async def histogram(
        self, url: str, aoi: BaseGeometry, rendering_rule: dict[str, Any] | None
    ) -> dict[str, Any]:
        self.calls.append("histogram")
        if rendering_rule is None:
            # The stored values: 400 pixels with data, 20 of them in no class.
            return {"size": 256, "min": 0.0, "max": 60.0, "counts": [400] + [0] * 255}
        counts = [0, 0, 0, 0, 0, 0] if self.empty else [0, 0, 80, 100, 200, 0]
        return {"size": 6, "min": -0.5, "max": 5.5, "counts": counts}

    async def export_image(self, url: str, params: dict[str, str]) -> bytes:
        self.calls.append("export_image")
        return b"\x89PNG"


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
    # Computed facts are fields; caveats carry only what a person wrote.
    assert result.caveats == []
    assert result.record_counts is None


@pytest.mark.anyio
async def test_clipping_runs_off_the_event_loop(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Seconds of GEOS work on the loop's thread would stall every other call.
    clip = area_handlers_module.clip_by_category
    threads: list[int] = []

    def recording_clip(
        aoi: BaseGeometry, features: list[Feature]
    ) -> dict[str, list[BaseGeometry]]:
        threads.append(threading.get_ident())
        return clip(aoi, features)

    monkeypatch.setattr(area_handlers_module, "clip_by_category", recording_clip)
    await handlers().area_by_category(210, TENA)
    assert threads and threads[0] != threading.get_ident()


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


# West of the stand-in outline's edge at -79.428 by 0.172 of its 0.4 degrees.
STRADDLING: dict[str, Any] = {
    "type": "Polygon",
    "coordinates": [
        [[-79.6, -1.0], [-79.2, -1.0], [-79.2, -0.6], [-79.6, -0.6], [-79.6, -1.0]]
    ],
}


class WallToWall(FakeClient):
    async def features(
        self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
    ) -> list[Feature]:
        return [("Bosque", box(-79.428, -5.016, -75.189, 0.729))]


@pytest.mark.anyio
async def test_unclassified_hectares_leave_out_the_part_outside_the_module() -> None:
    result = await handlers(WallToWall()).area_by_category(210, STRADDLING)
    assert result.coverage.status == "partial"
    outside = result.coverage.outside_ha
    assert outside == pytest.approx(
        geodesic_area_ha(box(-79.6, -1.0, -79.428, -0.6)), abs=0.01
    )
    # The layer covers every hectare inside the module, so none is unclassified.
    # Geodesic areas of the pieces add up to the whole to within a few millionths:
    # splitting a long edge moves it slightly.
    assert result.classified_ha == pytest.approx(result.aoi_ha - outside, rel=1e-5)
    assert result.unclassified_ha == pytest.approx(0, abs=1)


@pytest.mark.anyio
async def test_unclassified_hectares_are_the_part_inside_in_no_class(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _with(monkeypatch, covers_module=False)
    result = await handlers(FakeClient(empty=True)).area_by_category(210, STRADDLING)
    assert result.classified_ha == 0
    unclassified = result.unclassified_ha
    assert unclassified is not None
    assert unclassified == pytest.approx(
        result.aoi_ha - result.coverage.outside_ha, abs=0.02
    )
    assert 0 < unclassified < result.aoi_ha


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
    # One query per answer: the map comes from the query the figures come from.
    assert client.calls.count("features") == 2
    await h.area_by_category_map(210, TENA)
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
    assert isinstance(result.value, dict) and set(result.value) == {"Bosque"}
    assert drawn.styles["Bosque"]["from_layer"] is False


@pytest.mark.anyio
async def test_class_shares_count_every_pixel_with_data() -> None:
    client = FakeClient()
    result = await handlers(client).class_shares(129, TENA)
    assert result.value == {"Medium": 0.2, "Medium-High": 0.25, "High": 0.5}
    assert result.unclassified_share == 0.05
    assert result.unit == "share of pixels"
    assert result.classified_ha is None
    assert result.computed_over.type == "raster_pixels"
    assert result.computed_over.pixels == 400
    assert result.computed_over.pixel_size_deg == 0.009
    assert "export_image" not in client.calls


@pytest.mark.anyio
async def test_the_raster_map_comes_with_its_image_and_legend() -> None:
    result, drawn = await handlers().class_shares_map(129, TENA)
    assert isinstance(result.value, dict) and result.value["High"] == 0.5
    assert drawn.name == "Canopy height"
    assert drawn.image.startswith("data:image/png;base64,")
    assert drawn.classes[0]["label"] == "Low"
    assert len(drawn.corners) == 4


@pytest.mark.anyio
async def test_a_feature_layer_is_not_asked_for_class_shares() -> None:
    with pytest.raises(HandlerError, match="does not support class_share"):
        await handlers().class_shares(210, TENA)


@pytest.mark.anyio
async def test_a_raster_is_not_asked_for_hectares() -> None:
    with pytest.raises(HandlerError, match="does not support area"):
        await handlers().area_by_category(129, TENA)


@pytest.mark.anyio
async def test_a_raster_with_data_but_no_class_is_not_an_unexpected_empty() -> None:
    result = await handlers(FakeClient(empty=True)).class_shares(129, TENA)
    assert result.value == {}
    assert result.unclassified_share == 1.0
    assert result.layer.empty_result is None


class ByRegion(FakeClient):
    """A layer coloured by a coarser field than its classes, as 219 is."""

    def __init__(self, *, pairs_fail: bool = False) -> None:
        super().__init__()
        self.pairs_fail = pairs_fail

    async def renderer(self, layer: Layer) -> dict[str, Any] | None:
        self.calls.append("renderer")
        return {
            "type": "uniqueValue",
            "field1": "Region",
            "uniqueValueInfos": [
                {"value": "Norte", "label": "North", "symbol": {"color": [1, 2, 3]}}
            ],
        }

    async def value_pairs(
        self, layer: Layer, aoi: BaseGeometry, field: str
    ) -> dict[str, set[str]]:
        self.calls.append("value_pairs")
        if self.pairs_fail:
            raise ArcGISError("ArcGIS did not respond in time: x")
        assert field == "Region"
        return {"Bosque": {"Norte"}}


@pytest.mark.anyio
async def test_a_class_takes_the_colour_of_its_region_read_from_the_layer() -> None:
    client = ByRegion()
    _, drawn = await handlers(client).area_by_category_map(210, TENA)
    assert "value_pairs" in client.calls
    assert drawn.styles["Bosque"]["swatch"] == "#010203"


@pytest.mark.anyio
async def test_the_map_survives_the_region_query_failing() -> None:
    _, drawn = await handlers(ByRegion(pairs_fail=True)).area_by_category_map(210, TENA)
    assert drawn.styles["Bosque"]["from_layer"] is False


class Pixels(FakeClient):
    """Histograms given by the test: pixels per class value, and all pixels."""

    def __init__(self, by_value: dict[int, int], stored: int) -> None:
        super().__init__()
        self.by_value = by_value
        self.stored = stored

    async def histogram(
        self, url: str, aoi: BaseGeometry, rendering_rule: dict[str, Any] | None
    ) -> dict[str, Any]:
        if not self.stored:
            return {"min": 0.0, "max": 0.0, "size": 0, "counts": []}
        if rendering_rule is None:
            return {"size": 1, "min": 0.0, "max": 1.0, "counts": [self.stored]}
        counts = [self.by_value.get(v, 0) for v in range(6)]
        return {"size": 6, "min": -0.5, "max": 5.5, "counts": counts}


@pytest.mark.anyio
async def test_a_class_of_a_few_pixels_is_not_rounded_away() -> None:
    result = await handlers(Pixels({1: 2_000_000, 5: 50}, 2_000_050)).class_shares(
        129, TENA
    )
    assert isinstance(result.value, dict)
    assert result.value["Very High"] > 0


@pytest.mark.anyio
async def test_a_histogram_that_is_not_one_bin_per_class_names_the_raster() -> None:
    class FractionalBins(FakeClient):
        async def histogram(
            self, url: str, aoi: BaseGeometry, rendering_rule: dict[str, Any] | None
        ) -> dict[str, Any]:
            return {"size": 256, "min": 1, "max": 5, "counts": [29] + [0] * 255}

    with pytest.raises(HandlerError, match=r"one histogram bin.*Canopy/ImageServer"):
        await handlers(FractionalBins()).class_shares(129, TENA)


@pytest.mark.anyio
async def test_an_area_smaller_than_a_pixel_says_so() -> None:
    # 0.001 degrees against the fixture's 0.009 degree pixels.
    tiny = {
        "type": "Polygon",
        "coordinates": [
            [
                [-77.9, -1.1],
                [-77.899, -1.1],
                [-77.899, -1.099],
                [-77.9, -1.099],
                [-77.9, -1.1],
            ]
        ],
    }
    with pytest.raises(HandlerError, match="smaller than one pixel"):
        await handlers(Pixels({}, 0)).class_shares(129, tiny)


from mcp_server.places import Places  # noqa: E402
from tests.test_places import SNAPSHOT  # noqa: E402


def with_places(client: FakeClient | None = None) -> AreaHandlers:
    return AreaHandlers(client or FakeClient(), places=Places(SNAPSHOT))  # type: ignore[arg-type]


@pytest.mark.anyio
async def test_a_place_gives_the_same_hectares_as_its_polygon() -> None:
    handlers = with_places()
    by_area = await handlers.area_by_category(210, TENA)
    by_place = await handlers.area_by_category(210, place_id="canton:Napo/Tena")
    assert by_place.value == by_area.value
    assert by_place.aoi_ha == by_area.aoi_ha
    assert by_place.place is not None
    assert by_place.place.id == "canton:Napo/Tena"
    assert by_place.place.kind == "canton"
    assert by_area.place is None


@pytest.mark.anyio
async def test_every_handler_takes_a_place() -> None:
    handlers = with_places()
    place = "canton:Napo/Tena"
    assert (await handlers.categories_in_area(210, place_id=place)).place is not None
    assert (await handlers.count_in_area(202, place_id=place)).place is not None
    assert (await handlers.class_shares(129, place_id=place)).place is not None
    result, drawn = await handlers.area_by_category_map(210, place_id=place)
    assert result.place is not None and drawn.area["type"] == "Polygon"
    result, raster = await handlers.class_shares_map(129, place_id=place)
    assert result.place is not None and raster.area["type"] == "Polygon"


@pytest.mark.anyio
async def test_the_map_carries_the_area_it_was_computed_over() -> None:
    _, drawn = await with_places().area_by_category_map(210, TENA)
    assert shape(drawn.area).equals(shape(TENA))


@pytest.mark.anyio
async def test_both_area_and_place_are_refused() -> None:
    with pytest.raises(HandlerError, match="not both"):
        await with_places().area_by_category(210, TENA, place_id="canton:Napo/Tena")


@pytest.mark.anyio
async def test_neither_area_nor_place_is_refused() -> None:
    with pytest.raises(HandlerError, match="find_places"):
        await with_places().area_by_category(210)


@pytest.mark.anyio
async def test_an_unknown_place_says_to_search_again() -> None:
    with pytest.raises(HandlerError, match="find_places"):
        await with_places().area_by_category(210, place_id="canton:Napo/Nowhere")


@pytest.mark.anyio
async def test_a_place_is_not_held_to_the_client_vertex_limit() -> None:
    from shapely.geometry import Point

    dense = Point(-77.85, -1.05).buffer(0.04, quad_segs=2000)

    class Dense(FakeClient):
        async def boundary(
            self, url: str, layer_id: int, where: str
        ) -> list[BaseGeometry]:
            return [dense]

    result = await with_places(Dense()).count_in_area(202, place_id="canton:Napo/Tena")
    assert result.timing.vertices_sent > 5000


@pytest.mark.anyio
async def test_a_place_is_not_held_to_the_reach_limit() -> None:
    class Loja(FakeClient):
        async def boundary(
            self, url: str, layer_id: int, where: str
        ) -> list[BaseGeometry]:
            return [box(-80.49, -4.5, -79.0, -3.5)]

    result = await with_places(Loja()).count_in_area(202, place_id="canton:Napo/Tena")
    assert result.coverage.status == "partial"


@pytest.mark.anyio
async def test_a_boundary_that_fails_the_area_checks_names_the_place() -> None:
    class Projected(FakeClient):
        async def boundary(
            self, url: str, layer_id: int, where: str
        ) -> list[BaseGeometry]:
            return [box(800_000, 9_800_000, 810_000, 9_810_000)]

    handlers = with_places(Projected())
    with pytest.raises(HandlerError, match="The boundary of canton:Napo/Tena"):
        await handlers.count_in_area(202, place_id="canton:Napo/Tena")


@pytest.mark.anyio
async def test_the_map_outline_of_a_dense_place_is_simplified() -> None:
    from shapely import get_num_coordinates
    from shapely.geometry import Point, shape

    dense = Point(-77.85, -1.05).buffer(0.04, quad_segs=2000)

    class Dense(FakeClient):
        async def boundary(
            self, url: str, layer_id: int, where: str
        ) -> list[BaseGeometry]:
            return [dense]

    handlers = with_places(Dense())
    place = "canton:Napo/Tena"
    result, drawn = await handlers.area_by_category_map(210, place_id=place)
    _, raster = await handlers.class_shares_map(129, place_id=place)
    for outline in (drawn.area, raster.area):
        assert outline["type"] in ("Polygon", "MultiPolygon")
        assert get_num_coordinates(shape(outline)) < result.timing.vertices_sent
    # The figures are still computed over the full boundary.
    assert result.timing.vertices_sent == get_num_coordinates(dense)


@pytest.mark.anyio
async def test_classes_that_add_up_to_more_than_the_area_are_flagged() -> None:
    class Overlapping(FakeClient):
        async def features(
            self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
        ) -> list[Feature]:
            return [
                ("Bosque", box(-79.0, -2.0, -77.0, 0.0)),
                ("Páramo", box(-79.0, -2.0, -77.0, 0.0)),
            ]

    result = await handlers(Overlapping()).area_by_category(210, TENA)
    assert result.overlap_ha == pytest.approx(result.aoi_ha, rel=1e-3)
    assert result.unclassified_ha == 0


@pytest.mark.anyio
async def test_classes_within_the_area_are_not_flagged() -> None:
    result = await handlers().area_by_category(210, TENA)
    assert result.overlap_ha is None


def _overlapping_by(width_deg: float) -> FakeClient:
    """Two classes that split TENA and overlap on a strip width_deg wide."""

    class Overlapping(FakeClient):
        async def features(
            self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
        ) -> list[Feature]:
            return [
                ("Bosque", box(-77.9, -1.1, -77.85 + width_deg, -1.0)),
                ("Páramo", box(-77.85, -1.1, -77.8, -1.0)),
            ]

    return Overlapping()


@pytest.mark.anyio
async def test_an_overlap_under_the_threshold_is_not_flagged() -> None:
    # 0.1 % of TENA's 12,300 ha is 12.3 ha. A strip 0.00005 degrees wide is about
    # 6 ha, the size of what the simplification alone adds; 0.0002 is about 25 ha.
    small = await handlers(_overlapping_by(0.00005)).area_by_category(210, TENA)
    assert small.overlap_ha is None
    large = await handlers(_overlapping_by(0.0002)).area_by_category(210, TENA)
    assert large.overlap_ha == pytest.approx(
        geodesic_area_ha(box(-77.85, -1.1, -77.8498, -1.0)), rel=1e-2
    )


@pytest.mark.anyio
async def test_pixel_shares_say_they_are_not_hectares() -> None:
    result = await handlers().class_shares(129, TENA)
    assert result.computed_over.to_hectares == "do_not_convert"
    by_area = await handlers().area_by_category(210, TENA)
    assert by_area.computed_over.to_hectares is None
