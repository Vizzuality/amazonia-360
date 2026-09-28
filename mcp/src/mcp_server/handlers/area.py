import asyncio
from collections.abc import Awaitable
from dataclasses import dataclass
from typing import Any, Literal

from shapely.geometry import MultiPolygon, Polygon

from mcp_server.arcgis.client import ArcGISClient, ArcGISError, Feature
from mcp_server.arcgis.styles import Style, category_styles, join_field
from mcp_server.catalogue import get_indicator_metadata
from mcp_server.catalogue.models import IndicatorMetadata, Layer, Operation
from mcp_server.geometry.aoi import (
    AOIError,
    Coverage,
    module_coverage,
    parse_aoi,
    vertex_count,
)
from mcp_server.geometry.area import (
    area_by_category,
    category_shapes,
    clip_by_category,
    geodesic_area_ha,
)
from mcp_server.handlers.errors import HandlerError
from mcp_server.handlers.result import ComputedOver, LayerFacts, Result, Timing
from mcp_server.measurement.stopwatch import Stopwatch


def _layer_facts(
    indicator: IndicatorMetadata, value: list[str] | int | dict[str, float]
) -> LayerFacts:
    covers = indicator.covers_module
    empty: Literal["not_mapped_here", "unexpected"] | None = None
    if not value and covers is not None:
        empty = "unexpected" if covers else "not_mapped_here"
    return LayerFacts(covers_module=covers, empty_result=empty)


@dataclass
class CategoryMap:
    """What a map of area_by_category draws: the clipped classes and their colours."""

    shapes: dict[str, Any]
    styles: dict[str, Style]


def _measure(
    aoi: Polygon | MultiPolygon, features: list[Feature], with_shapes: bool
) -> tuple[dict[str, float], list[dict[str, Any]]]:
    pieces = clip_by_category(aoi, features)
    shapes = category_shapes(pieces) if with_shapes else []
    return area_by_category(pieces), shapes


@dataclass
class _Prepared:
    indicator: IndicatorMetadata
    layer: Layer
    aoi: Polygon | MultiPolygon
    coverage: Coverage
    watch: Stopwatch


