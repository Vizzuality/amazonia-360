"""A stdio MCP client session to the amazonia360 server, for the model measurement."""

from __future__ import annotations

import os
import sys
from collections.abc import AsyncIterator
from contextlib import ExitStack, asynccontextmanager
from pathlib import Path

from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.types import CallToolResult, PaginatedRequestParams, TextContent, Tool

from mcp_server.store.sources import SOURCE_NAMES

MCP_DIR = Path(__file__).parents[4]
# A tool call never needs longer than the question that makes it.
CALL_TIMEOUT_SECONDS = 600.0


class ServerSession:
    def __init__(
        self, session: ClientSession, instructions: str, tools: list[dict]
    ) -> None:
        self._session = session
        self.instructions = instructions
        self.tools = tools

    async def call_tool(self, name: str, arguments: dict) -> tuple[str, bool]:
        # The question loop does not catch: every failure has to come back as text.
        try:
            result = await self._session.call_tool(
                name, arguments, read_timeout_seconds=CALL_TIMEOUT_SECONDS
            )
        except Exception as exc:
            return f"{type(exc).__name__}: {exc}", True
        if not isinstance(result, CallToolResult):
            return f"Unexpected result type: {type(result).__name__}", True
        text = "\n".join(
            block.text for block in result.content if isinstance(block, TextContent)
        )
        return text, bool(result.is_error)


def _openai_tool(tool: Tool) -> dict:
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description or "",
            "parameters": tool.input_schema,
        },
    }


async def _list_tools(session: ClientSession) -> list[Tool]:
    tools: list[Tool] = []
    cursor: str | None = None
    while True:
        params = PaginatedRequestParams(cursor=cursor) if cursor else None
        page = await session.list_tools(params=params)
        tools.extend(page.tools)
        cursor = page.next_cursor
        if not cursor:
            return tools


@asynccontextmanager
async def server_session(
    env: dict[str, str], errlog_path: Path | None = None
) -> AsyncIterator[ServerSession]:
    params = StdioServerParameters(
        command="uv",
        args=["run", "amazonia360-mcp"],
        env={**os.environ, **env},
        cwd=MCP_DIR,
    )
    # The server's httpx INFO lines would bury the CLI's progress on a shared stderr.
    with ExitStack() as stack:
        errlog = (
            stack.enter_context(errlog_path.open("a", encoding="utf-8"))
            if errlog_path
            else sys.stderr
        )
        async with (
            stdio_client(params, errlog=errlog) as (read, write),
            ClientSession(read, write) as session,
        ):
            initialized = await session.initialize()
            tools = [_openai_tool(tool) for tool in await _list_tools(session)]
            yield ServerSession(session, initialized.instructions or "", tools)


def system_prompt(instructions: str, skill_path: Path) -> str:
    body = skill_path.read_text(encoding="utf-8")
    if body.startswith("---\n"):
        end = body.find("\n---\n", 4)
        if end != -1:
            body = body[end + len("\n---\n") :]
    return f"{instructions}\n\n{body.lstrip()}"


def area_sources(store: bool) -> str:
    # Set in both cases: a variable exported in the shell must not change a run.
    return ",".join(SOURCE_NAMES) if store else "arcgis"


def server_env(run_id: str, question: int, store: bool) -> dict[str, str]:
    return {
        "MCP_RUN_ID": run_id,
        "MCP_QUESTION": str(question),
        "MCP_AREA_SOURCES": area_sources(store),
    }
