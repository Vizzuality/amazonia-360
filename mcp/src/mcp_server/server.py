import httpx
from mcp.server.mcpserver import MCPServer

from mcp_server import __version__
from mcp_server.arcgis.client import ArcGISClient
from mcp_server.config import Settings
from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.tools.area import register_area_tools
from mcp_server.tools.catalogue import register_catalogue_tools

INSTRUCTIONS = """\
Answers questions about the physical and natural environment of the Ecuador module of
Amazonia 360, over an area the user provides as a GeoJSON polygon.

Start with list_indicators. Use categories_in_area and count_in_area first; they are
fast. area_by_category is slow and should be called for one indicator at a time.

Every answer says what it was computed over (computed_over) and carries caveats. Quote
the caveats when you use the number, and never combine figures from different
indicators into one total.
"""


def create_mcp_server(
    handlers: AreaHandlers | None = None,
    call_log: CallLog | None = None,
    settings: Settings | None = None,
) -> MCPServer:
    settings = settings or Settings.from_env()
    if handlers is None:
        http = httpx.AsyncClient(timeout=settings.arcgis_timeout_s)
        handlers = AreaHandlers(ArcGISClient(http))
    call_log = call_log or CallLog(settings.call_log_path)

    server = MCPServer(
        name="amazonia360",
        title="Amazonia 360 — Ecuador module",
        instructions=INSTRUCTIONS,
        version=__version__,
    )
    register_catalogue_tools(server)
    register_area_tools(server, handlers, call_log)
    return server
