import json
from dataclasses import asdict, replace
from datetime import date
from pathlib import Path

import pytest
from langchain_core.messages import AIMessage, BaseMessage, ToolMessage

from mcp_server.measurement.model_run.config import Question
from mcp_server.measurement.model_run.loop import Budget, Limits, run_question
from mcp_server.measurement.model_run.pricing import Price, Usage, cost
from mcp_server.measurement.model_run.trace import (
    QuestionRecord,
    ToolCallRecord,
    TurnRecord,
    append_record,
    read_records,
)

PRICE = Price(
    input=3.0,
    cached_input=0.3,
    cache_write=3.75,
    output=15.0,
    read_on=date(2026, 10, 1),
    source="https://example.test/pricing",
)
Q = Question(1, "g", "Que hay en Tena?", "x", 1, None, None)
USAGE = {"input_tokens": 1000, "output_tokens": 100, "total_tokens": 1100}


def tool_msg(name: str, args: dict, call_id: str = "c1") -> AIMessage:
    return AIMessage(
        content="",
        tool_calls=[{"name": name, "args": args, "id": call_id, "type": "tool_call"}],
        usage_metadata=USAGE,
    )


def final(text) -> AIMessage:
    return AIMessage(content=text, usage_metadata=USAGE)


def scripted(messages: list[AIMessage], seen: list | None = None):
    queue = list(messages)

    async def chat(history: list[BaseMessage]) -> AIMessage:
        if seen is not None:
            seen.append(list(history))
        return queue.pop(0)

    return chat


def forever_calling():
    async def chat(history: list[BaseMessage]) -> AIMessage:
        return tool_msg("find_places", {})

    return chat


def raising(text: str):
    async def chat(history: list[BaseMessage]) -> AIMessage:
        raise RuntimeError(text)

    return chat


async def ok_tool(name: str, arguments: dict) -> tuple[str, bool]:
    return "result", False


def failing_tool(text: str):
    async def call(name: str, arguments: dict) -> tuple[str, bool]:
        return text, True

    return call


async def run(chat, tool=ok_tool, limits=None, budget=None) -> QuestionRecord:
    return await run_question(
        chat,
        tool,
        "sys",
        Q,
        PRICE,
        limits or Limits(),
        budget or Budget(10),
        run_id="r",
        model="m",
        store=True,
    )


@pytest.mark.anyio
async def test_answer_after_one_tool_call():
    record = await run(
        scripted([tool_msg("find_places", {"query": "Tena"}), final("Tena tiene")])
    )
    assert record.ended == "answer" and record.answer == "Tena tiene"
    assert [c.name for c in record.calls] == ["find_places"]
    assert record.calls[0].arguments == {"query": "Tena"}
    assert len(record.turns) == 2
    assert record.usage.input_tokens == 2 * 1000
    assert record.error is None and record.started <= record.ended_at


@pytest.mark.anyio
async def test_cache_details_are_read_from_usage_metadata():
    message = AIMessage(
        content="ok",
        usage_metadata={
            "input_tokens": 1000,
            "output_tokens": 100,
            "total_tokens": 1100,
            "input_token_details": {"cache_read": 400, "cache_creation": 200},
        },
    )
    record = await run(scripted([message]))
    assert record.usage == Usage(1000, 400, 200, 100)
    assert record.turns[0].cached_tokens == 400
    assert record.price_usd == cost(Usage(1000, 400, 200, 100), PRICE)


@pytest.mark.anyio
async def test_cache_writes_split_by_ttl_are_counted():
    message = AIMessage(
        content="ok",
        usage_metadata={
            "input_tokens": 1000,
            "output_tokens": 100,
            "total_tokens": 1100,
            "input_token_details": {
                "cache_read": 0,
                "cache_creation": 0,
                "ephemeral_5m_input_tokens": 300,
                "ephemeral_1h_input_tokens": 0,
            },
        },
    )
    record = await run(scripted([message]))
    assert record.turns[0].cache_write_tokens == 300
    assert record.usage == Usage(1000, 0, 300, 100)
    assert record.price_usd == cost(Usage(1000, 0, 300, 100), PRICE)


@pytest.mark.anyio
async def test_answer_text_from_content_blocks():
    blocks = [{"type": "text", "text": "Hola "}, {"type": "text", "text": "mundo"}]
    record = await run(scripted([final(blocks)]))
    assert record.answer == "Hola mundo"


@pytest.mark.anyio
async def test_tool_messages_carry_the_call_id():
    seen: list = []
    await run(scripted([tool_msg("find_places", {}, "abc"), final("ok")], seen=seen))
    tool_message = seen[-1][-1]
    assert isinstance(tool_message, ToolMessage)
    assert tool_message.tool_call_id == "abc" and tool_message.content == "result"
    assert seen[0][0].content == "sys" and seen[0][1].content == Q.message()


