import asyncio
import base64
from collections.abc import Awaitable
from dataclasses import dataclass
from typing import Any, Literal

from shapely.geometry import MultiPolygon, Polygon, mapping

from mcp_server.arcgis.client import ArcGISClient, ArcGISError, Feature
from mcp_server.arcgis.raster import class_counts, class_rule, image_request
from mcp_server.arcgis.styles import Style, category_styles, join_field
from mcp_server.catalogue import get_indicator_metadata
from mcp_server.catalogue.models import IndicatorMetadata, Layer, Operation, Raster
from mcp_server.geometry.aoi import (
    AOIError,
    Coverage,
    check_aoi,
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
from mcp_server.handlers.result import (
    ComputedOver,
    LayerFacts,
    PlaceInfo,
    Result,
    Timing,
)
from mcp_server.measurement.stopwatch import Stopwatch
from mcp_server.places import Places, load_places
from mcp_server.places.geometry import PlaceGeometries
from mcp_server.places.models import Place

# About 50 m. The page only draws the outline, and Yasuní's full boundary is 941,856
# bytes of JSON.
MAP_OUTLINE_TOLERANCE_DEG = 0.0005
OVERLAP_MIN_HA = 1.0
OVERLAP_MIN_SHARE = 0.001


def _outline(aoi: Polygon | MultiPolygon) -> dict[str, Any]:
    return mapping(aoi.simplify(MAP_OUTLINE_TOLERANCE_DEG, preserve_topology=True))


def _layer_facts(
    indicator: IndicatorMetadata, value: list[str] | int | dict[str, float]
) -> LayerFacts:
    covers = indicator.covers_module
    empty: Literal["not_mapped_here", "unexpected"] | None = None
    if not value and covers is not None:
        empty = "unexpected" if covers else "not_mapped_here"
    return LayerFacts(covers_module=covers, empty_result=empty)


def _place_info(place: Place) -> PlaceInfo:
    source = place.source
    return PlaceInfo(
        id=place.id,
        name=place.name,
        kind=place.kind,
        source=f"{source.url}/{source.layer_id}",
    )


@dataclass
class CategoryMap:
    """What a map of area_by_category draws: the clipped classes and their colours.
    The area as GeoJSON, since a place id in the input carries no geometry."""

    area: dict[str, Any]
    shapes: dict[str, Any]
    styles: dict[str, Style]


@dataclass
class RasterMap:
    """What a map of class_shares_in_area draws: an image of the area and its
    surroundings, where it goes, and the classes in the legend's order.
    The area as GeoJSON, since a place id in the input carries no geometry."""

    area: dict[str, Any]
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
    place: Place | None
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
    def __init__(
        self,
        client: ArcGISClient,
        simplification: float = 0.001,
        places: Places | None = None,
    ) -> None:
        self._client = client
        self._simplification = simplification
        self._places = places if places is not None else load_places()
        self._geometries = PlaceGeometries(client)
        # Renderers change with a republish of the service, not between calls.
        self._renderers: dict[str, dict[str, Any] | None] = {}

    async def categories_in_area(
        self,
        indicator_id: int,
        area: dict[str, Any] | None = None,
        *,
        place_id: str | None = None,
    ) -> Result:
        p = await self._prepare(indicator_id, area, place_id, "presence")
        with p.watch.lap("arcgis"):
            values = await self._call(self._client.distinct(p.layer, p.aoi))
        computed_over = ComputedOver(type="feature_attributes", categories=len(values))
        return self._result(p, values, None, computed_over)

    async def count_in_area(
        self,
        indicator_id: int,
        area: dict[str, Any] | None = None,
        *,
        place_id: str | None = None,
    ) -> Result:
        p = await self._prepare(indicator_id, area, place_id, "count")
        with p.watch.lap("arcgis"):
            n = await self._call(self._client.count(p.layer, p.aoi))
        return self._result(
            p, n, p.indicator.unit, ComputedOver(type="feature_count", features=n)
        )

    async def area_by_category(
        self,
        indicator_id: int,
        area: dict[str, Any] | None = None,
        *,
        place_id: str | None = None,
    ) -> Result:
        result, _ = await self._area_by_category(
            indicator_id, area, place_id, with_map=False
        )
        return result

    async def area_by_category_map(
        self,
        indicator_id: int,
        area: dict[str, Any] | None = None,
        *,
        place_id: str | None = None,
    ) -> tuple[Result, CategoryMap]:
        """The same result as area_by_category, from the same query, and its map."""
        result, drawn = await self._area_by_category(
            indicator_id, area, place_id, with_map=True
        )
        assert drawn is not None
        return result, drawn

    async def _area_by_category(
        self,
        indicator_id: int,
        area: dict[str, Any] | None,
        place_id: str | None,
        *,
        with_map: bool,
    ) -> tuple[Result, CategoryMap | None]:
        p = await self._prepare(indicator_id, area, place_id, "area")
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
        return result, CategoryMap(
            area=_outline(p.aoi), shapes=collection, styles=styles
        )

    async def class_shares(
        self,
        indicator_id: int,
        area: dict[str, Any] | None = None,
        *,
        place_id: str | None = None,
    ) -> Result:
        result, _ = await self._class_shares(
            indicator_id, area, place_id, with_map=False
        )
        return result

    async def class_shares_map(
        self,
        indicator_id: int,
        area: dict[str, Any] | None = None,
        *,
        place_id: str | None = None,
    ) -> tuple[Result, RasterMap]:
        """The same result as class_shares, and an image of the area to draw."""
        result, drawn = await self._class_shares(
            indicator_id, area, place_id, with_map=True
        )
        assert drawn is not None
        return result, drawn

    async def _class_shares(
        self,
        indicator_id: int,
        area: dict[str, Any] | None,
        place_id: str | None,
        *,
        with_map: bool,
    ) -> tuple[Result, RasterMap | None]:
        p = await self._prepare(indicator_id, area, place_id, "class_share")
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
            to_hectares="do_not_convert",
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
            area=_outline(p.aoi),
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

    async def _prepare(
        self,
        indicator_id: int,
        area: dict[str, Any] | None,
        place_id: str | None,
        operation: Operation,
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
        with watch.lap("place"):
            aoi, place = await self._area(area, place_id)
        coverage = module_coverage(aoi)
        if coverage.status == "outside":
            raise HandlerError("The area is outside the Ecuador module.")
        return _Prepared(indicator, aoi, coverage, place, watch)

    async def _area(
        self, area: dict[str, Any] | None, place_id: str | None
    ) -> tuple[Polygon | MultiPolygon, Place | None]:
        if area is not None and place_id is not None:
            raise HandlerError("Give an area or a place_id, not both.")
        if place_id is None:
            if area is None:
                raise HandlerError(
                    "Give an area as GeoJSON, or a place_id from find_places."
                )
            try:
                return parse_aoi(area), None
            except AOIError as exc:
                raise HandlerError(str(exc)) from exc
        place = self._places.get(place_id)
        if place is None:
            raise HandlerError(
                f"Unknown place {place_id!r}. Call find_places for its current id."
            )
        geom = await self._call(self._geometries.geometry(place))
        try:
            return check_aoi(geom, max_vertices=None, reach=False), place
        except AOIError as exc:
            raise HandlerError(f"The boundary of {place.id}: {exc}") from exc

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
        classified = unclassified = overlap = None
        if isinstance(value, dict) and unit == "ha":
            classified = round(sum(value.values()), 2)
            inside_ha = aoi_ha - p.coverage.outside_ha
            unclassified = round(max(inside_ha - classified, 0.0), 2)
            excess = classified - aoi_ha
            # The simplification alone adds up to 0.03 % (layer 214); more than the
            # threshold means ground counted in two classes.
            if excess > max(OVERLAP_MIN_HA, aoi_ha * OVERLAP_MIN_SHARE):
                overlap = round(excess, 2)
        return Result(
            indicator_id=p.indicator.id,
            value=value,
            unit=unit,
            computed_over=computed_over,
            coverage=p.coverage,
            place=_place_info(p.place) if p.place else None,
            provenance=p.indicator.provenance.model_dump(),
            layer=_layer_facts(p.indicator, value),
            caveats=[c.text for c in p.indicator.caveats],
            record_counts=p.indicator.record_counts(),
            aoi_ha=aoi_ha,
            classified_ha=classified,
            unclassified_ha=unclassified,
            overlap_ha=overlap,
            timing=Timing(
                total_ms=p.watch.total_ms(),
                arcgis_ms=p.watch.ms("arcgis"),
                clip_ms=p.watch.ms("clip"),
                place_ms=p.watch.ms("place"),
                vertices_sent=vertex_count(p.aoi),
                vertices_received=vertices_received,
            ),
        )
