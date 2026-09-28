import asyncio
import base64
from collections.abc import Awaitable
from dataclasses import dataclass
from typing import Any, Literal

from shapely.geometry import MultiPolygon, Polygon

from mcp_server.arcgis.client import ArcGISClient, ArcGISError, Feature
from mcp_server.arcgis.raster import class_counts, class_rule, image_request
from mcp_server.arcgis.styles import Style, category_styles, join_field
from mcp_server.catalogue import get_indicator_metadata
from mcp_server.catalogue.models import IndicatorMetadata, Layer, Operation, Raster
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


@dataclass
class RasterMap:
    """What a map of class_shares_in_area draws: an image of the area and its
    surroundings, where it goes, and the classes in the legend's order."""

    name: str
    image: str
    corners: list[list[float]]
    classes: list[dict[str, str]]


def _measure(
    aoi: Polygon | MultiPolygon, features: list[Feature], with_shapes: bool
) -> tuple[dict[str, float], list[dict[str, Any]]]:
    pieces = clip_by_category(aoi, features)
    shapes = category_shapes(pieces) if with_shapes else []
    return area_by_category(pieces), shapes


@dataclass
class _Prepared:
    indicator: IndicatorMetadata
    aoi: Polygon | MultiPolygon
    coverage: Coverage
    watch: Stopwatch

    # allows() has checked the resource type, so these hold for the operation asked.
    @property
    def layer(self) -> Layer:
        layer = self.indicator.query_layer()
        assert layer is not None
        return layer

    @property
    def raster(self) -> Raster:
        raster = self.indicator.raster()
        assert raster is not None
        return raster


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

    async def class_shares(self, indicator_id: int, area: dict[str, Any]) -> Result:
        result, _ = await self._class_shares(indicator_id, area, with_map=False)
        return result

    async def class_shares_map(
        self, indicator_id: int, area: dict[str, Any]
    ) -> tuple[Result, RasterMap]:
        """The same result as class_shares, and an image of the area to draw."""
        result, drawn = await self._class_shares(indicator_id, area, with_map=True)
        assert drawn is not None
        return result, drawn

    async def _class_shares(
        self, indicator_id: int, area: dict[str, Any], *, with_map: bool
    ) -> tuple[Result, RasterMap | None]:
        p = self._prepare(indicator_id, area, "class_share")
        raster = p.raster
        params, corners = image_request(raster, p.aoi)
        with p.watch.lap("arcgis"):
            by_class, stored, image = await self._call(
                asyncio.gather(
                    self._client.histogram(raster.url, p.aoi, class_rule(raster)),
                    # Every pixel with data, in a class or not: the denominator.
                    self._client.histogram(raster.url, p.aoi, None),
                    self._client.export_image(raster.url, params)
                    if with_map
                    else asyncio.sleep(0, b""),
                )
            )
        try:
            counts = class_counts(by_class, raster.values)
        except ArcGISError as exc:
            raise HandlerError(f"{exc} from {raster.url}") from exc
        classified = sum(counts)
        total = max(sum(stored["counts"]), classified)
        pixel = p.indicator.sync.pixel_size_deg
        if total == 0 and pixel is not None:
            x0, y0, x1, y1 = p.aoi.bounds
            if min(x1 - x0, y1 - y0) < pixel:
                raise HandlerError(
                    f"The area is smaller than one pixel of this raster "
                    f"({pixel:.4f} degrees, about {pixel * 111.32:.1f} km), so no "
                    "pixel falls in it. Draw a larger area."
                )
        # Not rounded: a class of a few pixels in a large area would read as 0.0,
        # present and absent at once.
        shares = {
            item.label: n / total
            for item, n in zip(raster.legend, counts, strict=True)
            if n > 0
        }
        computed_over = ComputedOver(
            type="raster_pixels",
            categories=len(shares),
            pixels=total,
            pixel_size_deg=pixel,
        )
        result = self._result(p, shares, "share of pixels", computed_over)
        if total:
            result.unclassified_share = (total - classified) / total
            # Pixels with data and no class: the raster says what is there, and it
            # is none of its classes. Not the empty result of a layer that misses.
            result.layer.empty_result = None
        if not with_map:
            return result, None
        return result, RasterMap(
            name=p.indicator.name,
            image="data:image/png;base64," + base64.b64encode(image).decode(),
            corners=corners,
            classes=[i.model_dump() for i in raster.legend],
        )

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
        reason = indicator.unavailable_reason()
        if reason is not None:
            detail = ". ".join([reason] + [c.text for c in indicator.caveats])
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
        return _Prepared(indicator, aoi, coverage, watch)

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
        if isinstance(value, dict) and unit == "ha":
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
