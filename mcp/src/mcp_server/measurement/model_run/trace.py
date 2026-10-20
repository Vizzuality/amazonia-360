"""The per-question trace of a model run: one JSON line per question."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Literal

from mcp_server.measurement.model_run.pricing import Usage

Ending = Literal["answer", "turn_limit", "time_limit", "spend_cap", "error"]


@dataclass(frozen=True)
class TurnRecord:
    input_tokens: int
    cached_tokens: int
    cache_write_tokens: int
    output_tokens: int
    model_ms: int


@dataclass(frozen=True)
class ToolCallRecord:
    name: str
    arguments: dict
    ms: int
    result_chars: int
    error: str | None


@dataclass(frozen=True)
class QuestionRecord:
    run_id: str
    model: str
    question: int
    store: bool
    started: str
    ended_at: str
    total_ms: int
    turns: list[TurnRecord]
    calls: list[ToolCallRecord]
    usage: Usage
    price_usd: float
    answer: str
    ended: Ending
    error: str | None


def append_record(path: Path, record: QuestionRecord) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(asdict(record), ensure_ascii=False)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")
        handle.flush()


def read_records(path: Path) -> list[QuestionRecord]:
    if not path.exists():
        return []
    records: list[QuestionRecord] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            records.append(_record(json.loads(line)))
        except (json.JSONDecodeError, KeyError, TypeError):
            continue
    return records


def _record(raw: dict) -> QuestionRecord:
    return QuestionRecord(
        **{
            **raw,
            "turns": [TurnRecord(**t) for t in raw["turns"]],
            "calls": [ToolCallRecord(**c) for c in raw["calls"]],
            "usage": Usage(**raw["usage"]),
        }
    )
