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
    stop_reason: str | None = None


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
    with path.open("a+b") as handle:
        handle.seek(0, 2)
        if handle.tell() > 0:
            handle.seek(-1, 2)
            if handle.read(1) != b"\n":
                handle.write(b"\n")
        handle.write((line + "\n").encode("utf-8"))
        handle.flush()


def read_records(path: Path) -> tuple[list[QuestionRecord], int]:
    """The records of a trace, and how many non-empty lines could not be read."""
    if not path.exists():
        return [], 0
    records: list[QuestionRecord] = []
    skipped = 0
    # Only "\n" ends a record: str.splitlines also splits on U+2028 inside answers.
    for line in path.read_text(encoding="utf-8").split("\n"):
        if not line.strip():
            continue
        try:
            records.append(_record(json.loads(line)))
        except (json.JSONDecodeError, KeyError, TypeError):
            skipped += 1
    return records, skipped


def _record(raw: dict) -> QuestionRecord:
    return QuestionRecord(
        **{
            **raw,
            "turns": [TurnRecord(**t) for t in raw["turns"]],
            "calls": [ToolCallRecord(**c) for c in raw["calls"]],
            "usage": Usage(**raw["usage"]),
        }
    )
