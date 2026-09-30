from typing import Annotated

from mcp.server.mcpserver import MCPServer
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server.places import Places
from mcp_server.places.models import PlaceKind, PlaceMatches

_READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)


def register_place_tools(server: MCPServer, places: Places) -> None:
    @server.tool(annotations=_READ_ONLY)
    async def find_places(
        query: Annotated[
            str,
            Field(min_length=1, description="A place name, e.g. 'Tena' or 'Yasuní'."),
        ],
        kind: Annotated[
            PlaceKind | None, Field(description="Only places of this kind.")
        ] = None,
    ) -> PlaceMatches:
        """Provinces, cantons and protected areas of the Ecuador module with this
        name. Each match has an id to pass as place_id to any area tool, instead of
        an area. Every match is returned; when there are several, ask the user."""
        return places.find(query, kind)
