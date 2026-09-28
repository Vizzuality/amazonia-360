import json
from typing import Any

import httpx
from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from shapely.geometry.base import BaseGeometry
from shapely.geometry.polygon import orient

from mcp_server.catalogue.models import Layer

Feature = tuple[str, BaseGeometry]


class ArcGISError(Exception):
    pass


# Measured over 1,800 calls on 24-25 September 2026: ArcGIS Online answers 504
# after about 59 s, and slow hours come and go, so the message says so instead
# of handing the model a URL to guess from.
_GAVE_UP = (
    "ArcGIS Online gave up after about 60 s. This usually means the service is "
    "busy, which comes and goes by the hour; trying again later may work."
)


def _exceeded_transfer_limit(body: dict[str, Any]) -> bool:
    return bool(
        body.get("exceededTransferLimit")
        or body.get("properties", {}).get("exceededTransferLimit")
    )


def esri_polygon(aoi: BaseGeometry) -> str:
    polygons = list(aoi.geoms) if isinstance(aoi, MultiPolygon) else [aoi]
    rings: list[list[list[float]]] = []
    for polygon in polygons:
        if not isinstance(polygon, Polygon):
            raise ArcGISError(f"Cannot query with a {polygon.geom_type}.")
        # Esri expects clockwise exterior rings; orient(sign=-1) produces that.
        coords = mapping(orient(polygon, sign=-1.0))["coordinates"]
        rings.extend([list(map(list, ring)) for ring in coords])
    return json.dumps({"rings": rings, "spatialReference": {"wkid": 4326}})


