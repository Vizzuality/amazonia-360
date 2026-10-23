import json
from collections.abc import AsyncIterator
from dataclasses import replace
from pathlib import Path
from typing import Any

import httpx
import pytest
from langchain_core.messages import AIMessage, BaseMessage

from mcp_server.chat.app import ChatService, create_chat_app
from mcp_server.chat.settings import ChatSettings
from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.model_run.config import ModelSpec
from mcp_server.server import create_mcp_server
from tests.test_handlers import FakeClient

pytestmark = [pytest.mark.anyio, pytest.mark.usefixtures("fixed_catalogue")]

DEV = "d" * 32
AUTH = {"Authorization": f"Bearer {DEV}"}
USAGE = {"input_tokens": 1000, "output_tokens": 100, "total_tokens": 1100}
QUESTION = {
    "threadId": "t1",
    "runId": "r1",
    "messages": [{"id": "u1", "role": "user", "content": "Which ecosystems in Tena?"}],
    "tools": [],
    "context": [],
    "forwardedProps": {"locale": "es"},
}


class Model:
    """A chat factory whose model looks Tena up, then answers."""

    def __init__(self) -> None:
        self.tools: list[str] = []
        self.prompts: list[str] = []

    def __call__(self, spec: ModelSpec, tools: list[dict]) -> Any:
        if tools:
            self.tools = [t["function"]["name"] for t in tools]
        replies = [
            AIMessage(
                content="",
                tool_calls=[
                    {"id": "c1", "name": "find_places", "args": {"query": "Tena"}}
                ],
                usage_metadata=USAGE,
            ),
            AIMessage(content="Tena es un cantón.", usage_metadata=USAGE),
        ]

        async def chat(messages: list[BaseMessage]) -> AIMessage:
            self.prompts.append(str(messages[0].content))
            return replies.pop(0)

        return chat


def settings(tmp_path: Path, **changes: Any) -> ChatSettings:
    base = ChatSettings(
        model="sonnet",
        dev_tokens={DEV: "ana"},
        jwks_url=None,
        jwt_issuer=None,
        allowed_origins=("https://front.test",),
        max_turns=60,
        max_seconds=300,
        run_log_path=tmp_path / "runs.jsonl",
    )
    return replace(base, **changes)


@pytest.fixture
def model() -> Model:
    return Model()


@pytest.fixture
async def http(tmp_path: Path, model: Model) -> AsyncIterator[httpx.AsyncClient]:
    chosen = settings(tmp_path)
    server = create_mcp_server(
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )
    app = create_chat_app(ChatService(chosen, server, chat_factory=model), chosen)
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://chat.test"
    ) as client:
        yield client


def events(response: httpx.Response) -> list[dict[str, Any]]:
    frames = [f for f in response.text.split("\n\n") if f]
    assert all(f.startswith("data: ") and "\n" not in f for f in frames)
    return [json.loads(f.removeprefix("data: ")) for f in frames]


async def test_a_question_streams_its_tool_calls_and_answer(
    http: httpx.AsyncClient, model: Model, tmp_path: Path
) -> None:
    response = await http.post("/chat", json=QUESTION, headers=AUTH)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    out = events(response)
    assert out[0]["type"] == "RUN_STARTED"
    assert out[-1]["type"] == "RUN_FINISHED"
    result = next(e for e in out if e["type"] == "TOOL_CALL_RESULT")
    places = json.loads(result["content"])["places"]
    assert places[0]["id"] == "canton:Napo/Tena"
    assert "Answer in Spanish." in model.prompts[0]


async def test_the_model_gets_every_tool_but_the_maps(
    http: httpx.AsyncClient, model: Model
) -> None:
    await http.post("/chat", json=QUESTION, headers=AUTH)
    assert "find_places" in model.tools
    assert "area_by_category" in model.tools
    assert not {"map_area_by_category", "map_class_shares_in_area"} & set(model.tools)


async def test_the_logs_name_the_user_and_the_thread(
    http: httpx.AsyncClient, tmp_path: Path
) -> None:
    await http.post("/chat", json=QUESTION, headers=AUTH)
    [call] = [
        json.loads(line) for line in (tmp_path / "calls.jsonl").read_text().splitlines()
    ]
    assert (call["tool"], call["user"], call["session"]) == ("find_places", "ana", "t1")
    [run] = [
        json.loads(line) for line in (tmp_path / "runs.jsonl").read_text().splitlines()
    ]
    assert run["user"] == "ana"
    assert (run["thread"], run["run"], run["ended"]) == ("t1", "r1", "answer")
    assert run["toolCalls"] == 1


async def test_without_a_token_the_chat_is_refused(http: httpx.AsyncClient) -> None:
    response = await http.post("/chat", json=QUESTION)
    assert response.status_code == 401
    assert response.json()["error"] == "unauthenticated"


async def test_a_bad_body_is_refused(http: httpx.AsyncClient) -> None:
    response = await http.post("/chat", content=b"{not json", headers=AUTH)
    assert response.status_code == 400
    response = await http.post("/chat", json={**QUESTION, "messages": []}, headers=AUTH)
    assert response.status_code == 400
    assert response.json()["error"] == "bad_request"


async def test_with_no_authentication_set_the_chat_is_off(tmp_path: Path) -> None:
    off = settings(tmp_path, dev_tokens={})
    server = create_mcp_server(
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )
    app = create_chat_app(ChatService(off, server, chat_factory=Model()), off)
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://chat.test"
    ) as client:
        response = await client.post("/chat", json=QUESTION, headers=AUTH)
    assert response.status_code == 503


async def test_a_missing_model_key_turns_the_chat_off(tmp_path: Path) -> None:
    def no_key(spec: ModelSpec, tools: list[dict]) -> Any:
        raise ValueError("ANTHROPIC_API_KEY is not set")

    chosen = settings(tmp_path)
    server = create_mcp_server(
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )
    app = create_chat_app(ChatService(chosen, server, chat_factory=no_key), chosen)
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://chat.test"
    ) as client:
        response = await client.post("/chat", json=QUESTION, headers=AUTH)
    assert response.status_code == 503
    assert "ANTHROPIC_API_KEY" in response.json()["message"]


@pytest.mark.parametrize("origin", ["https://front.test", "http://localhost:5173"])
async def test_the_front_end_origins_pass_the_preflight(
    http: httpx.AsyncClient, origin: str
) -> None:
    response = await http.options(
        "/chat",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type,x-run-id",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


async def test_another_origin_fails_the_preflight(http: httpx.AsyncClient) -> None:
    response = await http.options(
        "/chat",
        headers={
            "Origin": "https://evil.test",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in response.headers
