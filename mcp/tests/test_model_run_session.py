import json
from datetime import date
from pathlib import Path

import pytest
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)

from mcp_server.measurement.model_run import providers
from mcp_server.measurement.model_run.config import ModelSpec
from mcp_server.measurement.model_run.pricing import Price
from mcp_server.measurement.model_run.providers import (
    PreflightError,
    make_chat,
    preflight,
)
from mcp_server.measurement.model_run.session import (
    server_env,
    server_session,
    system_prompt,
)

SKILL = Path(__file__).parents[1] / "skills" / "amazonia360" / "SKILL.md"
PRICE = Price(
    input=3.0,
    cached_input=0.3,
    cache_write=3.75,
    output=15.0,
    read_on=date(2026, 10, 1),
    source="https://example.test/pricing",
)
SONNET = ModelSpec("sonnet", "anthropic", "claude-sonnet-test", PRICE)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "find_places",
            "description": "d",
            "parameters": {"type": "object", "properties": {}},
        },
    }
]
EPHEMERAL = {"type": "ephemeral"}


class FakeChat:
    """Stands in for a provider class; records what it was built and called with."""

    instances: list["FakeChat"] = []  # noqa: RUF012
    error: Exception | None = None

    def __init__(self, **kwargs: object) -> None:
        self.kwargs = kwargs
        self.bound: tuple[list[dict], dict] | None = None
        self.received: list[BaseMessage] = []
        FakeChat.instances.append(self)

    def bind_tools(self, tools: list[dict], **kwargs: object) -> "FakeChat":
        self.bound = (tools, kwargs)
        return self

    async def ainvoke(self, messages: list[BaseMessage]) -> AIMessage:
        if FakeChat.error is not None:
            raise FakeChat.error
        self.received = messages
        return AIMessage("ok")


@pytest.fixture
def fake_anthropic(monkeypatch: pytest.MonkeyPatch) -> type[FakeChat]:
    FakeChat.instances = []
    FakeChat.error = None
    monkeypatch.setattr(providers, "ChatAnthropic", FakeChat)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    return FakeChat


@pytest.mark.anyio
async def test_session_lists_the_published_tools():
    async with server_session(server_env("r", 1, store=True)) as s:
        names = {t["function"]["name"] for t in s.tools}
        assert {"find_places", "list_places", "area_by_category"} <= names
        assert len(names) == 10
        assert "Ecuador module" in s.instructions
        tool = next(t for t in s.tools if t["function"]["name"] == "find_places")
        assert tool["type"] == "function"
        assert tool["function"]["parameters"]["type"] == "object"


@pytest.mark.anyio
async def test_session_calls_a_tool_and_logs_the_question(tmp_path, monkeypatch):
    monkeypatch.setenv("MCP_CALL_LOG", str(tmp_path / "calls.jsonl"))
    async with server_session(server_env("r9", 3, store=True)) as s:
        text, is_error = await s.call_tool("find_places", {"query": "Tena"})
    assert not is_error and "canton:Napo/Tena" in text
    line = json.loads((tmp_path / "calls.jsonl").read_text().splitlines()[-1])
    assert line["run_id"] == "r9" and line["question"] == "3"


@pytest.mark.anyio
async def test_session_returns_an_unknown_tool_as_an_error():
    async with server_session(server_env("r", 1, store=True)) as s:
        text, is_error = await s.call_tool("no_such_tool", {})
    assert is_error and "no_such_tool" in text


def test_system_prompt_drops_front_matter():
    prompt = system_prompt("INSTR", SKILL)
    assert prompt.startswith("INSTR\n\n# Amazonia 360") and "description:" not in prompt


def test_server_env_store_off():
    assert server_env("r", 1, store=False)["MCP_AREA_SOURCES"] == "arcgis"
    assert server_env("r", 7, store=True) == {
        "MCP_RUN_ID": "r",
        "MCP_QUESTION": "7",
        "MCP_AREA_SOURCES": "precomputed,local_copy,arcgis",
    }


@pytest.mark.anyio
async def test_preflight_names_the_provider(fake_anthropic):
    fake_anthropic.error = ValueError("bad schema")
    with pytest.raises(PreflightError, match=r"sonnet.*anthropic.*bad schema"):
        await preflight(SONNET, TOOLS)
    chat = fake_anthropic.instances[0]
    assert chat.kwargs["max_tokens"] == 16
    assert chat.bound == (TOOLS, {"strict": False})


@pytest.mark.anyio
async def test_preflight_passes_when_the_provider_answers(fake_anthropic):
    await preflight(SONNET, TOOLS)
    sent = fake_anthropic.instances[0].received
    assert sent[-1].content[0]["text"] == "Responde solo: ok"


@pytest.mark.anyio
async def test_anthropic_chat_marks_system_and_last_message(fake_anthropic):
    chat = make_chat(SONNET, TOOLS)
    model = fake_anthropic.instances[0]
    assert model.kwargs == {"model": "claude-sonnet-test", "api_key": "test-key"}
    messages: list[BaseMessage] = [
        SystemMessage("SYS"),
        HumanMessage("Q"),
        AIMessage(
            "",
            tool_calls=[
                {"name": "f", "args": {}, "id": "t1", "type": "tool_call"},
            ],
        ),
        ToolMessage("RESULT", tool_call_id="t1"),
    ]
    reply = await chat(messages)
    assert reply.content == "ok"
    sent = model.received
    assert sent[0].content == [
        {"type": "text", "text": "SYS", "cache_control": EPHEMERAL}
    ]
    assert sent[1].content == "Q"
    assert sent[-1].content == [
        {"type": "text", "text": "RESULT", "cache_control": EPHEMERAL}
    ]
    assert isinstance(sent[-1], ToolMessage) and sent[-1].tool_call_id == "t1"
    # The caller's history is left as it was.
    assert messages[0].content == "SYS" and messages[-1].content == "RESULT"


def test_make_chat_needs_the_api_key(monkeypatch, fake_anthropic):
    monkeypatch.delenv("ANTHROPIC_API_KEY")
    with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
        make_chat(SONNET, TOOLS)


@pytest.mark.anyio
async def test_anthropic_chat_leaves_an_empty_last_message_unmarked(fake_anthropic):
    chat = make_chat(SONNET, TOOLS)
    await chat([SystemMessage("SYS"), ToolMessage("", tool_call_id="t1")])
    assert fake_anthropic.instances[0].received[-1].content == ""
