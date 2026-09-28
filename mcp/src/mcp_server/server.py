from typing import Any

import httpx
from mcp.server.auth.provider import OAuthAuthorizationServerProvider
from mcp.server.auth.settings import AuthSettings
from mcp.server.mcpserver import MCPServer

from mcp_server import __version__
from mcp_server.arcgis.client import ArcGISClient
from mcp_server.config import Settings
from mcp_server.handlers.area import AreaHandlers
from mcp_server.maps import register_map_tools
from mcp_server.measurement.call_log import CallLog
from mcp_server.tools.area import register_area_tools
from mcp_server.tools.catalogue import register_catalogue_tools

INSTRUCTIONS = """\
Answers questions about the physical and natural environment of the Ecuador module of
Amazonia 360, over an area the user provides as a GeoJSON polygon. The module's own
layers, and a few classed rasters of the regional platform (slope, land cover, forest
cover, canopy height, grassland), both over areas in the module.

Start with list_indicators. Use categories_in_area, count_in_area and
class_shares_in_area first; they are fast. area_by_category is slow and should be
called for one indicator at a time.

Every answer says what it was computed over (computed_over), where the area falls
against the module (coverage) and what the layer covers (layer); each field is described
in the tool's output schema. caveats holds known defects of the dataset, written by a
person in the CMS; quote them unchanged. Figures from different indicators are not meant
to be combined.

When the user asks to see a result on a map, map_area_by_category returns the same
figures as area_by_category and draws them for the user; map_class_shares_in_area does
the same for class_shares_in_area. The map shows the figures and their notes; the
answer still needs them.
"""


def create_mcp_server(
    handlers: AreaHandlers | None = None,
    call_log: CallLog | None = None,
    settings: Settings | None = None,
    *,
    auth: AuthSettings | None = None,
    auth_server_provider: OAuthAuthorizationServerProvider[Any, Any, Any] | None = None,
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
        auth=auth,
        auth_server_provider=auth_server_provider,
    )
    register_catalogue_tools(server)
    register_area_tools(server, handlers, call_log)
    register_map_tools(server, handlers, call_log)
    return server
