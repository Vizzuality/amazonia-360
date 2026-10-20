import json
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import ClassVar

import pytest
from langchain_core.messages import AIMessage, BaseMessage

from mcp_server.measurement.model_run import cli, providers
from mcp_server.measurement.model_run.cli import main
from mcp_server.measurement.model_run.pricing import Usage
from mcp_server.measurement.model_run.providers import PreflightError
from mcp_server.measurement.model_run.summary import summarise
from mcp_server.measurement.model_run.trace import (
    QuestionRecord,
    ToolCallRecord,
    TurnRecord,
    append_record,
    read_records,
)

RUN = {
    "run_id": "20261020T120000Z",
    "models": [
        {"label": "sonnet", "provider": "anthropic", "model": "claude-sonnet-5-5"},
        {"label": "openai-mid", "provider": "openai", "model": "gpt-6.1-sol"},
    ],
    "questions": [
        {"number": 19, "text": "¿Qué hay en Yasuní?", "expected": "Forty calls"},
        {"number": 2, "text": "¿Hay áreas en Mejía?", "expected": "Asked which"},
    ],
    "store": True,
    "limits": {"max_turns": 60, "max_seconds": 600.0, "max_spend_usd": 20.0},
    "server_commit": "abc123",
}
# 300,000 input tokens at sonnet's 2 USD per million: 0.6 USD.
COSTLY = {"input_tokens": 300_000, "output_tokens": 0, "total_tokens": 300_000}
FREE = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}


def record(
    model: str, question: int, ended: str = "answer", price: float = 0.5
) -> QuestionRecord:
    return QuestionRecord(
        run_id=RUN["run_id"],
        model=model,
        question=question,
        store=True,
        started="2026-10-20T12:00:00+00:00",
        ended_at="2026-10-20T12:00:10+00:00",
        total_ms=10_000 + question,
        turns=[TurnRecord(100, 0, 0, 10, 500)],
        calls=[ToolCallRecord("find_places", {"query": "Tena"}, 20, 300, None)],
        usage=Usage(100, 0, 0, 10),
        price_usd=price,
        answer=f"Respuesta de {model} a {question}",
        ended=ended,  # type: ignore[arg-type]
        error=None,
    )


@pytest.fixture
def tmp_records() -> list[QuestionRecord]:
    return [
        record("sonnet", 19, "turn_limit", 2.0),
        record("sonnet", 2),
        record("openai-mid", 19),
        record("openai-mid", 2),
    ]


class FakeServer:
    instructions = "Instrucciones del servidor."
    tools: ClassVar[list[dict]] = [
        {"type": "function", "function": {"name": "find_places"}}
    ]

    async def call_tool(self, name: str, arguments: dict) -> tuple[str, bool]:
        return "ok", False


@pytest.fixture
def fakes(monkeypatch):
    """A fake server; each question costs 0.6 USD; preflight passes."""
    seen: dict[str, list] = {"envs": [], "chats": []}

    @asynccontextmanager
    async def fake_session(env: dict[str, str]):
        seen["envs"].append(env)
        yield FakeServer()

    def fake_make_chat(spec, tools, *, max_tokens=None):
        seen["chats"].append(spec.label)
        queue = [
            AIMessage(
                content="",
                tool_calls=[
                    {"name": "find_places", "args": {}, "id": "c1", "type": "tool_call"}
                ],
                usage_metadata=COSTLY,
            ),
            AIMessage(content="Listo.", usage_metadata=FREE),
        ]

        async def chat(messages: list[BaseMessage]) -> AIMessage:
            return queue.pop(0)

        return chat

    async def fake_preflight(spec, tools) -> None:
        return None

    monkeypatch.setattr(cli, "server_session", fake_session)
    monkeypatch.setattr(providers, "make_chat", fake_make_chat)
    monkeypatch.setattr(providers, "preflight", fake_preflight)
    return seen


def test_summary_per_model(tmp_records):
    summary, answers = summarise(RUN, tmp_records)
    assert "| sonnet |" in summary and "turn_limit" in summary
    assert "| openai-mid |" in summary
    assert "2.5000" in summary  # sonnet's total
    assert answers.index("## 19.") > answers.index("## 2.")
    assert "Expected:" in answers
    assert "Respuesta de openai-mid a 19" in answers


