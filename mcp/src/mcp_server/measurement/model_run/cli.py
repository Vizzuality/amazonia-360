"""``amazonia360-mcp-measure``: ask the base questions to several models and summarise.

``estimate`` prices a run before it starts, ``run`` asks every question to every model
with a fresh server per question and writes the trace, and ``summary`` turns a run's
trace into the figures per model and the answers to grade.
"""

from __future__ import annotations

import argparse
import asyncio
import importlib
import json
import subprocess
import time
from dataclasses import asdict
from datetime import UTC, datetime
from pathlib import Path
from types import ModuleType
from typing import TYPE_CHECKING, Any

from mcp_server.measurement.model_run.config import (
    ModelSpec,
    Question,
    load_models,
    load_questions,
)
from mcp_server.measurement.model_run.pricing import Usage, estimate_question
from mcp_server.measurement.model_run.session import (
    MCP_DIR,
    area_sources,
    server_env,
    server_session,
    system_prompt,
)
from mcp_server.measurement.model_run.summary import summarise
from mcp_server.measurement.model_run.trace import (
    QuestionRecord,
    append_record,
    read_records,
)

if TYPE_CHECKING:
    from mcp_server.measurement.model_run.loop import Budget, Limits

QUESTIONS_PATH = MCP_DIR / "measurement" / "questions.json"
MODELS_PATH = MCP_DIR / "measurement" / "models.toml"
SKILL_PATH = MCP_DIR / "skills" / "amazonia360" / "SKILL.md"
RUNS_DIR = MCP_DIR / "var" / "model-runs"
CHARS_PER_TOKEN = 3.5
YES = ("s", "si", "sí")
INSTALL_MEASURE = "install the measure group: uv sync --group measure"


def _measure_modules() -> tuple[ModuleType, ModuleType]:
    # LangChain is an optional group: only run needs it, and only when it starts.
    try:
        loop = importlib.import_module("mcp_server.measurement.model_run.loop")
        providers = importlib.import_module(
            "mcp_server.measurement.model_run.providers"
        )
    except ModuleNotFoundError as exc:
        if not (exc.name or "").startswith("langchain"):
            raise
        raise SystemExit(INSTALL_MEASURE) from exc
    return loop, providers


def _store_env(store: bool) -> dict[str, str]:
    return {"MCP_AREA_SOURCES": area_sources(store)}


async def _server_shape(store: bool, with_tools: bool) -> tuple[str, list[dict]]:
    if not with_tools:
        return "", []
    async with server_session(_store_env(store)) as server:
        return system_prompt(server.instructions, SKILL_PATH), server.tools


def _fixed_tokens(prompt: str, tools: list[dict]) -> int:
    chars = len(prompt) + len(json.dumps(tools, ensure_ascii=False))
    return round(chars / CHARS_PER_TOKEN)


def _print_estimate(
    models: list[ModelSpec], questions: list[Question], fixed_tokens: int
) -> None:
    print(
        f"{len(questions)} questions, {fixed_tokens} fixed tokens per turn "
        "(system prompt and tool schemas). Assumes each question's expected calls\n"
        "and no caching; a model that makes more calls costs more, the spending cap "
        "is the guard:"
    )
    total = 0.0
    for spec in models:
        usd = sum(estimate_question(q, fixed_tokens, spec.price) for q in questions)
        total += usd
        print(f"  {spec.label:<16} {spec.model:<22} {usd:>9.4f} USD")
    print(f"  {'total':<39} {total:>9.4f} USD")


def _run_id() -> str:
    return datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")


def _server_commit() -> str | None:
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=MCP_DIR,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout.strip() or None


def _model_entry(spec: ModelSpec) -> dict[str, Any]:
    price = {**asdict(spec.price), "read_on": spec.price.read_on.isoformat()}
    return {
        "label": spec.label,
        "provider": spec.provider,
        "model": spec.model,
        "price": price,
    }


def _describe(exc: BaseException) -> str:
    if isinstance(exc, BaseExceptionGroup):
        return "; ".join(_describe(inner) for inner in exc.exceptions)
    return f"{type(exc).__name__}: {exc}"


