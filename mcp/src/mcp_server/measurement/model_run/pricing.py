"""Cost arithmetic for the model measurement. Prices are dollars per million tokens."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from mcp_server.measurement.model_run.config import Question

MILLION = 1_000_000
RESULT_TOKENS = 1000
TURN_OUTPUT_TOKENS = 300


@dataclass(frozen=True)
class Price:
    input: float
    cached_input: float
    cache_write: float
    output: float
    read_on: date
    source: str


@dataclass(frozen=True)
class Usage:
    """input_tokens is the total, including cached and cache-write tokens."""

    input_tokens: int
    cached_tokens: int
    cache_write_tokens: int
    output_tokens: int

    def __add__(self, other: Usage) -> Usage:
        return Usage(
            self.input_tokens + other.input_tokens,
            self.cached_tokens + other.cached_tokens,
            self.cache_write_tokens + other.cache_write_tokens,
            self.output_tokens + other.output_tokens,
        )


def cost(usage: Usage, price: Price) -> float:
    uncached = usage.input_tokens - usage.cached_tokens - usage.cache_write_tokens
    return (
        uncached * price.input
        + usage.cached_tokens * price.cached_input
        + usage.cache_write_tokens * price.cache_write
        + usage.output_tokens * price.output
    ) / MILLION


def estimate_question(question: Question, fixed_tokens: int, price: Price) -> float:
    """Upper bound without caching: each turn re-sends the history so far."""
    calls = question.expected_calls
    input_tokens = sum(fixed_tokens + k * RESULT_TOKENS for k in range(calls + 1))
    output_tokens = (calls + 1) * TURN_OUTPUT_TOKENS
    return (input_tokens * price.input + output_tokens * price.output) / MILLION
