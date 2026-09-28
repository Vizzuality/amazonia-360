import json
from collections.abc import Callable
from urllib.parse import parse_qs

import httpx
import pytest
from shapely.geometry import box

from mcp_server.arcgis.client import ArcGISClient, ArcGISError
from mcp_server.catalogue.models import Layer

LAYER = Layer(
    service_url="https://example.test/arcgis/rest/services/eco/FeatureServer",
    layer_id=0,
    category_field="Ecosistema",
)
AOI = box(-77.9, -1.1, -77.7, -0.9)

Handler = Callable[[httpx.Request], httpx.Response]


def client_with(handler: Handler) -> ArcGISClient:
    return ArcGISClient(httpx.AsyncClient(transport=httpx.MockTransport(handler)))


def params(request: httpx.Request) -> dict[str, str]:
    # The client sends form-encoded POSTs, so the parameters are in the body.
    return {k: v[0] for k, v in parse_qs(request.content.decode()).items()}


def square_feature(category: str, x: float) -> dict:
    ring = [[x, -1.0], [x + 0.1, -1.0], [x + 0.1, -0.9], [x, -0.9], [x, -1.0]]
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [ring]},
        "properties": {"Ecosistema": category},
    }


@pytest.mark.anyio
async def test_count_sends_an_intersects_query_in_wgs84() -> None:
    seen: list[dict[str, str]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(params(request))
        return httpx.Response(200, json={"count": 2})

    assert await client_with(handler).count(LAYER, AOI) == 2
    sent = seen[0]
    assert sent["returnCountOnly"] == "true"
    assert sent["spatialRel"] == "esriSpatialRelIntersects"
    assert sent["inSR"] == "4326"
    assert json.loads(sent["geometry"])["spatialReference"] == {"wkid": 4326}


@pytest.mark.anyio
async def test_distinct_returns_sorted_values() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert params(request)["returnDistinctValues"] == "true"
        return httpx.Response(
            200,
            json={
                "features": [
                    {"attributes": {"Ecosistema": "Páramo"}},
                    {"attributes": {"Ecosistema": "Bosque"}},
                ]
            },
        )

    assert await client_with(handler).distinct(LAYER, AOI) == ["Bosque", "Páramo"]


@pytest.mark.anyio
async def test_distinct_raises_when_the_list_of_classes_is_truncated() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "features": [{"attributes": {"Ecosistema": "Bosque"}}],
                "exceededTransferLimit": True,
            },
        )

    with pytest.raises(ArcGISError, match="truncated"):
        await client_with(handler).distinct(LAYER, AOI)


@pytest.mark.anyio
async def test_distinct_raises_when_truncated_under_properties() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "features": [{"attributes": {"Ecosistema": "Bosque"}}],
                "properties": {"exceededTransferLimit": True},
            },
        )

    with pytest.raises(ArcGISError, match="truncated"):
        await client_with(handler).distinct(LAYER, AOI)


@pytest.mark.anyio
async def test_features_raises_when_a_page_is_truncated_with_no_features() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "type": "FeatureCollection",
                "features": [],
                "properties": {"exceededTransferLimit": True},
            },
        )

    with pytest.raises(ArcGISError, match="truncated"):
        await client_with(handler).features(LAYER, AOI, 0.001)


@pytest.mark.anyio
async def test_features_skips_null_category_features() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        feature = square_feature("A", -77.9)
        feature["properties"]["Ecosistema"] = None
        return httpx.Response(
            200, json={"type": "FeatureCollection", "features": [feature]}
        )

    features = await client_with(handler).features(LAYER, AOI, 0.001)
    assert features == []


@pytest.mark.anyio
async def test_features_follow_pagination() -> None:
    pages = {
        "0": {
            "type": "FeatureCollection",
            "features": [square_feature("A", -77.9)],
            "properties": {"exceededTransferLimit": True},
        },
        "1": {"type": "FeatureCollection", "features": [square_feature("B", -77.8)]},
    }

    def handler(request: httpx.Request) -> httpx.Response:
        sent = params(request)
        assert sent["f"] == "geojson"
        assert sent["maxAllowableOffset"] == "0.001"
        return httpx.Response(200, json=pages[sent["resultOffset"]])

    features = await client_with(handler).features(LAYER, AOI, 0.001)
    assert [c for c, _ in features] == ["A", "B"]
    assert features[0][1].geom_type == "Polygon"


@pytest.mark.anyio
async def test_an_arcgis_error_body_raises() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, json={"error": {"code": 400, "message": "Invalid query"}}
        )

    with pytest.raises(ArcGISError, match="Invalid query"):
        await client_with(handler).count(LAYER, AOI)


@pytest.mark.anyio
async def test_a_timeout_raises_instead_of_returning_partial_results() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    with pytest.raises(ArcGISError, match="gave up"):
        await client_with(handler).features(LAYER, AOI, 0.001)