def test_summary_says_when_a_model_did_not_run_a_question(tmp_records):
    summary, answers = summarise(
        {**RUN, "spent_usd": 3.25, "ended": "interrupted"}, tmp_records[1:]
    )
    assert "Spent in the run: 3.2500 USD, interrupted" in summary
    assert "### sonnet" in answers.split("## 19.")[1]
    assert "Not run" in answers.split("## 19.")[1]


def test_estimate_prints_per_model_and_total(fakes, capsys):
    main(["estimate", "--models", "sonnet,deepseek-mid", "--questions", "1,19"])
    out = capsys.readouterr().out
    assert "sonnet" in out and "deepseek-mid" in out and "total" in out
    assert fakes["envs"] == [{}]
    assert fakes["chats"] == []


def test_estimate_without_the_store_starts_the_server_on_arcgis(fakes, capsys):
    main(["estimate", "--models", "sonnet", "--sources", "arcgis"])
    assert fakes["envs"] == [{"MCP_AREA_SOURCES": "arcgis"}]


def test_run_stops_at_the_cap_and_keeps_finished_questions(tmp_path, fakes, capsys):
    main(
        [
            "run",
            "--models",
            "sonnet",
            "--questions",
            "1,2,3",
            "--max-spend",
            "1.0",
            "--yes",
            "--out",
            str(tmp_path),
        ]
    )
    records = read_records(next(tmp_path.glob("*/trace.jsonl")))
    assert [r.ended for r in records] == ["answer", "spend_cap"]
    assert fakes["chats"] == ["sonnet", "sonnet"]  # question 3 never started


def test_run_writes_run_json_and_tags_the_server(tmp_path, fakes, capsys):
    main(
        [
            "run",
            "--models",
            "sonnet",
            "--questions",
            "1",
            "--max-spend",
            "5",
            "--sources",
            "arcgis",
            "--yes",
            "--out",
            str(tmp_path),
        ]
    )
    run_dir = next(tmp_path.iterdir())
    run = json.loads((run_dir / "run.json").read_text("utf-8"))
    assert run["run_id"] == run_dir.name
    assert run["store"] is False
    assert run["models"][0]["price"]["read_on"] == "2026-10-20"
    assert run["questions"][0]["number"] == 1
    assert run["limits"] == {
        "max_turns": 60,
        "max_seconds": 600.0,
        "max_spend_usd": 5.0,
    }
    assert "anthropic" in run["caching"]
    assert "server_commit" in run
    assert fakes["envs"][-1] == {
        "MCP_RUN_ID": run_dir.name,
        "MCP_QUESTION": "1",
        "MCP_AREA_SOURCES": "arcgis",
    }
    out = capsys.readouterr().out
    assert "sonnet" in out and "answer" in out


def test_run_refuses_before_spending_when_preflight_fails(tmp_path, fakes, monkeypatch):
    async def failing(spec, tools) -> None:
        raise PreflightError("sonnet (anthropic): BadRequestError: schema")

    monkeypatch.setattr(providers, "preflight", failing)
    with pytest.raises(SystemExit) as exc:
        main(
            [
                "run",
                "--models",
                "sonnet",
                "--max-spend",
                "1",
                "--yes",
                "--out",
                str(tmp_path),
            ]
        )
    assert exc.value.code != 0
    assert not list(tmp_path.glob("*/trace.jsonl"))
    assert fakes["chats"] == []


class FailingServer(FakeServer):
    def __init__(self, failure: BaseException) -> None:
        self.failure = failure

    async def call_tool(self, name: str, arguments: dict) -> tuple[str, bool]:
        raise self.failure


def failing_on_two(real, failure: BaseException):
    """The server answers question 2's first tool call, already paid, by failing."""

    @asynccontextmanager
    async def session(env: dict[str, str]):
        if env.get("MCP_QUESTION") == "2":
            yield FailingServer(failure)
            return
        async with real(env) as server:
            yield server

    return session


def run_three(tmp_path: Path) -> None:
    main(
        [
            "run",
            "--models",
            "sonnet",
            "--questions",
            "1,2,3",
            "--max-spend",
            "10",
            "--yes",
            "--out",
            str(tmp_path),
        ]
    )