class AreaHandlers:
    def __init__(self, client: ArcGISClient, simplification: float = 0.001) -> None:
        self._client = client
        self._simplification = simplification
        # Renderers change with a republish of the service, not between calls.
        self._renderers: dict[str, dict[str, Any] | None] = {}

    async def categories_in_area(
        self, indicator_id: int, area: dict[str, Any]
    ) -> Result:
        p = self._prepare(indicator_id, area, "presence")
        with p.watch.lap("arcgis"):
            values = await self._call(self._client.distinct(p.layer, p.aoi))
        computed_over = ComputedOver(type="feature_attributes", categories=len(values))
        return self._result(p, values, None, computed_over)

    async def count_in_area(self, indicator_id: int, area: dict[str, Any]) -> Result:
        p = self._prepare(indicator_id, area, "count")
        with p.watch.lap("arcgis"):
            n = await self._call(self._client.count(p.layer, p.aoi))
        return self._result(
            p, n, p.indicator.unit, ComputedOver(type="feature_count", features=n)
        )

    async def area_by_category(self, indicator_id: int, area: dict[str, Any]) -> Result:
        result, _ = await self._area_by_category(indicator_id, area, with_map=False)
        return result

    async def area_by_category_map(
        self, indicator_id: int, area: dict[str, Any]
    ) -> tuple[Result, CategoryMap]:
        """The same result as area_by_category, from the same query, and its map."""
        result, drawn = await self._area_by_category(indicator_id, area, with_map=True)
        assert drawn is not None
        return result, drawn

    async def _area_by_category(
        self, indicator_id: int, area: dict[str, Any], *, with_map: bool
    ) -> tuple[Result, CategoryMap | None]:
        p = self._prepare(indicator_id, area, "area")
        with p.watch.lap("arcgis"):
            query = self._call(
                self._client.features(p.layer, p.aoi, self._simplification)
            )
            if with_map:
                features, renderer = await asyncio.gather(
                    query, self._renderer(p.layer)
                )
            else:
                features, renderer = await query, None
        with p.watch.lap("clip"):
            # Seconds of GEOS work; on the event loop it would stall every other call.
            hectares, shapes = await asyncio.to_thread(
                _measure, p.aoi, features, with_map
            )
        received = sum(vertex_count(g) for _, g in features)
        computed_over = ComputedOver(
            type="clipped_polygons",
            features=len(features),
            categories=len(hectares),
            simplification=self._simplification,
        )
        result = self._result(p, hectares, "ha", computed_over, received)
        if not with_map:
            return result, None
        categories = sorted({f["properties"]["category"] for f in shapes})
        styles = await self._styles(p, renderer, categories)
        collection = {"type": "FeatureCollection", "features": shapes}
        return result, CategoryMap(shapes=collection, styles=styles)

    async def _renderer(self, layer: Layer) -> dict[str, Any] | None:
        key = f"{layer.service_url}/{layer.layer_id}"
        if key not in self._renderers:
            try:
                self._renderers[key] = await self._client.renderer(layer)
            except ArcGISError:
                # Colours are not worth failing the map over; the palette stands in.
                return None
        return self._renderers[key]

    async def _styles(
        self,
        p: _Prepared,
        renderer: dict[str, Any] | None,
        categories: list[str],
    ) -> dict[str, Style]:
        field = join_field(renderer, p.layer.category_field, categories)
        pairs = None
        if field:
            try:
                pairs = await self._client.value_pairs(p.layer, p.aoi, field)
            except ArcGISError:
                pass
        return category_styles(renderer, p.layer.category_field, categories, pairs)

    def _prepare(
        self, indicator_id: int, area: dict[str, Any], operation: Operation
    ) -> _Prepared:
        watch = Stopwatch()
        indicator = get_indicator_metadata(indicator_id)
        if indicator is None:
            raise HandlerError(f"Unknown indicator {indicator_id}.")
        layer = indicator.query_layer()
        reason = indicator.unavailable_reason()
        if reason is not None or layer is None:
            detail = ". ".join(
                [reason or "no query layer"] + [c.text for c in indicator.caveats]
            )
            raise HandlerError(f"Indicator {indicator_id} is not available: {detail}")
        if not indicator.ai_answerable:
            raise HandlerError(f"Indicator {indicator_id} is not cleared for answers.")
        if not indicator.allows(operation):
            raise HandlerError(
                f"Indicator {indicator_id} is {indicator.value_type} and does not "
                f"support {operation}."
            )
        try:
            aoi = parse_aoi(area)
        except AOIError as exc:
            raise HandlerError(str(exc)) from exc
        coverage = module_coverage(aoi)
        if coverage.status == "outside":
            raise HandlerError("The area is outside the Ecuador module.")
        return _Prepared(indicator, layer, aoi, coverage, watch)

    @staticmethod
    async def _call[T](awaitable: Awaitable[T]) -> T:
        try:
            return await awaitable
        except ArcGISError as exc:
            raise HandlerError(str(exc)) from exc

    @staticmethod
    def _result(
        p: _Prepared,
        value: list[str] | int | dict[str, float],
        unit: str | None,
        computed_over: ComputedOver,
        vertices_received: int = 0,
    ) -> Result:
        aoi_ha = round(geodesic_area_ha(p.aoi), 2)
        classified = unclassified = None
        if isinstance(value, dict):
            classified = round(sum(value.values()), 2)
            # Clamped: the clip can exceed the AOI by rounding, never by real area.
            unclassified = round(max(aoi_ha - classified, 0.0), 2)
        return Result(
            indicator_id=p.indicator.id,
            value=value,
            unit=unit,
            computed_over=computed_over,
            coverage=p.coverage,
            provenance=p.indicator.provenance.model_dump(),
            layer=_layer_facts(p.indicator, value),
            caveats=[c.text for c in p.indicator.caveats],
            record_counts=p.indicator.record_counts(),
            aoi_ha=aoi_ha,
            classified_ha=classified,
            unclassified_ha=unclassified,
            timing=Timing(
                total_ms=p.watch.total_ms(),
                arcgis_ms=p.watch.ms("arcgis"),
                clip_ms=p.watch.ms("clip"),
                vertices_sent=vertex_count(p.aoi),
                vertices_received=vertices_received,
            ),
        )
