from collections.abc import Awaitable
from dataclasses import dataclass
from typing import Any, Literal

from shapely.geometry import MultiPolygon, Polygon

from mcp_server.arcgis.client import ArcGISClient, ArcGISError
from mcp_server.catalogue import get_indicator_metadata
from mcp_server.catalogue.models import IndicatorMetadata, Layer, Operation
from mcp_server.geometry.aoi import (
    AOIError,
    Coverage,
    module_coverage,
    parse_aoi,
    vertex_count,
)
from mcp_server.geometry.area import clip_area_by_category, geodesic_area_ha
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
        p = self._prepare(indicator_id, area, "area")
        with p.watch.lap("arcgis"):
            features = await self._call(
                self._client.features(p.layer, p.aoi, self._simplification)
            )
        with p.watch.lap("clip"):
            hectares = clip_area_by_category(p.aoi, features)
        received = sum(vertex_count(g) for _, g in features)
        computed_over = ComputedOver(
            type="clipped_polygons",
            features=len(features),
            categories=len(hectares),
            simplification=self._simplification,
        )
        return self._result(p, hectares, "ha", computed_over, received)

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