def test_run_records_a_crashed_server_and_goes_on(tmp_path, fakes, monkeypatch):
    crash = ExceptionGroup("server", [RuntimeError("process exited")])
    monkeypatch.setattr(
        cli, "server_session", failing_on_two(cli.server_session, crash)
    )
    run_three(tmp_path)
    run_dir = next(tmp_path.iterdir())
    records = read_records(run_dir / "trace.jsonl")
    assert [r.ended for r in records] == ["answer", "error", "answer"]
    assert "process exited" in (records[1].error or "")
    assert "usage lost; 0.6000 USD charged" in (records[1].error or "")
    assert records[1].price_usd == pytest.approx(0.6)
    run = json.loads((run_dir / "run.json").read_text("utf-8"))
    assert run["ended"] == "finished"
    assert run["spent_usd"] == pytest.approx(1.8)


def test_run_keeps_the_spending_on_disk_when_interrupted(tmp_path, fakes, monkeypatch):
    monkeypatch.setattr(
        cli,
        "server_session",
        failing_on_two(cli.server_session, KeyboardInterrupt()),
    )
    with pytest.raises(SystemExit):
        run_three(tmp_path)
    run_dir = next(tmp_path.iterdir())
    assert [r.ended for r in read_records(run_dir / "trace.jsonl")] == ["answer"]
    run = json.loads((run_dir / "run.json").read_text("utf-8"))
    assert run["ended"] == "interrupted"
    assert run["spent_usd"] == pytest.approx(1.2)


def test_run_keeps_the_answer_when_the_server_dies_on_exit(
    tmp_path, fakes, monkeypatch
):
    real = cli.server_session

    @asynccontextmanager
    async def dying_on_exit(env: dict[str, str]):
        async with real(env) as server:
            yield server
        if "MCP_RUN_ID" in env:
            raise ExceptionGroup("server", [RuntimeError("process exited")])

    monkeypatch.setattr(cli, "server_session", dying_on_exit)
    main(
        [
            "run",
            "--models",
            "sonnet",
            "--questions",
            "1",
            "--max-spend",
            "10",
            "--yes",
            "--out",
            str(tmp_path),
        ]
    )
    records = read_records(next(tmp_path.glob("*/trace.jsonl")))
    assert [r.ended for r in records] == ["answer"]


def test_run_asks_before_spending(tmp_path, fakes, monkeypatch, capsys):
    monkeypatch.setattr("builtins.input", lambda prompt: "n")
    main(
        [
            "run",
            "--models",
            "sonnet",
            "--questions",
            "1",
            "--max-spend",
            "1",
            "--out",
            str(tmp_path),
        ]
    )
    assert not list(tmp_path.iterdir())
    assert fakes["chats"] == []


def test_run_without_the_measure_group_says_how_to_install(tmp_path, monkeypatch):
    for name in ("loop", "providers"):
        monkeypatch.delitem(sys.modules, f"mcp_server.measurement.model_run.{name}")
    for name in list(sys.modules):
        if name.startswith("langchain"):
            monkeypatch.setitem(sys.modules, name, None)
    with pytest.raises(SystemExit) as exc:
        main(
            [
                "run",
                "--models",
                "sonnet",
                "--max-spend",
                "1",
                "--yes",
                "--out",
                str(tmp_path),
            ]
        )
    assert "uv sync --group measure" in str(exc.value.code)


def test_summary_reads_an_interrupted_trace(tmp_path, capsys):
    run_dir = tmp_path / RUN["run_id"]
    run_dir.mkdir()
    (run_dir / "run.json").write_text(json.dumps(RUN), "utf-8")
    trace = run_dir / "trace.jsonl"
    append_record(trace, record("sonnet", 2))
    with trace.open("a", encoding="utf-8") as handle:
        handle.write('{"run_id": "20261020T120000Z", "model": "son')
    main(["summary", str(run_dir)])
    assert (run_dir / "summary.md").exists()
    assert "Respuesta de sonnet a 2" in (run_dir / "answers.md").read_text("utf-8")


def test_skill_path_resolves_from_the_package():
    assert cli.SKILL_PATH.is_file()
    assert Path(cli.QUESTIONS_PATH).is_file() and Path(cli.MODELS_PATH).is_file()