@pytest.mark.anyio
async def test_turn_limit_stops_a_loop():
    record = await run(forever_calling(), limits=Limits(max_turns=3))
    assert record.ended == "turn_limit" and len(record.turns) == 3
    assert record.price_usd > 0


@pytest.mark.anyio
async def test_time_limit_stops_a_loop():
    record = await run(forever_calling(), limits=Limits(max_seconds=0))
    assert record.ended == "time_limit" and len(record.turns) == 1


@pytest.mark.anyio
async def test_spend_cap_stops_mid_question():
    two_turns = 2 * cost(Usage(1000, 0, 0, 100), PRICE)
    record = await run(forever_calling(), budget=Budget(cap_usd=two_turns))
    assert record.ended == "spend_cap" and len(record.turns) == 2


@pytest.mark.anyio
async def test_non_answer_ending_keeps_last_model_text():
    thinking = AIMessage(
        content="Voy a buscar",
        tool_calls=[
            {"name": "find_places", "args": {}, "id": "c", "type": "tool_call"}
        ],
        usage_metadata=USAGE,
    )
    record = await run(scripted([thinking]), limits=Limits(max_turns=1))
    assert record.ended == "turn_limit" and record.answer == "Voy a buscar"


@pytest.mark.anyio
async def test_tool_error_goes_back_to_the_model():
    seen: list = []
    record = await run(
        scripted([tool_msg("area_by_category", {}), final("No pude.")], seen=seen),
        tool=failing_tool("ArcGIS timeout"),
    )
    assert record.calls[0].error == "ArcGIS timeout"
    assert seen[-1][-1].content == "ArcGIS timeout"
    assert record.ended == "answer"


@pytest.mark.anyio
async def test_model_exception_is_recorded():
    record = await run(raising("rate limit"))
    assert record.ended == "error"
    assert record.error is not None and "rate limit" in record.error


def some_record(question: int) -> QuestionRecord:
    return QuestionRecord(
        run_id="r",
        model="m",
        question=question,
        store=False,
        started="2026-10-20T10:00:00+00:00",
        ended_at="2026-10-20T10:00:05+00:00",
        total_ms=5000,
        turns=[TurnRecord(1000, 400, 200, 100, 1200)],
        calls=[ToolCallRecord("find_places", {"query": "Tena"}, 30, 120, None)],
        usage=Usage(1000, 400, 200, 100),
        price_usd=0.01,
        answer="Tena",
        ended="answer",
        error=None,
    )


def test_trace_round_trips(tmp_path: Path):
    path = tmp_path / "trace.jsonl"
    record = some_record(1)
    append_record(path, record)
    assert read_records(path) == ([record], 0)


def test_trace_survives_a_truncated_last_line(tmp_path: Path):
    path = tmp_path / "trace.jsonl"
    append_record(path, some_record(question=1))
    with path.open("a") as f:
        f.write('{"run_id": "r", "mod')
    records, skipped = read_records(path)
    assert [r.question for r in records] == [1] and skipped == 1


def test_append_after_a_truncated_line_keeps_both_records(tmp_path: Path):
    path = tmp_path / "trace.jsonl"
    append_record(path, some_record(question=1))
    with path.open("a") as f:
        f.write('{"run_id": "r", "mod')
    append_record(path, some_record(question=2))
    assert [r.question for r in read_records(path)[0]] == [1, 2]


def test_read_records_of_a_missing_file_is_empty(tmp_path: Path):
    assert read_records(tmp_path / "none.jsonl") == ([], 0)


def test_trace_round_trips_line_separators_in_an_answer(tmp_path: Path):
    path = tmp_path / "trace.jsonl"
    record = replace(some_record(1), answer="uno\u2028dos\u2029tres\x85cuatro")
    append_record(path, record)
    assert read_records(path) == ([record], 0)


def test_trace_line_without_stop_reason_still_loads(tmp_path: Path):
    path = tmp_path / "trace.jsonl"
    raw = asdict(some_record(1))
    for turn in raw["turns"]:
        del turn["stop_reason"]
    path.write_text(json.dumps(raw) + "\n", encoding="utf-8")
    records, skipped = read_records(path)
    assert skipped == 0 and records[0].turns[0].stop_reason is None


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("metadata", "expected"),
    [
        ({"stop_reason": "max_tokens"}, "max_tokens"),
        ({"finish_reason": "length"}, "length"),
        ({"status": "completed"}, "completed"),
        (
            {
                "status": "incomplete",
                "incomplete_details": {"reason": "max_output_tokens"},
            },
            "max_output_tokens",
        ),
        (
            {
                "status": "incomplete",
                "incomplete_details": {"reason": "content_filter"},
            },
            "content_filter",
        ),
        ({"status": "incomplete"}, "incomplete"),
    ],
)
async def test_turn_records_why_it_stopped(metadata: dict, expected: str):
    reply = AIMessage(content="Corta", usage_metadata=USAGE, response_metadata=metadata)
    record = await run(scripted([reply]))
    assert record.turns[-1].stop_reason == expected
