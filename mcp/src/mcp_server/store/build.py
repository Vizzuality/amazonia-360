import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

import shapely
from shapely.geometry import MultiPolygon, Polygon
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError, Feature
from mcp_server.catalogue.models import IndicatorMetadata, Layer
from mcp_server.geometry.aoi import AOIError, check_aoi
from mcp_server.geometry.area import clip_area_by_category
from mcp_server.places import Places
from mcp_server.places.geometry import PlaceGeometries
from mcp_server.store.files import LayerStore
from mcp_server.store.models import LayerManifest, PlaceFigures
from mcp_server.store.split import split_by_grid

BOUNDARY_CONCURRENCY = 4


class _Client(Protocol):
    async def layer_features(
        self, layer: Layer, max_allowable_offset: float
    ) -> list[Feature]: ...

    async def boundary(
        self, url: str, layer_id: int, where: str
    ) -> list[BaseGeometry]: ...


def area_capable(indicators: list[IndicatorMetadata]) -> list[IndicatorMetadata]:
    return [
        i
        for i in indicators
        if i.query_layer() is not None
        and i.unavailable_reason() is None
        and i.ai_answerable
        and i.allows("area")
    ]


def _is_current(store: LayerStore, indicator: IndicatorMetadata) -> bool:
    manifest = store.manifest(indicator.id)
    return manifest is not None and manifest.layer_last_edit == (
        indicator.sync.layer_last_edit
    )


def stale_layers(store: LayerStore, indicators: list[IndicatorMetadata]) -> list[int]:
    return [i.id for i in area_capable(indicators) if not _is_current(store, i)]


def _check_degrees(features: list[Feature]) -> None:
    """A layer can label projected coordinates as 4326 (layer 203 does for three of
    its four features); splitting them along a grid of degrees would never end."""
    for category, geom in features:
        min_x, min_y, max_x, max_y = geom.bounds
        if min_x < -180 or max_x > 180 or min_y < -90 or max_y > 90:
            raise ValueError(
                f"feature {category!r} has coordinates outside longitude/latitude "
                f"range: x {min_x:.0f} to {max_x:.0f}, y {min_y:.0f} to {max_y:.0f}"
            )


def _simplified(features: list[Feature], tolerance: float) -> list[Feature]:
    return [
        (category, shapely.simplify(geom, tolerance, preserve_topology=True))
        for category, geom in features
    ]


async def _build_layer(
    client: _Client,
    store: LayerStore,
    indicator: IndicatorMetadata,
    layer: Layer,
    cell_deg: float,
    simplification: float,
    now: datetime,
) -> None:
    # Downloaded as stored and simplified here: ArcGIS Online's own generalisation
    # can answer in metres (AM-766) and differs from shapely's.
    full = await client.layer_features(layer, 0)
    features = await asyncio.to_thread(_simplified, full, simplification)
    _check_degrees(features)
    pieces = await asyncio.to_thread(split_by_grid, features, cell_deg)
    manifest = LayerManifest(
        indicator_id=indicator.id,
        layer_last_edit=indicator.sync.layer_last_edit,
        simplification=simplification,
        cell_deg=cell_deg,
        features=len(features),
        pieces=len(pieces),
        built_at=now,
    )
    await asyncio.to_thread(store.write_layer, manifest, pieces)


async def build_layers(
    client: _Client,
    store: LayerStore,
    indicators: list[IndicatorMetadata],
    *,
    only: list[int] | None,
    cell_deg: float,
    simplification: float,
    now: datetime,
) -> dict[int, str]:
    """Per indicator "built", "current" or the error text. With `only`, those
    layers are rebuilt whether or not they are current."""
    results: dict[int, str] = {}
    for indicator in area_capable(indicators):
        if only is not None and indicator.id not in only:
            continue
        layer = indicator.query_layer()
        if layer is None:
            continue
        if only is None and _is_current(store, indicator):
            results[indicator.id] = "current"
            continue
        try:
            await _build_layer(
                client, store, indicator, layer, cell_deg, simplification, now
            )
        except (ArcGISError, OSError, ValueError) as exc:
            results[indicator.id] = str(exc) or type(exc).__name__
        else:
            results[indicator.id] = "built"
    return results


async def _read_boundaries(
    client: _Client, places: Places
) -> tuple[dict[str, Polygon | MultiPolygon], dict[str, str]]:
    geometries = PlaceGeometries(client)
    gate = asyncio.Semaphore(BOUNDARY_CONCURRENCY)
    boundaries: dict[str, Polygon | MultiPolygon] = {}
    failures: dict[str, str] = {}

    async def read(place_id: str) -> None:
        place = places.get(place_id)
        assert place is not None
        async with gate:
            try:
                geom = await geometries.geometry(place)
                boundaries[place_id] = check_aoi(geom, max_vertices=None, reach=False)
            except (ArcGISError, AOIError) as exc:
                failures[place_id] = str(exc)

    await asyncio.gather(*(read(p.id) for p in places.snapshot.places))
    ordered = {
        p.id: boundaries[p.id] for p in places.snapshot.places if p.id in boundaries
    }
    return ordered, failures


def _figures(
    store: LayerStore,
    indicator_id: int,
    boundaries: dict[str, Polygon | MultiPolygon],
    generated_at: str,
) -> PlaceFigures | None:
    copy = store.layer(indicator_id)
    if copy is None:
        return None
    hectares = {
        place_id: clip_area_by_category(geom, copy.pieces_in(geom))
        for place_id, geom in boundaries.items()
    }
    return PlaceFigures(
        indicator_id=indicator_id,
        layer_last_edit=copy.manifest.layer_last_edit,
        places_generated_at=generated_at,
        hectares=hectares,
    )


@dataclass
class PlacesResult:
    boundaries: int
    skipped: dict[str, str]
    figures: dict[int, str]

    @property
    def ok(self) -> bool:
        return not self.skipped and all(v == "built" for v in self.figures.values())

    def summary(self) -> str:
        text = f"{self.boundaries} boundaries, {len(self.skipped)} skipped"
        for place_id, reason in self.skipped.items():
            text += f"\n  skipped {place_id}: {reason}"
        for indicator_id, outcome in self.figures.items():
            if outcome != "built":
                text += f"\n  figures {indicator_id}: {outcome}"
        return text


async def build_places(
    client: _Client, store: LayerStore, places: Places, indicator_ids: list[int]
) -> PlacesResult:
    """Boundaries of every place once, then each layer's figures from its copy.

    A place that cannot be read keeps its previous boundary when the store has one
    for the same snapshot; with nothing read, the store is left as it was."""
    generated_at = places.snapshot.generated_at
    boundaries, failures = await _read_boundaries(client, places)
    if not boundaries and places.snapshot.places:
        return PlacesResult(0, failures, dict.fromkeys(indicator_ids, "not built"))
    for place_id in list(failures):
        kept = await asyncio.to_thread(store.boundary, place_id, generated_at)
        if kept is not None:
            boundaries[place_id] = kept
            del failures[place_id]
    await asyncio.to_thread(store.write_boundaries, generated_at, boundaries)
    results: dict[int, str] = {}
    for indicator_id in indicator_ids:
        figures = await asyncio.to_thread(
            _figures, store, indicator_id, boundaries, generated_at
        )
        if figures is None:
            results[indicator_id] = "no copy"
            continue
        await asyncio.to_thread(store.write_figures, figures)
        results[indicator_id] = "built"
    return PlacesResult(len(boundaries), failures, results)
