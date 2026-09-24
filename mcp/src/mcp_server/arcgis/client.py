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


def _esri_polygon(aoi: BaseGeometry) -> str:
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
        try:
            values = {f["attributes"][layer.category_field] for f in body["features"]}
            return sorted(str(v) for v in values if v is not None)
        except (KeyError, TypeError) as exc:
            url = f"{layer.service_url}/{layer.layer_id}/query"
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
                    category = str(f["properties"][layer.category_field])
                    collected.append((category, shape(f["geometry"])))
                exceeded = body.get("exceededTransferLimit") or body.get(
                    "properties", {}
                ).get("exceededTransferLimit")
                if not exceeded or not page:
                    return collected
                offset += len(page)
            except (KeyError, TypeError) as exc:
                url = f"{layer.service_url}/{layer.layer_id}/query"
                raise ArcGISError(
                    f"Invalid response from {url}: missing properties or geometry"
                ) from exc

    async def _query(
        self, layer: Layer, aoi: BaseGeometry, extra: dict[str, str]
    ) -> dict[str, Any]:
        url = f"{layer.service_url}/{layer.layer_id}/query"
        params = {
            "where": "1=1",
            "geometry": _esri_polygon(aoi),
            "geometryType": "esriGeometryPolygon",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            **extra,
        }
        try:
            # POST, because an area near the vertex limit does not fit in a URL.
            response = await self._http.post(url, data=params)
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ArcGISError(f"ArcGIS did not respond in time: {url}") from exc
        except httpx.HTTPError as exc:
            raise ArcGISError(f"ArcGIS request failed: {exc}") from exc
        try:
            body = response.json()
        except ValueError as exc:
            raise ArcGISError(f"Invalid response from {url}: not valid JSON") from exc
        if "error" in body:
            error_message = body["error"].get("message")
            raise ArcGISError(f"ArcGIS returned an error: {error_message}")
        return body
