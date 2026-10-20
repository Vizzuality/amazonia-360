"""Benchmark questions and model specs for the model measurement."""

from __future__ import annotations

import json
import tomllib
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Literal

from mcp_server.measurement.model_run.pricing import Price

Provider = Literal["anthropic", "openai", "deepseek"]
PROVIDERS = ("anthropic", "openai", "deepseek")
PRICE_FIELDS = ("input", "cached_input", "output", "read_on", "source")


@dataclass(frozen=True)
class Question:
    number: int
    group: str
    text: str
    expected: str
    expected_calls: int
    area: dict | None
    requires: str | None

    def message(self) -> str:
        if self.area is None:
            return self.text
        geometry = json.dumps(self.area, separators=(",", ":"), ensure_ascii=False)
        return f"{self.text}\n\nZona (GeoJSON): {geometry}"


@dataclass(frozen=True)
class ModelSpec:
    label: str
    provider: Provider
    model: str
    price: Price


def load_questions(path: Path, numbers: list[int] | None) -> list[Question]:
    raw = json.loads(path.read_text(encoding="utf-8"))["questions"]
    questions = [
        Question(
            number=item["number"],
            group=item["group"],
            text=item["text"],
            expected=item["expected"],
            expected_calls=item["expected_calls"],
            area=item.get("area"),
            requires=item.get("requires"),
        )
        for item in raw
    ]
    if numbers is None:
        return [q for q in questions if q.requires is None]
    by_number = {q.number: q for q in questions}
    unknown = [n for n in numbers if n not in by_number]
    if unknown:
        raise ValueError(f"Unknown question numbers: {unknown}")
    return [by_number[n] for n in numbers]


def load_models(path: Path, labels: list[str]) -> list[ModelSpec]:
    with path.open("rb") as handle:
        entries = {e.get("label"): e for e in tomllib.load(handle).get("model", [])}
    return [_spec(label, entries) for label in labels]


def _spec(label: str, entries: dict[str, dict]) -> ModelSpec:
    entry = entries.get(label)
    if entry is None:
        raise ValueError(f"Unknown model label: {label}")
    provider, model = entry.get("provider"), entry.get("model")
    if provider not in PROVIDERS:
        raise ValueError(f"Model {label}: provider must be one of {PROVIDERS}")
    if not model:
        raise ValueError(f"Model {label}: model is missing")
    raw = entry.get("price") or {}
    missing = [f for f in PRICE_FIELDS if raw.get(f) in (None, "")]
    if missing:
        raise ValueError(f"Model {label}: price is missing {', '.join(missing)}")
    if not isinstance(raw["read_on"], date):
        raise ValueError(f"Model {label}: read_on must be a TOML date")
    price = Price(
        input=float(raw["input"]),
        cached_input=float(raw["cached_input"]),
        cache_write=float(raw.get("cache_write", raw["input"])),
        output=float(raw["output"]),
        read_on=raw["read_on"],
        source=str(raw["source"]),
    )
    return ModelSpec(label=label, provider=provider, model=model, price=price)
