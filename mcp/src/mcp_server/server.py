from typing import Any

import httpx
from mcp.server.auth.provider import OAuthAuthorizationServerProvider
from mcp.server.auth.settings import AuthSettings
from mcp.server.mcpserver import MCPServer

from mcp_server import __version__
from mcp_server.arcgis.client import ArcGISClient
from mcp_server.config import Settings
from mcp_server.documents.search import DocumentSearch, build_document_search
from mcp_server.documents.settings import DocsSettings
from mcp_server.handlers.area import SIMPLIFICATION_DEG, AreaHandlers
from mcp_server.maps import register_map_tools
from mcp_server.measurement.call_log import CallLog
from mcp_server.places import Places, load_places
from mcp_server.store.files import LayerStore
from mcp_server.store.sources import (
    ArcGISSource,
    AreaSource,
    LocalCopySource,
    PrecomputedSource,
    SourceName,
    SourceSelector,
)
from mcp_server.tools.area import register_area_tools
from mcp_server.tools.catalogue import register_catalogue_tools
from mcp_server.tools.documents import register_document_tools
from mcp_server.tools.places import register_place_tools

INSTRUCTIONS = """\
Answers questions about the physical and natural environment of the Ecuador module of
Amazonia 360, over a province, canton or protected area the user names, or a GeoJSON
polygon. The module's own layers, and a few classed rasters of the regional platform
(slope, land cover, forest cover, canopy height, grassland), both over areas in the
module.

Settle the area first, then call list_indicators. A province, canton or protected area
of the module can be named instead of drawn: find_places returns a place_id that every
area tool takes instead of area. When several places match, ask the user which one.
For questions over several places, take the names from list_places, never from your own
knowledge.

Provinces and cantons often extend beyond the module. Report coverage.outside_ha as
outside the module, separately from unclassified land, which counts only land inside it.

Every answer says what it was computed over (computed_over), where the area falls
against the module (coverage) and what the layer covers (layer); each field is described
in the tool's output schema. caveats holds known defects of the dataset, written by a
person in the CMS; quote them unchanged. Never combine figures from different
indicators, and never turn a share of pixels into hectares.
"""

DOCUMENT_INSTRUCTIONS = """\
Documents: papers and reports indexed for the module. On every question about a place
or theme of the module, call search_documents alongside the data tools, not only when
the user mentions documents. Search the whole corpus; pass topic only when the user asks
about one topic or the results drift to other places.
Answer about documents only from passages. When related_documents has entries but no
passage answers the question, name those documents with their link and say they cover
the subject but do not answer the question; never answer from a summary as if it were a
passage. When both lists are empty, say the indexed documents do not cover it.
State a figure from a document with its document and year, and a figure from an
indicator with the indicator; never combine, total or compare them as the same measure.
Quote the sentence that states a number. Give the link of every passage used, and say
when a passage is a figure description (origin "figure").
"""


def build_selector(
    names: tuple[SourceName, ...],
    client: ArcGISClient,
    store: LayerStore,
    places: Places,
) -> SourceSelector:
    def source(name: SourceName) -> AreaSource:
        if name == "precomputed":
            return PrecomputedSource(store, places.snapshot.generated_at)
        if name == "local_copy":
            return LocalCopySource(store)
        return ArcGISSource(client, SIMPLIFICATION_DEG)

    return SourceSelector([source(name) for name in names])


def create_mcp_server(
    handlers: AreaHandlers | None = None,
    call_log: CallLog | None = None,
    settings: Settings | None = None,
    *,
    places: Places | None = None,
    documents: DocumentSearch | None = None,
    auth: AuthSettings | None = None,
    auth_server_provider: OAuthAuthorizationServerProvider[Any, Any, Any] | None = None,
) -> MCPServer:
    settings = settings or Settings.from_env()
    places = places or load_places()
    if handlers is None:
        http = httpx.AsyncClient(timeout=settings.arcgis_timeout_s)
        client = ArcGISClient(http)
        store = LayerStore(settings.layer_store_path)
        handlers = AreaHandlers(
            client,
            places=places,
            selector=build_selector(settings.area_sources, client, store, places),
            store=store,
        )
    call_log = call_log or CallLog(settings.call_log_path, settings.call_context)
    if documents is None:
        docs_settings = DocsSettings.from_env()
        if docs_settings is not None:
            documents = build_document_search(docs_settings, places)

    server = MCPServer(
        name="amazonia360",
        title="Amazonia 360 — Ecuador module",
        instructions=(
            INSTRUCTIONS
            if documents is None
            else f"{INSTRUCTIONS}\n{DOCUMENT_INSTRUCTIONS}"
        ),
        version=__version__,
        auth=auth,
        auth_server_provider=auth_server_provider,
    )
    register_catalogue_tools(server, call_log)
    register_place_tools(server, places, call_log)
    register_area_tools(server, handlers, call_log)
    register_map_tools(server, handlers, call_log)
    if documents is not None:
        register_document_tools(server, documents, call_log)
    return server