@pytest.mark.anyio
async def test_a_gateway_timeout_says_the_service_gave_up_without_the_url() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(504, text="Gateway Timeout")

    with pytest.raises(ArcGISError) as error:
        await client_with(handler).count(LAYER, AOI)
    message = str(error.value)
    assert "gave up after about 60 s" in message
    assert "busy" in message
    assert "example.test" not in message


@pytest.mark.anyio
async def test_our_own_timeout_says_the_same_as_the_gateway_timeout() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    with pytest.raises(ArcGISError, match="busy"):
        await client_with(handler).count(LAYER, AOI)


@pytest.mark.anyio
async def test_other_http_errors_keep_their_status() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="Service Unavailable")

    with pytest.raises(ArcGISError, match="503"):
        await client_with(handler).count(LAYER, AOI)


@pytest.mark.anyio
async def test_non_json_200_response_raises_arcgis_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="<html>oops</html>")

    with pytest.raises(ArcGISError, match="Invalid response"):
        await client_with(handler).count(LAYER, AOI)


@pytest.mark.anyio
async def test_unexpected_response_shape_raises_arcgis_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"unexpected": "shape"})

    with pytest.raises(ArcGISError, match="Invalid response"):
        await client_with(handler).count(LAYER, AOI)


@pytest.mark.anyio
async def test_an_error_body_without_a_message_still_names_code_and_url() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, json={"error": {"code": 500, "message": "", "details": ["busy"]}}
        )

    with pytest.raises(ArcGISError, match=r"500.*busy.*example\.test"):
        await client_with(handler).count(LAYER, AOI)


@pytest.mark.anyio
async def test_the_renderer_comes_from_the_layer_description() -> None:
    renderer = {"type": "uniqueValue", "field1": "Ecosistema", "uniqueValueInfos": []}

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert request.url.path.endswith("/FeatureServer/0")
        return httpx.Response(200, json={"drawingInfo": {"renderer": renderer}})

    assert await client_with(handler).renderer(LAYER) == renderer


@pytest.mark.anyio
async def test_a_layer_without_a_renderer_has_none() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"name": "eco"})

    assert await client_with(handler).renderer(LAYER) is None


@pytest.mark.anyio
async def test_value_pairs_group_the_other_field_by_class() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert params(request)["outFields"] == "Ecosistema,Region"
        rows = [("Bosque", "Andes"), ("Bosque", "Llanura"), ("Pajonal", "Andes")]
        features = [{"attributes": {"Ecosistema": c, "Region": r}} for c, r in rows]
        return httpx.Response(200, json={"features": features})

    pairs = await client_with(handler).value_pairs(LAYER, AOI, "Region")
    assert pairs == {"Bosque": {"Andes", "Llanura"}, "Pajonal": {"Andes"}}


def test_esri_rings_are_clockwise_shells_and_counterclockwise_holes() -> None:
    from shapely.geometry import MultiPolygon, Polygon
    from shapely.geometry.polygon import LinearRing

    from mcp_server.arcgis.client import esri_polygon

    shell = [(0, 0), (0, 2), (2, 2), (2, 0), (0, 0)]
    hole = [(0.5, 0.5), (0.5, 1.5), (1.5, 1.5), (1.5, 0.5), (0.5, 0.5)]
    other = [(3, 0), (4, 0), (4, 1), (3, 1), (3, 0)]
    geom = MultiPolygon([Polygon(shell, [hole]), Polygon(other)])
    rings = json.loads(esri_polygon(geom))["rings"]
    assert len(rings) == 3
    # Esri reads a clockwise ring as a shell and a counterclockwise one as a hole.
    assert [LinearRing(r).is_ccw for r in rings] == [False, True, False]


@pytest.mark.anyio
async def test_features_stop_when_the_service_repeats_a_page() -> None:
    # A layer that ignores resultOffset sends its first page forever.
    def handler(request: httpx.Request) -> httpx.Response:
        page = {**square_feature("Bosque", -77.9), "id": 1}
        return httpx.Response(
            200, json={"features": [page], "exceededTransferLimit": True}
        )

    with pytest.raises(ArcGISError, match="repeats a page"):
        await client_with(handler).features(LAYER, AOI, 0.001)


@pytest.mark.anyio
async def test_features_stop_after_the_page_limit(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from mcp_server.arcgis import client as client_module

    monkeypatch.setattr(client_module, "MAX_PAGES", 3)
    served: list[int] = []

    def handler(request: httpx.Request) -> httpx.Response:
        served.append(1)
        page = {**square_feature("Bosque", -77.9), "id": len(served)}
        return httpx.Response(
            200, json={"features": [page], "exceededTransferLimit": True}
        )

    with pytest.raises(ArcGISError, match="more than 3 pages"):
        await client_with(handler).features(LAYER, AOI, 0.001)
    assert len(served) == 3


@pytest.mark.anyio
async def test_a_histogram_over_no_pixel_is_empty_not_invalid() -> None:
    # What atlas.iadb.org answered for a 0.001 degree box on slope, 28 Sep 2026.
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"histograms": []})

    histogram = await client_with(handler).histogram(
        "https://example.test/image/rest/services/Slope/ImageServer", AOI, None
    )
    assert histogram["counts"] == []
