import json
from typing import Any

import httpx
from shapely.errors import ShapelyError
from shapely.geometry import MultiPolygon, Polygon, mapping
from shapely.geometry.base import BaseGeometry
from shapely.geometry.polygon import orient

from mcp_server.arcgis.esri_json import polygon_from_rings
from mcp_server.catalogue.models import Layer

Feature = tuple[str, BaseGeometry]

# 100,000 features at the services' 2,000 a page. The whole module on the densest
# indexed layer (214) is 14,137.
MAX_PAGES = 50


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


def _layer_url(layer: Layer) -> str:
    return f"{layer.service_url}/{layer.layer_id}"


def _invalid(url: str, what: str) -> ArcGISError:
    return ArcGISError(f"Invalid response from {url}: {what}")


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
            url = f"{_layer_url(layer)}/query"
            raise _invalid(url, "missing or invalid count") from exc

    async def distinct(self, layer: Layer, aoi: BaseGeometry) -> list[str]:
        rows = await self._distinct_rows(
            layer, aoi, [layer.category_field], "the list of classes was truncated"
        )
        values = {row[layer.category_field] for row in rows}
        return sorted(str(v) for v in values if v is not None)

    async def features(
        self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
    ) -> list[Feature]:
        url = f"{_layer_url(layer)}/query"
        collected: list[Feature] = []
        offset = 0
        first_ids: set[Any] = set()
        for _ in range(MAX_PAGES):
            body = await self._query(
                layer,
                aoi,
                {
                    "outFields": layer.category_field,
                    "returnGeometry": "true",
                    "outSR": "4326",
                    "maxAllowableOffset": str(max_allowable_offset),
                    "resultOffset": str(offset),
                    # Not geojson: ArcGIS Online's GeoJSON turns holes into shells.
                    "f": "json",
                },
            )
            try:
                page = body.get("features", [])
                for f in page:
                    if f.get("geometry") is None:
                        continue
                    category = f["attributes"][layer.category_field]
                    if category is None:
                        continue
                    geom = polygon_from_rings(f["geometry"]["rings"])
                    collected.append((str(category), geom))
                exceeded = _exceeded_transfer_limit(body)
                if exceeded and not page:
                    raise _invalid(
                        url, "the page was truncated but returned no features"
                    )
                if not exceeded:
                    return collected
                # A service that ignores resultOffset sends the first page forever.
                oid = page[0]["attributes"].get(body.get("objectIdFieldName"))
                first = oid if oid is not None else json.dumps(page[0], sort_keys=True)
                if first in first_ids:
                    raise _invalid(
                        url, "the service repeats a page, so it does not page"
                    )
                first_ids.add(first)
                offset += len(page)
            except (KeyError, ShapelyError, TypeError, ValueError) as exc:
                raise _invalid(url, "missing attributes or geometry") from exc
        raise ArcGISError(
            f"The area holds more than {MAX_PAGES} pages of features of this layer; "
            "draw a smaller area."
        )

    async def boundary(self, url: str, layer_id: int, where: str) -> list[BaseGeometry]:
        """Every polygon of a boundary layer that the where clause selects."""
        query = f"{url}/{layer_id}/query"
        body = await self._send(
            "POST",
            query,
            data={
                "where": where,
                "returnGeometry": "true",
                "outSR": "4326",
                "f": "json",
            },
        )
        try:
            return [
                polygon_from_rings(f["geometry"]["rings"])
                for f in body["features"]
                if f.get("geometry") is not None
            ]
        except (AttributeError, KeyError, ShapelyError, TypeError, ValueError) as exc:
            raise _invalid(query, "missing features or geometry") from exc

    async def renderer(self, layer: Layer) -> dict[str, Any] | None:
        """The layer's renderer, where the front end takes its colours from."""
        body = await self._send("GET", _layer_url(layer), params={"f": "json"})
        renderer = (body.get("drawingInfo") or {}).get("renderer")
        return renderer if isinstance(renderer, dict) else None

    async def value_pairs(
        self, layer: Layer, aoi: BaseGeometry, field: str
    ) -> dict[str, set[str]]:
        """For each class in the area, the values another field takes on it."""
        rows = await self._distinct_rows(
            layer, aoi, [layer.category_field, field], "the pairs were truncated"
        )
        pairs: dict[str, set[str]] = {}
        for row in rows:
            category, value = row[layer.category_field], row[field]
            if category is not None and value is not None:
                pairs.setdefault(str(category), set()).add(str(value))
        return pairs

    async def _distinct_rows(
        self, layer: Layer, aoi: BaseGeometry, fields: list[str], truncated: str
    ) -> list[dict[str, Any]]:
        """The distinct combinations of the fields in the area, one dict per row."""
        body = await self._query(
            layer,
            aoi,
            {
                "outFields": ",".join(fields),
                "returnDistinctValues": "true",
                "returnGeometry": "false",
                "f": "json",
            },
        )
        url = f"{_layer_url(layer)}/query"
        if _exceeded_transfer_limit(body):
            raise _invalid(url, truncated)
        try:
            return [
                {name: f["attributes"][name] for name in fields}
                for f in body["features"]
            ]
        except (KeyError, TypeError) as exc:
            raise _invalid(url, "missing features or attributes") from exc

    async def _query(
        self, layer: Layer, aoi: BaseGeometry, extra: dict[str, str]
    ) -> dict[str, Any]:
        url = f"{_layer_url(layer)}/query"
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
        if body.get("histograms") == []:
            # What the service answers when no pixel centre falls in the area.
            return {"min": 0.0, "max": 0.0, "size": 0, "counts": []}
        try:
            histogram = body["histograms"][0]
            for key in ("min", "max", "size", "counts"):
                histogram[key]
        except (KeyError, IndexError, TypeError) as exc:
            raise _invalid(f"{url}/computeHistograms", "no histogram") from exc
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
            raise _invalid(url, "not valid JSON") from exc
        if "error" in body:
            # ArcGIS often sends an empty message with the useful part in details.
            error = body["error"]
            raise ArcGISError(
                f"ArcGIS returned error {error.get('code')} "
                f"{error.get('message') or ''} {error.get('details') or ''} "
                f"from {url}"
            )
        return body