def _error_record(
    run_id: str,
    spec: ModelSpec,
    question: Question,
    store: bool,
    started: datetime,
    clock: float,
    exc: Exception,
    charged_usd: float,
) -> QuestionRecord:
    return QuestionRecord(
        run_id=run_id,
        model=spec.label,
        question=question.number,
        store=store,
        started=started.isoformat(),
        ended_at=datetime.now(UTC).isoformat(),
        total_ms=round((time.monotonic() - clock) * 1000),
        turns=[],
        calls=[],
        usage=Usage(0, 0, 0, 0),
        # The turns before the failure were billed; only their token split is lost.
        price_usd=charged_usd,
        answer="",
        ended="error",
        error=f"{_describe(exc)} (usage lost; {charged_usd:.4f} USD charged)",
    )


async def _ask(
    loop: ModuleType,
    providers: ModuleType,
    spec: ModelSpec,
    question: Question,
    limits: Limits,
    budget: Budget,
    run_id: str,
    store: bool,
    errlog_path: Path,
    with_tools: bool,
) -> QuestionRecord:
    started = datetime.now(UTC)
    clock = time.monotonic()
    before_usd = budget.spent_usd
    record: QuestionRecord | None = None
    try:
        if not with_tools:
            return await loop.run_question(
                providers.make_chat(spec, []),
                _no_server,
                None,
                question,
                spec.price,
                limits,
                budget,
                run_id=run_id,
                model=spec.label,
                store=False,
            )
        env = server_env(run_id, question.number, store)
        async with server_session(env, errlog_path) as server:
            answered: QuestionRecord = await loop.run_question(
                providers.make_chat(spec, server.tools),
                server.call_tool,
                system_prompt(server.instructions, SKILL_PATH),
                question,
                spec.price,
                limits,
                budget,
                run_id=run_id,
                model=spec.label,
                store=store,
            )
            record = answered
        return answered
    except Exception as exc:
        # A server that dies on the way out does not void an answer already given.
        if record is not None:
            return record
        charged = budget.spent_usd - before_usd
        return _error_record(
            run_id, spec, question, store, started, clock, exc, charged
        )


async def _no_server(name: str, arguments: dict) -> tuple[str, bool]:
    return f"No tool {name!r}: this run has no MCP server.", True


async def _run_all(
    loop: ModuleType,
    providers: ModuleType,
    models: list[ModelSpec],
    questions: list[Question],
    limits: Limits,
    budget: Budget,
    run_id: str,
    run_dir: Path,
    store: bool,
    with_tools: bool,
) -> None:
    trace = run_dir / "trace.jsonl"
    for spec in models:
        for question in questions:
            if budget.exhausted():
                print(f"Spending cap of {budget.cap_usd} USD reached; the run stops.")
                return
            record = await _ask(
                loop,
                providers,
                spec,
                question,
                limits,
                budget,
                run_id,
                store,
                run_dir / "server.log",
                with_tools,
            )
            append_record(trace, record)
            print(
                f"{spec.label:<16} q{question.number:<3} {record.ended:<10} "
                f"{record.price_usd:>8.4f} USD {record.total_ms / 1000:>7.1f} s  "
                f"total {budget.spent_usd:.4f} USD",
                flush=True,
            )


async def _measure(
    loop: ModuleType,
    providers: ModuleType,
    models: list[ModelSpec],
    questions: list[Question],
    tools: list[dict],
    run: dict[str, Any],
    limits: Limits,
    budget: Budget,
    run_dir: Path,
    store: bool,
    with_tools: bool,
) -> None:
    # One event loop for both steps: provider clients cache connections bound to it.
    for spec in models:
        await providers.preflight(spec, tools)
    run_dir.mkdir(parents=True)
    _write_run(run_dir, run)
    print(f"Run {run['run_id']}: {run_dir}")
    ended = "interrupted"
    try:
        await _run_all(
            loop,
            providers,
            models,
            questions,
            limits,
            budget,
            run["run_id"],
            run_dir,
            store,
            with_tools,
        )
        ended = "finished"
    finally:
        # The spending of a question cut short is only in the budget; keep it on disk.
        _write_run(run_dir, {**run, "ended": ended, "spent_usd": budget.spent_usd})


def _load(args: argparse.Namespace) -> tuple[list[ModelSpec], list[Question]]:
    labels = [label.strip() for label in args.models.split(",") if label.strip()]
    try:
        numbers = (
            [int(n) for n in args.questions.split(",") if n.strip()]
            if args.questions
            else None
        )
        return load_models(MODELS_PATH, labels), load_questions(QUESTIONS_PATH, numbers)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc


