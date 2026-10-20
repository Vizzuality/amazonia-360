"""The model-agnostic question loop. It knows neither providers nor MCP."""

from __future__ import annotations

import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)

from mcp_server.measurement.model_run.config import Question
from mcp_server.measurement.model_run.pricing import Price, Usage, cost
from mcp_server.measurement.model_run.trace import (
    Ending,
    QuestionRecord,
    ToolCallRecord,
    TurnRecord,
)

ChatTurn = Callable[[list[BaseMessage]], Awaitable[AIMessage]]
CallTool = Callable[[str, dict], Awaitable[tuple[str, bool]]]


@dataclass(frozen=True)
class Limits:
    max_turns: int = 60
    max_seconds: float = 600.0


class Budget:
    def __init__(self, cap_usd: float) -> None:
        self.cap_usd = cap_usd
        self.spent_usd = 0.0

    def add(self, usd: float) -> None:
        self.spent_usd += usd

    def exhausted(self) -> bool:
        return self.spent_usd >= self.cap_usd


def _elapsed_ms(start: float) -> int:
    return round((time.monotonic() - start) * 1000)


def _text(message: AIMessage) -> str:
    content = message.content
    if isinstance(content, str):
        return content
    parts = []
    for block in content:
        if isinstance(block, str):
            parts.append(block)
        elif isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text", ""))
    return "".join(parts)


def _usage(message: AIMessage) -> Usage:
    meta = message.usage_metadata or {}
    details = meta.get("input_token_details") or {}
    return Usage(
        input_tokens=meta.get("input_tokens", 0),
        cached_tokens=details.get("cache_read", 0),
        cache_write_tokens=details.get("cache_creation", 0),
        output_tokens=meta.get("output_tokens", 0),
    )


async def run_question(
    chat: ChatTurn,
    call_tool: CallTool,
    system_prompt: str,
    question: Question,
    price: Price,
    limits: Limits,
    budget: Budget,
    *,
    run_id: str,
    model: str,
    store: bool,
) -> QuestionRecord:
    started = datetime.now(UTC)
    clock = time.monotonic()
    messages: list[BaseMessage] = [
        SystemMessage(system_prompt),
        HumanMessage(question.message()),
    ]
    turns: list[TurnRecord] = []
    calls: list[ToolCallRecord] = []
    usage = Usage(0, 0, 0, 0)
    last_text = ""
    ended: Ending = "answer"
    error: str | None = None

    while True:
        turn_start = time.monotonic()
        try:
            reply = await chat(messages)
        except Exception as exc:
            ended, error = "error", f"{type(exc).__name__}: {exc}"
            break
        turn_usage = _usage(reply)
        usage = usage + turn_usage
        budget.add(cost(turn_usage, price))
        turns.append(
            TurnRecord(
                turn_usage.input_tokens,
                turn_usage.cached_tokens,
                turn_usage.cache_write_tokens,
                turn_usage.output_tokens,
                _elapsed_ms(turn_start),
            )
        )
        last_text = _text(reply) or last_text
        messages.append(reply)

        if not reply.tool_calls:
            last_text = _text(reply)
            break

        for tool_call in reply.tool_calls:
            call_start = time.monotonic()
            text, failed = await call_tool(tool_call["name"], tool_call["args"])
            calls.append(
                ToolCallRecord(
                    tool_call["name"],
                    tool_call["args"],
                    _elapsed_ms(call_start),
                    len(text),
                    text if failed else None,
                )
            )
            messages.append(ToolMessage(content=text, tool_call_id=tool_call["id"]))

        if budget.exhausted():
            ended = "spend_cap"
        elif len(turns) >= limits.max_turns:
            ended = "turn_limit"
        elif time.monotonic() - clock >= limits.max_seconds:
            ended = "time_limit"
        if ended != "answer":
            break

    return QuestionRecord(
        run_id=run_id,
        model=model,
        question=question.number,
        store=store,
        started=started.isoformat(),
        ended_at=datetime.now(UTC).isoformat(),
        total_ms=_elapsed_ms(clock),
        turns=turns,
        calls=calls,
        usage=usage,
        price_usd=cost(usage, price),
        answer=last_text,
        ended=ended,
        error=error,
    )
