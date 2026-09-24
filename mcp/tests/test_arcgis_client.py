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

    with pytest.raises(ArcGISError, match="did not respond"):
        await client_with(handler).features(LAYER, AOI, 0.001)
