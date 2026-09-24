from typing import Annotated, Any

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server import catalogue

_READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)

_LIST_FIELDS = {"id", "name", "subtopic", "value_type", "available"}


def register_catalogue_tools(server: MCPServer) -> None:
    @server.tool(annotations=_READ_ONLY)
    async def list_indicators(
        subtopic_id: Annotated[
            int | None, Field(description="Only indicators in this subtopic.")
        ] = None,
    ) -> dict[str, Any]:
        """List the Ecuador module indicators this server can answer about."""
        return {
            "indicators": [
                i.model_dump(include=_LIST_FIELDS)
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
