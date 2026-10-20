from typing import Annotated

from mcp.server.mcpserver import Context, MCPServer
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server.measurement.call_log import CallLog
from mcp_server.places import Places
from mcp_server.places.models import PlaceKind, PlaceMatches
from mcp_server.tools.area import log_lookup

_READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)


def register_place_tools(server: MCPServer, places: Places, call_log: CallLog) -> None:
    @server.tool(annotations=_READ_ONLY)
    async def find_places(
        query: Annotated[
            str,
            Field(
                min_length=1,
                max_length=200,
                description="A place name, e.g. 'Tena' or 'Yasuní'.",
            ),
        ],
        ctx: Context,
        kind: Annotated[
            PlaceKind | None, Field(description="Only places of this kind.")
        ] = None,
    ) -> PlaceMatches:
        """Provinces, cantons and protected areas of the Ecuador module with this
        name. Each match has an id to pass as place_id to any area tool, instead of
        an area. Every match is returned; when there are several, ask the user."""
        return log_lookup(
            call_log,
            "find_places",
            ctx,
            lambda: places.find(query, kind),
            query=query,
            kind=kind,
        )

    @server.tool(annotations=_READ_ONLY)
    async def list_places(
        kind: Annotated[PlaceKind, Field(description="The kind of place to list.")],
        ctx: Context,
        province: Annotated[
            str | None,
            Field(
                min_length=1,
                max_length=200,
                description="With kind='canton': only the cantons of this province.",
            ),
        ] = None,
    ) -> PlaceMatches:
        """Every province, canton or protected area of the Ecuador module, or the
        cantons of one province. For questions over several places, such as
        comparing the cantons of a province or ranking the protected areas: call an
        area tool once per place, with its id as place_id."""
        return log_lookup(
            call_log,
            "list_places",
            ctx,
            lambda: places.of_kind(kind, province),
            kind=kind,
            province=province,
        )
