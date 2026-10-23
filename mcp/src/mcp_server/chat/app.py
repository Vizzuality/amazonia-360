"""POST /chat: the front end's chat, over the MCP server in process."""

import json
from collections.abc import AsyncIterator, Callable
from typing import Any

from mcp import Client
from mcp.server.mcpserver import MCPServer
from mcp.types import CallToolResult, TextContent, Tool
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response, StreamingResponse
from starlette.routing import Route
from starlette.types import ASGIApp

from mcp_server.chat import agui
from mcp_server.chat.auth import TokenVerifier, UnauthenticatedError
from mcp_server.chat.run import RunLimits, stream_run
from mcp_server.chat.settings import ChatSettings
from mcp_server.measurement.call_log import CHAT_CALLER, CallLog
from mcp_server.measurement.model_run.config import ModelSpec, load_models
from mcp_server.measurement.model_run.loop import ChatTurn
from mcp_server.measurement.model_run.providers import make_chat
from mcp_server.measurement.model_run.session import MCP_DIR, system_prompt

MODELS_PATH = MCP_DIR / "measurement" / "models.toml"
SKILL_PATH = MCP_DIR / "skills" / "amazonia360" / "SKILL.md"
# The front end draws every area result on its own map.
MAP_TOOLS = {"map_area_by_category", "map_class_shares_in_area"}
CALL_TIMEOUT_S = 600.0

ChatFactory = Callable[[ModelSpec, list[dict]], ChatTurn]


def chat_prompt(instructions: str, locale: str) -> str:
    return (
        f"{system_prompt(instructions, SKILL_PATH)}\n\n"
        "## This chat\n\n"
        "This chat is part of the Amazonia 360 platform, which draws every area "
        "result on its own map next to the answer. The map tools are not available "
        "here; never offer to draw a map. "
        f"Answer in {agui.LOCALES[locale]}.\n"
    )


def _openai_tool(tool: Tool) -> dict:
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description or "",
            "parameters": tool.input_schema,
        },
    }


def _error(status: int, code: str, message: str) -> Response:
    return JSONResponse({"error": code, "message": message}, status_code=status)


class ChatService:
    def __init__(
        self,
        settings: ChatSettings,
        server: MCPServer,
        *,
        verifier: TokenVerifier | None = None,
        chat_factory: ChatFactory | None = None,
        run_log: CallLog | None = None,
    ) -> None:
        self.settings = settings
        self._server = server
        self._verifier = verifier or TokenVerifier(settings)
        self._chat_factory = chat_factory or make_chat
        self._run_log = run_log or CallLog(settings.run_log_path)
        self._spec = load_models(MODELS_PATH, [settings.model])[0]

    async def endpoint(self, request: Request) -> Response:
        if not self.settings.has_auth:
            return _error(503, "chat_disabled", "The chat has no authentication set.")
        try:
            user = await self._verifier.user(request.headers.get("authorization"))
        except UnauthenticatedError as exc:
            return _error(401, "unauthenticated", str(exc))
        try:
            run = agui.parse_run_input(await request.json())
        except json.JSONDecodeError:
            return _error(400, "bad_request", "The body is not JSON.")
        except agui.BadRequestError as exc:
            return _error(400, "bad_request", str(exc))
        try:
            # Built per run so a missing key is a 503, not a broken stream.
            self._chat_factory(self._spec, [])
        except ValueError as exc:
            return _error(503, "chat_disabled", str(exc))
        return StreamingResponse(
            self._frames(user, run),
            media_type="text/event-stream",
            # nginx would otherwise buffer the stream until the run ends.
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    async def _frames(self, user: str, run: agui.RunInput) -> AsyncIterator[str]:
        summary: dict[str, Any] = {"model": self._spec.label}
        # Set before the client starts the server's tasks, which copy the context.
        token = CHAT_CALLER.set((user, run.thread_id))
        try:
            async with Client(self._server) as client:
                tools = [
                    t
                    for t in (await client.list_tools()).tools
                    if t.name not in MAP_TOOLS
                ]
                chat = self._chat_factory(self._spec, [_openai_tool(t) for t in tools])

                async def call_tool(name: str, args: dict) -> tuple[str, bool]:
                    return await self._call_tool(client, name, args)

                events = stream_run(
                    chat,
                    call_tool,
                    chat_prompt(client.instructions or "", run.locale),
                    run,
                    RunLimits(self.settings.max_turns, self.settings.max_seconds),
                    self._spec.price,
                    summary,
                )
                async for event in events:
                    yield agui.frame(event)
        finally:
            CHAT_CALLER.reset(token)
            self._run_log.write(
                {"user": user, "thread": run.thread_id, "run": run.run_id, **summary}
            )

    @staticmethod
    async def _call_tool(client: Client, name: str, args: dict) -> tuple[str, bool]:
        # A tool's failure goes back to the model as text, as on any MCP host.
        if name in MAP_TOOLS:
            return f"Unknown tool: {name}", True
        try:
            result = await client.call_tool(
                name, args, read_timeout_seconds=CALL_TIMEOUT_S
            )
        except Exception as exc:
            return f"{type(exc).__name__}: {exc}", True
        if not isinstance(result, CallToolResult):
            return f"Unexpected result type: {type(result).__name__}", True
        text = "\n".join(
            block.text for block in result.content if isinstance(block, TextContent)
        )
        return text, bool(result.is_error)


def chat_endpoint(service: ChatService, settings: ChatSettings) -> ASGIApp:
    async def app(scope: Any, receive: Any, send: Any) -> None:
        request = Request(scope, receive)
        if request.method != "POST":
            await _error(405, "bad_request", "Use POST.")(scope, receive, send)
            return
        response = await service.endpoint(request)
        await response(scope, receive, send)

    return CORSMiddleware(
        app,
        allow_origins=list(settings.allowed_origins),
        allow_origin_regex=settings.local_origins,
        allow_methods=["POST"],
        # TanStack AI's fetch adapters send X-Run-Id on every request.
        allow_headers=["authorization", "content-type", "x-run-id"],
        max_age=600,
    )


def chat_route(path: str, service: ChatService, settings: ChatSettings) -> Route:
    return Route(path, chat_endpoint(service, settings))


def create_chat_app(service: ChatService, settings: ChatSettings) -> Starlette:
    """The chat alone, for local development: no OAuth and no database."""
    return Starlette(routes=[chat_route("/chat", service, settings)])
