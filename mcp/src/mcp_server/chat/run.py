"""One chat question: the measurement's loop, as AG-UI events as it goes."""

import time
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any

from langchain_core.messages import BaseMessage, SystemMessage, ToolMessage

from mcp_server.chat import agui
from mcp_server.measurement.model_run.loop import (
    CallTool,
    ChatTurn,
    elapsed_ms,
    message_text,
    message_usage,
)
from mcp_server.measurement.model_run.pricing import Price, Usage, cost


@dataclass(frozen=True)
class RunLimits:
    max_turns: int
    max_seconds: float


STOPS = {
    "max_turns": "The question needed too many steps. Try a narrower one.",
    "timeout": "The question took too long. Try a narrower one.",
}


def _id() -> str:
    return uuid.uuid4().hex


def _stop(turns: int, started: float, limits: RunLimits) -> str | None:
    if turns >= limits.max_turns:
        return "max_turns"
    if time.monotonic() - started >= limits.max_seconds:
        return "timeout"
    return None


async def stream_run(
    chat: ChatTurn,
    call_tool: CallTool,
    system_prompt: str,
    run: agui.RunInput,
    limits: RunLimits,
    price: Price,
    summary: dict[str, Any],
) -> AsyncIterator[dict[str, Any]]:
    """Yields the run's events. Fills `summary` as it goes, so the caller can log it
    when the client leaves halfway."""
    clock = time.monotonic()
    messages: list[BaseMessage] = [SystemMessage(system_prompt), *run.history]
    usage = Usage(0, 0, 0, 0)
    turns = calls = 0
    summary.update(ended="answer", turns=0, toolCalls=0, costUsd=0.0)

    def tally() -> None:
        summary.update(
            turns=turns,
            toolCalls=calls,
            inputTokens=usage.input_tokens,
            cachedTokens=usage.cached_tokens,
            outputTokens=usage.output_tokens,
            costUsd=round(cost(usage, price), 6),
            elapsedMs=elapsed_ms(clock),
        )

    yield agui.run_started(run.thread_id, run.run_id)
    while True:
        try:
            reply = await chat(messages)
        except Exception as exc:
            summary.update(ended="error", error=f"{type(exc).__name__}: {exc}")
            tally()
            yield agui.run_error(
                "model_error", "The model could not answer. Try again."
            )
            return
        turns += 1
        usage = usage + message_usage(reply)
        messages.append(reply)
        message_id = _id()
        text = message_text(reply)
        if text:
            for event in agui.text_message(message_id, text):
                yield event
        if not reply.tool_calls:
            break
        for call in reply.tool_calls:
            call_id = call.get("id") or _id()
            for event in agui.tool_call(
                call_id, call["name"], call["args"], message_id
            ):
                yield event
            content, failed = await call_tool(call["name"], call["args"])
            calls += 1
            messages.append(ToolMessage(content=content, tool_call_id=call_id))
            yield agui.tool_result(_id(), call_id, content, failed=failed)
        stop = _stop(turns, clock, limits)
        if stop:
            summary["ended"] = stop
            tally()
            yield agui.run_error(stop, STOPS[stop])
            return
    tally()
    yield agui.run_summary(
        {k: summary[k] for k in ("model", "turns", "toolCalls", "costUsd", "elapsedMs")}
    )
    yield agui.run_finished(run.thread_id, run.run_id)
