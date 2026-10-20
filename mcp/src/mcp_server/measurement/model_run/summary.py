"""The two documents of a model run: the figures per model, and the answers to grade."""

from __future__ import annotations

import statistics

from mcp_server.measurement.model_run.trace import QuestionRecord

NORMAL_STOPS = {
    "end_turn",
    "stop",
    "stop_sequence",
    "tool_use",
    "tool_calls",
    "completed",
}


def _labels(run: dict, records: list[QuestionRecord]) -> list[str]:
    labels = [m["label"] for m in run.get("models", [])]
    return labels + sorted({r.model for r in records} - set(labels))


def _seconds(ms: float) -> str:
    return f"{ms / 1000:.1f}"


def _abnormal_stop(record: QuestionRecord) -> bool:
    reason = record.turns[-1].stop_reason if record.turns else None
    return reason is not None and reason not in NORMAL_STOPS


def _model_row(label: str, records: list[QuestionRecord]) -> str:
    if not records:
        return f"| {label} | 0 | | | | | | | |"
    total = sum(r.price_usd for r in records)
    times = [r.total_ms for r in records]
    unanswered = ", ".join(
        f"{r.question} ({r.ended})" for r in records if r.ended != "answer"
    )
    cut = ", ".join(
        f"{r.question} ({r.turns[-1].stop_reason})"
        for r in records
        if r.ended == "answer" and _abnormal_stop(r)
    )
    cells = [
        label,
        str(len(records)),
        f"{total:.4f}",
        f"{total / len(records):.4f}",
        _seconds(statistics.median(times)),
        _seconds(max(times)),
        str(sum(len(r.calls) for r in records)),
        unanswered,
        cut,
    ]
    return "| " + " | ".join(cells) + " |"


def _spent(run: dict) -> list[str]:
    if "spent_usd" not in run:
        return []
    line = f"Spent in the run: {run['spent_usd']:.4f} USD"
    if run.get("ended") == "interrupted":
        line += ", interrupted before the end"
    return ["", line + "."]


def _caching(run: dict) -> str:
    caching = run.get("caching")
    if not caching:
        return "Caching: not recorded."
    providers = {m.get("provider") for m in run.get("models", [])}
    used = {p: how for p, how in caching.items() if p in providers} or caching
    return "Caching on: " + "; ".join(f"{p}, {how}" for p, how in used.items()) + "."


def _settings(run: dict) -> list[str]:
    lines = ["", _caching(run)]
    if run.get("effort"):
        lines.append(f"Reasoning effort: {run['effort']}.")
    models = [m for m in run.get("models", []) if m.get("price")]
    if models:
        lines += [
            "",
            "Prices per model, USD per million tokens:",
            "",
            "| Model | Input | Cached input | Cache write | Output | Read on "
            "| Source |",
            "|---|---|---|---|---|---|---|",
        ]
        for m in models:
            price = m["price"]
            lines.append(
                f"| {m['label']} | {price.get('input')} | {price.get('cached_input')} "
                f"| {price.get('cache_write')} | {price.get('output')} "
                f"| {price.get('read_on')} | {price.get('source')} |"
            )
    return lines


def _mode(run: dict) -> str:
    if run.get("tools") is False:
        return "MCP: off, the questions sent with no tools and no system prompt."
    return f"Store: {'on' if run.get('store') else 'off'}."


def _summary(run: dict, labels: list[str], records: list[QuestionRecord]) -> str:
    limits = run.get("limits", {})
    lines = [
        f"# Model measurement {run.get('run_id', '')}",
        "",
        f"{_mode(run)} "
        f"Server commit: {run.get('server_commit') or 'unknown'}. "
        f"Spending cap: {limits.get('max_spend_usd', '?')} USD. "
        f"Limits per question: {limits.get('max_turns', '?')} turns, "
        f"{limits.get('max_seconds', '?')} s.",
        *_spent(run),
        *_settings(run),
        "",
        "Prices in USD, times in seconds from the question to its end.",
        "",
        "| Model | Questions | Total | Per question | Median time | Longest time "
        "| Tool calls | Not ended by an answer | Answer cut short |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    lines += [_model_row(lb, [r for r in records if r.model == lb]) for lb in labels]
    numbers = sorted({r.question for r in records})
    lines += [
        "",
        "## Price per question (USD)",
        "",
        "| Question | " + " | ".join(labels) + " |",
        "|---|" + "---|" * len(labels),
    ]
    prices = {(r.model, r.question): r.price_usd for r in records}
    for number in numbers:
        cells = [
            f"{prices[(lb, number)]:.4f}" if (lb, number) in prices else ""
            for lb in labels
        ]
        lines.append(f"| {number} | " + " | ".join(cells) + " |")
    return "\n".join(lines) + "\n"


def _quoted(text: str) -> str:
    # A blockquote keeps the answer's own headings out of the document's outline.
    return "\n".join(f"> {line}" if line else ">" for line in text.splitlines())


def _answer(label: str, record: QuestionRecord | None) -> list[str]:
    if record is None:
        return [f"### {label}", "", "Not run.", ""]
    heading = (
        f"### {label}: {record.price_usd:.4f} USD, {_seconds(record.total_ms)} s, "
        f"{len(record.calls)} tool calls"
    )
    if record.ended != "answer":
        heading += f", ended by {record.ended}"
    lines = [heading, ""]
    if record.error:
        lines += [f"Error: {record.error}", ""]
    lines += [_quoted(record.answer) if record.answer else "*(no answer)*", ""]
    return lines


def _answers(run: dict, labels: list[str], records: list[QuestionRecord]) -> str:
    by_key = {(r.model, r.question): r for r in records}
    lines = [f"# Answers of model measurement {run.get('run_id', '')}", ""]
    for question in sorted(run.get("questions", []), key=lambda q: q["number"]):
        number = question["number"]
        lines += [
            f"## {number}. {question['text']}",
            "",
            f"Expected: {question['expected']}",
            "",
        ]
        for label in labels:
            lines += _answer(label, by_key.get((label, number)))
    return "\n".join(lines).rstrip() + "\n"


def summarise(run: dict, records: list[QuestionRecord]) -> tuple[str, str]:
    labels = _labels(run, records)
    return _summary(run, labels, records), _answers(run, labels, records)