def _estimate(args: argparse.Namespace) -> None:
    models, questions = _load(args)
    prompt, tools = asyncio.run(_server_shape(args.sources is None, not args.no_tools))
    _print_estimate(models, questions, _fixed_tokens(prompt, tools))


def _run(args: argparse.Namespace) -> None:
    loop, providers = _measure_modules()
    models, questions = _load(args)
    with_tools = not args.no_tools
    store = args.sources is None and with_tools
    prompt, tools = asyncio.run(_server_shape(store, with_tools))
    _print_estimate(models, questions, _fixed_tokens(prompt, tools))
    if not args.yes and input("¿Seguir? [s/N] ").strip().lower() not in YES:
        print("Nothing was run.")
        return
    run_id = _run_id()
    run_dir = args.out / run_id
    limits = loop.Limits(max_turns=args.max_turns, max_seconds=args.max_seconds)
    run = {
        "run_id": run_id,
        "models": [_model_entry(spec) for spec in models],
        "questions": [asdict(q) for q in questions],
        "store": store,
        "tools": with_tools,
        "limits": {
            "max_turns": limits.max_turns,
            "max_seconds": limits.max_seconds,
            "max_spend_usd": args.max_spend,
        },
        "caching": providers.CACHING,
        "effort": "provider default",
        "server_commit": _server_commit(),
    }
    budget = loop.Budget(args.max_spend)
    try:
        asyncio.run(
            _measure(
                loop,
                providers,
                models,
                questions,
                tools,
                run,
                limits,
                budget,
                run_dir,
                store,
                with_tools,
            )
        )
    except providers.PreflightError as exc:
        raise SystemExit(f"Preflight failed, nothing was run: {exc}") from exc
    except KeyboardInterrupt:
        raise SystemExit(
            f"Interrupted; the finished questions are in {run_dir / 'trace.jsonl'}"
        ) from None


def _write_run(run_dir: Path, run: dict[str, Any]) -> None:
    (run_dir / "run.json").write_text(
        json.dumps(run, ensure_ascii=False, indent=2) + "\n", "utf-8"
    )


def _summary(args: argparse.Namespace) -> None:
    run_dir: Path = args.run_dir
    run = json.loads((run_dir / "run.json").read_text("utf-8"))
    records, skipped = read_records(run_dir / "trace.jsonl")
    summary, answers = summarise(run, records)
    (run_dir / "summary.md").write_text(summary, "utf-8")
    (run_dir / "answers.md").write_text(answers, "utf-8")
    print(f"Wrote {run_dir / 'summary.md'} and {run_dir / 'answers.md'}")
    if skipped:
        print(f"{skipped} trace lines could not be read and were skipped.")


def _add_selection(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--models", required=True, help="comma-separated labels in models.toml"
    )
    parser.add_argument(
        "--questions",
        default="",
        help="comma-separated question numbers (all without requires, if omitted)",
    )
    server = parser.add_mutually_exclusive_group()
    server.add_argument(
        "--no-tools",
        action="store_true",
        help="no MCP server: the questions alone, no tools and no system prompt",
    )
    server.add_argument(
        "--sources",
        choices=["arcgis"],
        default=None,
        help="arcgis turns the layer store off (MCP_AREA_SOURCES=arcgis)",
    )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="amazonia360-mcp-measure")
    commands = parser.add_subparsers(dest="command", required=True)
    estimate = commands.add_parser("estimate", help="price a run before it starts")
    _add_selection(estimate)
    run = commands.add_parser("run", help="ask every question to every model")
    _add_selection(run)
    run.add_argument("--max-spend", type=float, required=True, help="USD, whole run")
    run.add_argument("--max-turns", type=int, default=60, help="per question")
    run.add_argument("--max-seconds", type=float, default=600.0, help="per question")
    run.add_argument("--yes", action="store_true", help="do not ask before running")
    run.add_argument("--out", type=Path, default=RUNS_DIR)
    summary = commands.add_parser("summary", help="write summary.md and answers.md")
    summary.add_argument("run_dir", type=Path)
    args = parser.parse_args(argv)
    {"estimate": _estimate, "run": _run, "summary": _summary}[args.command](args)


if __name__ == "__main__":
    main()
