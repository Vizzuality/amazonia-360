import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal, Protocol

from shapely.geometry import MultiPolygon, Polygon

from mcp_server.arcgis.client import ArcGISClient, Feature
from mcp_server.catalogue.models import IndicatorMetadata, Layer
from mcp_server.geometry.aoi import vertex_count
from mcp_server.geometry.area import area_by_category, category_shapes, clip_by_category
from mcp_server.store.files import LayerStore

SourceName = Literal["precomputed", "local_copy", "arcgis"]
SOURCE_NAMES: tuple[SourceName, ...] = ("precomputed", "local_copy", "arcgis")


@dataclass(frozen=True)
class AreaRequest:
    indicator: IndicatorMetadata
    layer: Layer
    aoi: Polygon | MultiPolygon
    place_id: str | None
    with_shapes: bool


@dataclass
class Measurement:
    hectares: dict[str, float]
    shapes: list[dict[str, Any]]
    features: int
    vertices_received: int
    source: SourceName
    layer_version: datetime | None


class AreaSource(Protocol):
    name: SourceName

    async def measure(self, request: AreaRequest) -> Measurement | None:
        """None when this source cannot answer the request."""
        ...


def _clip(
    aoi: Polygon | MultiPolygon, features: list[Feature], with_shapes: bool
) -> tuple[dict[str, float], list[dict[str, Any]]]:
    pieces = clip_by_category(aoi, features)
    shapes = category_shapes(pieces) if with_shapes else []
    return area_by_category(pieces), shapes


class ArcGISSource:
    name: SourceName = "arcgis"

    def __init__(self, client: ArcGISClient, simplification: float) -> None:
        self._client = client
        self._simplification = simplification

    async def measure(self, request: AreaRequest) -> Measurement | None:
        features = await self._client.features(
            request.layer, request.aoi, self._simplification
        )
        # Seconds of GEOS work; on the event loop it would stall every other call.
        hectares, shapes = await asyncio.to_thread(
            _clip, request.aoi, features, request.with_shapes
        )
        return Measurement(
            hectares=hectares,
            shapes=shapes,
            features=len(features),
            vertices_received=sum(vertex_count(g) for _, g in features),
            source="arcgis",
            layer_version=None,
        )


class LocalCopySource:
    name: SourceName = "local_copy"

    def __init__(self, store: LayerStore) -> None:
        self._store = store

    async def measure(self, request: AreaRequest) -> Measurement | None:
        copy = await asyncio.to_thread(self._store.layer, request.indicator.id)
        if copy is None:
            return None
        edited = request.indicator.sync.layer_last_edit
        if copy.manifest.layer_last_edit != edited:
            return None
        pieces = copy.pieces_in(request.aoi)
        hectares, shapes = await asyncio.to_thread(
            _clip, request.aoi, pieces, request.with_shapes
        )
        return Measurement(
            hectares=hectares,
            shapes=shapes,
            features=len(pieces),
            vertices_received=0,
            source="local_copy",
            layer_version=copy.manifest.layer_last_edit,
        )


class PrecomputedSource:
    name: SourceName = "precomputed"

    def __init__(self, store: LayerStore, places_generated_at: str) -> None:
        self._store = store
        self._places_generated_at = places_generated_at

    async def measure(self, request: AreaRequest) -> Measurement | None:
        if request.place_id is None or request.with_shapes:
            return None
        figures = await asyncio.to_thread(self._store.figures, request.indicator.id)
        if figures is None:
            return None
        edited = request.indicator.sync.layer_last_edit
        if (
            figures.layer_last_edit != edited
            or figures.places_generated_at != self._places_generated_at
        ):
            return None
        hectares = figures.hectares.get(request.place_id)
        if hectares is None:
            return None
        return Measurement(
            hectares=dict(hectares),
            shapes=[],
            features=0,
            vertices_received=0,
            source="precomputed",
            layer_version=figures.layer_last_edit,
        )


class SourceSelector:
    def __init__(self, sources: list[AreaSource]) -> None:
        self._sources = sources

    async def measure(self, request: AreaRequest) -> Measurement:
        for source in self._sources:
            measurement = await source.measure(request)
            if measurement is not None:
                return measurement
        raise RuntimeError("No area source answered; the last one must always answer.")
