from collections.abc import Awaitable
from dataclasses import dataclass
from typing import Any

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
from mcp_server.handlers.result import ComputedOver, Result, Timing
from mcp_server.measurement.stopwatch import Stopwatch


@dataclass
class _Prepared:
    indicator: IndicatorMetadata
    layer: Layer
    aoi: Polygon | MultiPolygon
    coverage: Coverage
    caveats: list[str]
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
        caveats = [c.text for c in indicator.caveats]
        mismatch = indicator.count_mismatch()
        if mismatch is not None:
            caveats.append(mismatch)
        if coverage.status == "partial":
            caveats.append(
                "The area is partly outside the Ecuador module; only the part inside "
                "has data, and aoi_ha counts the whole area, including the part "
                "outside."
            )
        if coverage.provisional:
            # The envelope is a bounding box, not the real module outline, so an area
            # can read as "inside" while actually falling outside the module.
            caveats.append(
                "The module boundary used for this check is a provisional bounding "
                "box; an area can fall outside the module and still be accepted."
            )
        return _Prepared(indicator, layer, aoi, coverage, caveats, watch)

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
        return Result(
            indicator_id=p.indicator.id,
            value=value,
            unit=unit,
            computed_over=computed_over,
            coverage=p.coverage,
            provenance=p.indicator.provenance.model_dump(),
            caveats=p.caveats,
            aoi_ha=round(geodesic_area_ha(p.aoi), 2),
            timing=Timing(
                total_ms=p.watch.total_ms(),
                arcgis_ms=p.watch.ms("arcgis"),
                clip_ms=p.watch.ms("clip"),
                vertices_sent=vertex_count(p.aoi),
                vertices_received=vertices_received,
            ),
        )
