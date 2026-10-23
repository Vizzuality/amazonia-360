from datetime import date
from typing import Any

import pytest
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage

from mcp_server.chat.agui import RunInput
from mcp_server.chat.run import RunLimits, stream_run
from mcp_server.measurement.model_run.pricing import Price

pytestmark = pytest.mark.anyio

PRICE = Price(3.0, 0.3, 3.75, 15.0, date(2026, 10, 20), "test")
RUN = RunInput("t1", "r1", [HumanMessage("Tena?")], "en")
USAGE = {"input_tokens": 1000, "output_tokens": 100, "total_tokens": 1100}


def replies(*messages: AIMessage):
    queue = list(messages)
    seen: list[list[BaseMessage]] = []

    async def chat(sent: list[BaseMessage]) -> AIMessage:
        seen.append(list(sent))
        return queue.pop(0)

    return chat, seen


def call(name: str, args: dict, call_id: str = "c1") -> AIMessage:
    return AIMessage(
        content="",
        tool_calls=[{"id": call_id, "name": name, "args": args}],
        usage_metadata=USAGE,
    )


async def tool(name: str, args: dict) -> tuple[str, bool]:
    if name == "broken":
        return "ToolError: no such indicator", True
    return '{"places": [{"id": "canton:Napo/Tena"}]}', False


ROOMY = RunLimits(max_turns=60, max_seconds=300)


async def events(chat: Any, limits: RunLimits = ROOMY) -> tuple[list, dict]:
    summary: dict[str, Any] = {"model": "sonnet"}
    out = [
        e async for e in stream_run(chat, tool, "prompt", RUN, limits, PRICE, summary)
    ]
    return out, summary


async def test_a_tool_call_then_an_answer() -> None:
    chat, seen = replies(
        call("find_places", {"query": "Tena"}),
        AIMessage(content="Tena is a canton.", usage_metadata=USAGE),
    )
    out, summary = await events(chat)
    assert [e["type"] for e in out] == [
        "RUN_STARTED",
        "TOOL_CALL_START",
        "TOOL_CALL_ARGS",
        "TOOL_CALL_END",
        "TOOL_CALL_RESULT",
        "TEXT_MESSAGE_START",
        "TEXT_MESSAGE_CONTENT",
        "TEXT_MESSAGE_END",
        "CUSTOM",
        "RUN_FINISHED",
    ]
    assert out[1]["toolCallName"] == "find_places"
    assert out[2]["delta"] == '{"query": "Tena"}'
    assert out[4]["toolCallId"] == "c1"
    assert out[4]["content"].startswith('{"places"')
    assert "metadata" not in out[4]
    assert out[6]["delta"] == "Tena is a canton."
    assert out[-1]["metadata"] == {"tanstack": {"finishReason": "stop"}}
    # The second turn sees the system prompt, the question, the call and its result.
    assert [m.type for m in seen[1]] == ["system", "human", "ai", "tool"]
    assert summary["turns"] == 2
    assert summary["toolCalls"] == 1
    assert summary["costUsd"] == pytest.approx(2 * (1000 * 3.0 + 100 * 15.0) / 1e6)
    assert out[-2]["value"]["costUsd"] == summary["costUsd"]


async def test_a_failed_tool_is_marked_and_the_run_goes_on() -> None:
    chat, _ = replies(
        call("broken", {}),
        AIMessage(content="That indicator does not exist.", usage_metadata=USAGE),
    )
    out, summary = await events(chat)
    result = next(e for e in out if e["type"] == "TOOL_CALL_RESULT")
    assert result["metadata"] == {"tanstack": {"state": "output-error"}}
    assert out[-1]["type"] == "RUN_FINISHED"
    assert summary["ended"] == "answer"


async def test_a_model_failure_ends_the_run_with_an_error() -> None:
    async def chat(sent: list[BaseMessage]) -> AIMessage:
        raise RuntimeError("overloaded")

    out, summary = await events(chat)
    assert [e["type"] for e in out] == ["RUN_STARTED", "RUN_ERROR"]
    assert out[-1]["code"] == "model_error"
    assert "overloaded" not in out[-1]["message"]
    assert summary["ended"] == "error"
    assert "overloaded" in summary["error"]


async def test_the_turn_limit_ends_the_run_with_an_error() -> None:
    chat, _ = replies(*[call("find_places", {"query": "x"}, f"c{i}") for i in range(3)])
    out, summary = await events(chat, RunLimits(max_turns=2, max_seconds=300))
    assert out[-1] == {
        "type": "RUN_ERROR",
        "code": "max_turns",
        "message": "The question needed too many steps. Try a narrower one.",
    }
    assert summary["ended"] == "max_turns"
    assert summary["turns"] == 2
