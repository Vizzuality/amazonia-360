from collections.abc import Awaitable, Callable
from typing import Annotated, Any

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.errors import HandlerError
from mcp_server.handlers.result import Result
from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.stopwatch import Stopwatch

QUERY = ToolAnnotations(read_only_hint=True, open_world_hint=True)

IndicatorId = Annotated[int, Field(description="Indicator id from list_indicators.")]
Area = Annotated[
    dict[str, Any],
    Field(description="GeoJSON Polygon or MultiPolygon geometry in WGS84 (EPSG:4326)."),
]


async def logged_call[T](
    call_log: CallLog,
    tool: str,
    indicator_id: int,
    call: Awaitable[T],
    result_of: Callable[[T], Result],
) -> T:
    """Runs a handler call, logs it for the measurement run, and turns errors into
    ToolErrors whose text says the cause."""
    watch = Stopwatch()
    try:
        out = await call
    except HandlerError as exc:
        call_log.write(
            {
                "tool": tool,
                "indicator_id": indicator_id,
                "ok": False,
                "error": str(exc),
                "elapsed_ms": watch.total_ms(),
            }
        )
        raise ToolError(str(exc)) from exc
    except Exception as exc:
        # The measurement log must capture pathological failures too, not only
        # the expected refusals raised as HandlerError. The model gets the cause
        # as well: a bare "Error executing tool" left it guessing in the trial.
        error = f"{type(exc).__name__}: {exc}"
        call_log.write(
            {
                "tool": tool,
                "indicator_id": indicator_id,
                "ok": False,
                "error": error,
                "elapsed_ms": watch.total_ms(),
            }
        )
        raise ToolError(f"Unexpected error in {tool}: {error}") from exc
    result = result_of(out)
    call_log.write(
        {
            "tool": tool,
            "indicator_id": indicator_id,
            "ok": True,
            "aoi_ha": result.aoi_ha,
            "features": result.computed_over.features,
            "categories": result.computed_over.categories,
            "timing": result.timing.model_dump(),
        }
    )
    return out


def register_area_tools(
    server: MCPServer, handlers: AreaHandlers, call_log: CallLog
) -> None:
    async def run(
        tool: str,
        indicator_id: int,
        call: Callable[[int, dict[str, Any]], Awaitable[Result]],
        area: dict[str, Any],
    ) -> Result:
        return await logged_call(
            call_log, tool, indicator_id, call(indicator_id, area), lambda r: r
        )

    @server.tool(annotations=QUERY)
    async def categories_in_area(indicator_id: IndicatorId, area: Area) -> Result:
        """Which classes of a categorical layer are present in the area. Fast."""
        return await run(
            "categories_in_area", indicator_id, handlers.categories_in_area, area
        )

    @server.tool(annotations=QUERY)
    async def count_in_area(indicator_id: IndicatorId, area: Area) -> Result:
        """How many discrete features of a count layer fall in the area. Fast."""
        return await run("count_in_area", indicator_id, handlers.count_in_area, area)

    @server.tool(annotations=QUERY)
    async def area_by_category(indicator_id: IndicatorId, area: Area) -> Result:
        """Hectares of each class inside the area, clipped to it.

        Slow: several seconds to tens of seconds per call. Ask for one indicator at a
        time.
        """
        return await run(
            "area_by_category", indicator_id, handlers.area_by_category, area
        )

    @server.tool(annotations=QUERY)
    async def class_shares_in_area(indicator_id: IndicatorId, area: Area) -> Result:
        """Share of the area's pixels in each class of a classed raster. Fast.

        A share of pixels, not of hectares: see computed_over for how many pixels
        and how large.
        """
        return await run(
            "class_shares_in_area", indicator_id, handlers.class_shares, area
        )
