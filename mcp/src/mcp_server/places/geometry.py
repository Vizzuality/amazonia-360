import time
from collections.abc import Callable
from typing import Protocol

import shapely
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError
from mcp_server.geometry.area import polygonal_parts
from mcp_server.places.models import Place

DAY_S = 86_400.0


class _Boundaries(Protocol):
    async def boundary(
        self, url: str, layer_id: int, where: str
    ) -> list[BaseGeometry]: ...


def _polygonal(geom: BaseGeometry) -> Polygon | MultiPolygon:
    if isinstance(geom, GeometryCollection):
        geom = shapely.union_all(polygonal_parts(geom))
    if not isinstance(geom, Polygon | MultiPolygon) or geom.is_empty:
        raise ArcGISError("The place's boundary has no area.")
    return geom


class PlaceGeometries:
    """Boundaries of places, read from ArcGIS on first use and kept for a day."""

    def __init__(
        self,
        client: _Boundaries,
        *,
        ttl_s: float = DAY_S,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._client = client
        self._ttl_s = ttl_s
        self._clock = clock
        self._cache: dict[str, tuple[float, Polygon | MultiPolygon]] = {}

    async def geometry(self, place: Place) -> Polygon | MultiPolygon:
        cached = self._cache.get(place.id)
        if cached is not None and self._clock() - cached[0] < self._ttl_s:
            return cached[1]
        source = place.source
        shapes = await self._client.boundary(source.url, source.layer_id, source.where)
        if not shapes:
            raise ArcGISError(
                f"The boundary of {place.id} is no longer in its layer; call "
                "find_places for the place's current id."
            )
        geom = _polygonal(shapely.make_valid(shapely.union_all(shapes)))
        self._cache[place.id] = (self._clock(), geom)
        return geom
