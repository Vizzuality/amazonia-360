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
    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.calls: list[str] = []

    async def count(self, layer: Layer, aoi: BaseGeometry) -> int:
        self.calls.append("count")
        return 3

    async def distinct(self, layer: Layer, aoi: BaseGeometry) -> list[str]:
        self.calls.append("distinct")
        if self.fail:
            raise ArcGISError("ArcGIS did not respond in time: x")
        return ["Bosque", "Páramo"]

    async def features(
        self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
    ) -> list[Feature]:
        self.calls.append("features")
        return [("Bosque", box(-79.0, -2.0, -77.0, 0.0))]


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
    assert "Written by a person." in result.caveats
    assert any("7 records" in c and "has 3" in c for c in result.caveats)


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
async def test_provisional_boundary_caveat_travels_even_when_inside() -> None:
    result = await handlers().categories_in_area(210, TENA)
    assert result.coverage.status == "inside"
    assert any("provisional" in c for c in result.caveats)


@pytest.mark.anyio
async def test_partial_coverage_adds_a_caveat() -> None:
    straddling = {
        "type": "Polygon",
        "coordinates": [
            [[-79.6, -1.0], [-79.2, -1.0], [-79.2, -0.6], [-79.6, -0.6], [-79.6, -1.0]]
        ],
    }
    result = await handlers().categories_in_area(210, straddling)
    assert result.coverage.status == "partial"
    assert any("partly outside" in c for c in result.caveats)
    assert any("aoi_ha counts the whole area" in c for c in result.caveats)
    assert any("provisional" in c for c in result.caveats)


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
