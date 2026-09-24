from typing import Annotated, Any

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server import catalogue
from mcp_server.catalogue.models import IndicatorMetadata, Operation

_READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)

_LIST_FIELDS = {
    "id",
    "name",
    "description_short",
    "subtopic",
    "value_type",
    "available",
    "ai_answerable",
}

_TOOL_FOR: dict[Operation, str] = {
    "presence": "categories_in_area",
    "count": "count_in_area",
    "area": "area_by_category",
}


def _tools(indicator: IndicatorMetadata) -> list[str]:
    # The same checks the handlers make, so the model is not sent to a refusal.
    if not (indicator.available and indicator.ai_answerable):
        return []
    return [tool for op, tool in _TOOL_FOR.items() if indicator.allows(op)]


def register_catalogue_tools(server: MCPServer) -> None:
    @server.tool(annotations=_READ_ONLY)
    async def list_indicators(
        subtopic_id: Annotated[
            int | None, Field(description="Only indicators in this subtopic.")
        ] = None,
    ) -> dict[str, Any]:
        """List the Ecuador module indicators, with the tools each one can be asked
        through. An indicator with no tools cannot be answered about."""
        return {
            "indicators": [
                {**i.model_dump(include=_LIST_FIELDS), "tools": _tools(i)}
                for i in catalogue.list_indicators(subtopic_id)
            ]
        }

    @server.tool(annotations=_READ_ONLY)
    async def describe_indicator(
        indicator_id: Annotated[int, Field(description="Indicator id.")],
    ) -> dict[str, Any]:
        """Unit, value type, provenance and known caveats of one indicator."""
        indicator = catalogue.get_indicator_metadata(indicator_id)
        if indicator is None:
            raise ToolError(f"Unknown indicator {indicator_id}.")
        mismatch = indicator.count_mismatch()
        return {
            **indicator.model_dump(mode="json"),
            # Computed, not stored, so it has to be added here for the model to see it.
            "known_issues": [mismatch] if mismatch else [],
        }