class ArcGISClient:
    def __init__(self, http: httpx.AsyncClient) -> None:
        self._http = http

    async def count(self, layer: Layer, aoi: BaseGeometry) -> int:
        body = await self._query(layer, aoi, {"returnCountOnly": "true", "f": "json"})
        try:
            return int(body["count"])
        except (KeyError, TypeError, ValueError) as exc:
            url = f"{layer.service_url}/{layer.layer_id}/query"
            raise ArcGISError(
                f"Invalid response from {url}: missing or invalid count"
            ) from exc

    async def distinct(self, layer: Layer, aoi: BaseGeometry) -> list[str]:
        body = await self._query(
            layer,
            aoi,
            {
                "outFields": layer.category_field,
                "returnDistinctValues": "true",
                "returnGeometry": "false",
                "f": "json",
            },
        )
        url = f"{layer.service_url}/{layer.layer_id}/query"
        if _exceeded_transfer_limit(body):
            raise ArcGISError(
                f"Invalid response from {url}: the list of classes was truncated"
            )
        try:
            values = {f["attributes"][layer.category_field] for f in body["features"]}
            return sorted(str(v) for v in values if v is not None)
        except (KeyError, TypeError) as exc:
            raise ArcGISError(
                f"Invalid response from {url}: missing features or attributes"
            ) from exc

    async def features(
        self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
    ) -> list[Feature]:
        collected: list[Feature] = []
        offset = 0
        while True:
            body = await self._query(
                layer,
                aoi,
                {
                    "outFields": layer.category_field,
                    "returnGeometry": "true",
                    "outSR": "4326",
                    "maxAllowableOffset": str(max_allowable_offset),
                    "resultOffset": str(offset),
                    "f": "geojson",
                },
            )
            try:
                page = body.get("features", [])
                for f in page:
                    if f.get("geometry") is None:
                        continue
                    category = f["properties"][layer.category_field]
                    if category is None:
                        continue
                    collected.append((str(category), shape(f["geometry"])))
                exceeded = _exceeded_transfer_limit(body)
                if exceeded and not page:
                    url = f"{layer.service_url}/{layer.layer_id}/query"
                    raise ArcGISError(
                        f"Invalid response from {url}: the page was truncated but "
                        "returned no features"
                    )
                if not exceeded:
                    return collected
                offset += len(page)
            except (KeyError, TypeError) as exc:
                url = f"{layer.service_url}/{layer.layer_id}/query"
                raise ArcGISError(
                    f"Invalid response from {url}: missing properties or geometry"
                ) from exc

    async def renderer(self, layer: Layer) -> dict[str, Any] | None:
        """The layer's renderer, where the front end takes its colours from."""
        url = f"{layer.service_url}/{layer.layer_id}"
        body = await self._send("GET", url, params={"f": "json"})
        renderer = (body.get("drawingInfo") or {}).get("renderer")
        return renderer if isinstance(renderer, dict) else None

    async def value_pairs(
        self, layer: Layer, aoi: BaseGeometry, field: str
    ) -> dict[str, set[str]]:
        """For each class in the area, the values another field takes on it."""
        body = await self._query(
            layer,
            aoi,
            {
                "outFields": f"{layer.category_field},{field}",
                "returnDistinctValues": "true",
                "returnGeometry": "false",
                "f": "json",
            },
        )
        url = f"{layer.service_url}/{layer.layer_id}/query"
        if _exceeded_transfer_limit(body):
            raise ArcGISError(f"Invalid response from {url}: the pairs were truncated")
        pairs: dict[str, set[str]] = {}
        try:
            for f in body["features"]:
                category = f["attributes"][layer.category_field]
                value = f["attributes"][field]
                if category is not None and value is not None:
                    pairs.setdefault(str(category), set()).add(str(value))
        except (KeyError, TypeError) as exc:
            raise ArcGISError(
                f"Invalid response from {url}: missing features or attributes"
            ) from exc
        return pairs

    async def _query(
        self, layer: Layer, aoi: BaseGeometry, extra: dict[str, str]
    ) -> dict[str, Any]:
        url = f"{layer.service_url}/{layer.layer_id}/query"
        params = {
            "where": "1=1",
            "geometry": esri_polygon(aoi),
            "geometryType": "esriGeometryPolygon",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            **extra,
        }
        # POST, because an area near the vertex limit does not fit in a URL.
        return await self._send("POST", url, data=params)

    async def histogram(
        self, url: str, aoi: BaseGeometry, rendering_rule: dict[str, Any] | None
    ) -> dict[str, Any]:
        """The first band's histogram of the pixels inside the area. No rule: the
        stored values, which is what counts every pixel with data."""
        params = {
            "geometry": esri_polygon(aoi),
            "geometryType": "esriGeometryPolygon",
            "f": "json",
        }
        if rendering_rule is not None:
            params["renderingRule"] = json.dumps(rendering_rule)
        body = await self._send("POST", f"{url}/computeHistograms", data=params)
        try:
            histogram = body["histograms"][0]
            for key in ("min", "max", "size", "counts"):
                histogram[key]
        except (KeyError, IndexError, TypeError) as exc:
            raise ArcGISError(
                f"Invalid response from {url}/computeHistograms: no histogram"
            ) from exc
        return histogram

    async def export_image(self, url: str, params: dict[str, str]) -> bytes:
        response = await self._request("POST", f"{url}/exportImage", data=params)
        if not response.headers.get("content-type", "").startswith("image/"):
            raise ArcGISError(f"No image from {url}/exportImage: {response.text[:200]}")
        return response.content

    async def _request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        try:
            response = await self._http.request(method, url, **kwargs)
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ArcGISError(_GAVE_UP) from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 504:
                raise ArcGISError(_GAVE_UP) from exc
            raise ArcGISError(f"ArcGIS request failed: {exc}") from exc
        except httpx.HTTPError as exc:
            raise ArcGISError(f"ArcGIS request failed: {exc}") from exc
        return response

    async def _send(self, method: str, url: str, **kwargs: Any) -> dict[str, Any]:
        response = await self._request(method, url, **kwargs)
        try:
            body = response.json()
        except ValueError as exc:
            raise ArcGISError(f"Invalid response from {url}: not valid JSON") from exc
        if "error" in body:
            # ArcGIS often sends an empty message with the useful part in details.
            error = body["error"]
            raise ArcGISError(
                f"ArcGIS returned error {error.get('code')} "
                f"{error.get('message') or ''} {error.get('details') or ''} "
                f"from {url}"
            )
        return body
