from collections.abc import Awaitable
from typing import Annotated, Any

from mcp.server.mcpserver import Context, MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server.documents.search import (
    DEFAULT_LIMIT,
    MAX_LIMIT,
    DocumentSearch,
    SearchResult,
    Section,
    TopicList,
)
from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.stopwatch import Stopwatch
from mcp_server.tools.area import _caller, _session

_READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)


async def _logged[T](
    call_log: CallLog, tool: str, ctx: Context, call: Awaitable[T], **fields: Any
) -> T:
    """Awaits a document lookup and logs it. An unknown document or section reaches
    the client as a tool error with its text, any other failure with its type, and
    neither as an empty result."""
    watch = Stopwatch()

    def log(ok: bool, **extra: Any) -> None:
        call_log.write(
            {
                "tool": tool,
                "user": _caller(),
                "session": _session(ctx),
                **fields,
                "ok": ok,
                **extra,
                "elapsed_ms": watch.total_ms(),
            }
        )

    try:
        out = await call
    except LookupError as exc:
        log(False, error=str(exc))
        raise ToolError(str(exc)) from exc
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"
        log(False, error=error)
        raise ToolError(f"Unexpected error in {tool}: {error}") from exc
    log(True)
    return out


def register_document_tools(
    server: MCPServer, documents: DocumentSearch, call_log: CallLog
) -> None:
    @server.tool(annotations=_READ_ONLY)
    async def list_topics(ctx: Context) -> TopicList:
        """The topics the indexed documents are filed under, and every document with
        its id, title, authors and year. Use a topic id as topic in
        search_documents."""
        return await _logged(call_log, "list_topics", ctx, documents.list_topics())

    @server.tool(annotations=_READ_ONLY)
    async def search_documents(
        query: Annotated[
            str,
            Field(
                min_length=1,
                max_length=500,
                description="What to look for, as a question or key phrases.",
            ),
        ],
        ctx: Context,
        topic: Annotated[
            str | None,
            Field(
                max_length=200,
                description="A topic id or name from list_topics; omit to search "
                "every document.",
            ),
        ] = None,
        place_id: Annotated[
            str | None,
            Field(
                max_length=200,
                description="A place id from find_places, to search the topics tied "
                "to that place.",
            ),
        ] = None,
        limit: Annotated[
            int,
            Field(ge=1, le=MAX_LIMIT, description="Most passages to return."),
        ] = DEFAULT_LIMIT,
    ) -> SearchResult:
        """Passages of the indexed papers and reports that answer the query, each
        with its document, section, page and link. related_documents lists documents
        whose summary matches but that yielded no passage. Answer about documents only
        from passages."""
        return await _logged(
            call_log,
            "search_documents",
            ctx,
            documents.search(query, topic, place_id, limit),
            query=query,
            topic=topic,
            place_id=place_id,
            limit=limit,
        )

    @server.tool(annotations=_READ_ONLY)
    async def get_document_section(
        document_id: Annotated[
            str,
            Field(
                max_length=200,
                description="A document_id from search_documents or list_topics.",
            ),
        ],
        section_path: Annotated[
            str,
            Field(
                min_length=1,
                max_length=1000,
                description="The section of a passage, exactly as search_documents "
                "returned it.",
            ),
        ],
        ctx: Context,
    ) -> Section:
        """The full text of one section of a document, to read around a passage.
        Figure descriptions are left out; search_documents returns them."""
        return await _logged(
            call_log,
            "get_document_section",
            ctx,
            documents.section(document_id, section_path),
            document_id=document_id,
            section_path=section_path,
        )
