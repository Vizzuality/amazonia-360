# MCP model measurement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A command, `amazonia360-mcp-measure`, that sends each base question to a model with the
MCP server attached and records cost, latency, tool calls and the answer, per question and model.

**Architecture:** The program plays the platform. For each question it starts a fresh stdio server
process (with the run id and question number in its environment, so `var/calls.jsonl` lines carry
them), lists the tools through the MCP SDK's own client, hands their published schemas to a
LangChain chat model, and loops model turn → tool call → result until the final answer, a limit or
the spending cap. Each finished question is appended to a trace file; a summary and a grading
document are built from the trace.

**Tech Stack:** Python 3.12, uv, the `mcp` SDK client (already a dependency), LangChain
(`langchain-core`, `langchain-anthropic`, `langchain-openai`, `langchain-deepseek`) in a new
dependency group `measure`, pytest, ruff.

**Spec:** `docs/superpowers/specs/2026-10-20-mcp-model-measurement-design.md`

## Global Constraints

- All code in `mcp/`; the command is `amazonia360-mcp-measure`, an argparse CLI like
  `amazonia360-mcp-timing`.
- LangChain packages go in a uv dependency group `measure`, included in `dev`
  (`{include-group = "measure"}`) so tests run; never in `[project] dependencies`. The CLI imports
  them lazily and, if missing, exits with "install the measure group: uv sync --group measure".
- No `langchain-mcp-adapters`: tools are listed and called with the `mcp` SDK client, and their
  `inputSchema` is passed to the model unchanged, with strict function calling off.
- API keys only from the environment: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`.
- System prompt for every model: the server's `instructions` (from the MCP `initialize` result)
  followed by the body of `mcp/skills/amazonia360/SKILL.md` without its front matter.
- Store on means the server's default sources; store off means `MCP_AREA_SOURCES=arcgis`.
- Questions with `requires` set (20, 21) are skipped unless named explicitly with `--questions`.
- Runs are written under `mcp/var/model-runs/<run_id>/`; `var/` is never committed.
- Prices come only from `mcp/measurement/models.toml`; a model without its prices, date and source
  URL is refused before any call.
- Python style of the repo: type hints everywhere, double quotes, 88 columns, ruff clean,
  comments only for why.

## Review Focus

- A model that keeps calling tools forever (question 19 with a weak model): the loop stops at the
  turn limit, records `ended: "turn_limit"`, and its cost counts. Pinned in Task 3.
- The spending cap reached in the middle of a question: the question is recorded as
  `ended: "spend_cap"`, the run stops, and every earlier question stays in the trace. Pinned in
  Task 3 and Task 5.
- A tool call that fails (bad arguments, ArcGIS timeout): the error text goes back to the model as
  the tool result, is recorded on the call, and the loop continues. Pinned in Task 3.
- A provider that rejects the tool schemas: the preflight fails before the first paid question and
  names the provider and the error. Pinned in Task 4.
- An interrupted run (Ctrl-C, crash): the trace holds every question finished before it, one JSON
  line each, and `summary` works on it. Pinned in Task 5.

---

### Task 1: The server's call log knows the run, the question and the session

**Files:**
- Modify: `mcp/src/mcp_server/config.py` (Settings)
- Modify: `mcp/src/mcp_server/measurement/call_log.py`
- Modify: `mcp/src/mcp_server/server.py`, `mcp/src/mcp_server/tools/area.py`,
  `mcp/src/mcp_server/tools/catalogue.py`, `mcp/src/mcp_server/tools/places.py`
- Test: `mcp/tests/test_measurement.py`, `mcp/tests/test_http_app.py`

**Interfaces:**
- Produces: `Settings.call_context: dict[str, str]`, read from `MCP_RUN_ID` and `MCP_QUESTION`
  (keys `run_id` and `question`, only those set). `CallLog(path: Path, context: dict[str, str] |
  None = None)` writes `context` into every line. Every line also carries `"session"`: the
  `mcp-session-id` of the request over HTTP, null on stdio.
- Produces: log lines for `find_places`, `list_places`, `list_indicators`, `describe_indicator`
  with `tool`, `user`, `session`, `ok`, `elapsed_ms`, and the tool's arguments (`query`, `kind`,
  `province`, `indicator_id` as the tool has them).

- [ ] **Step 1: Write the failing tests**

```python
def test_call_log_writes_context(tmp_path):
    log = CallLog(tmp_path / "calls.jsonl", context={"run_id": "r1", "question": "19"})
    log.write({"tool": "find_places"})
    line = json.loads((tmp_path / "calls.jsonl").read_text())
    assert line["run_id"] == "r1" and line["question"] == "19"

def test_settings_call_context_from_env(monkeypatch):
    monkeypatch.setenv("MCP_RUN_ID", "r1")
    monkeypatch.setenv("MCP_QUESTION", "7")
    assert Settings.from_env().call_context == {"run_id": "r1", "question": "7"}

def test_settings_call_context_empty_by_default(monkeypatch):
    monkeypatch.delenv("MCP_RUN_ID", raising=False)
    monkeypatch.delenv("MCP_QUESTION", raising=False)
    assert Settings.from_env().call_context == {}
```

Plus, in the style of the existing tool tests: calling `find_places`, `list_places`,
`list_indicators` and `describe_indicator` through the server writes one line each with
`tool` set to the tool's name and `ok: true`; `describe_indicator` with an unknown id writes
`ok: false` with the error. And in `test_http_app.py`, following its existing client helpers: a
tool call over HTTP writes a line whose `session` equals the `mcp-session-id` the client received.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd mcp && uv run pytest tests/test_measurement.py tests/test_http_app.py -q`
Expected: FAIL (unexpected keyword `context`, no `call_context`, no lines for the four tools).

- [ ] **Step 3: Implement**

`Settings.call_context` from the two variables. `CallLog` merges `context` after `ts` and before
the record. The session id comes from the request in the SDK's request context (the HTTP request
headers, `mcp-session-id`); write a `_session()` next to `_caller()` in `tools/area.py` and use it
from the four tools too. `register_catalogue_tools` and `register_place_tools` take the
`CallLog`; `create_mcp_server` passes it and builds it as `CallLog(settings.call_log_path,
settings.call_context)`. Logging never changes a tool's answer or its errors.

- [ ] **Step 4: Run the whole suite**

Run: `cd mcp && uv run pytest -q && uv run ruff check . && uv run ruff format --check .`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add mcp/src mcp/tests
git commit -m "feat(mcp): call log lines carry the run, the question and the HTTP session; the place and catalogue tools are logged (AM-752)"
```

---

### Task 2: Questions, models and prices

**Files:**
- Modify: `mcp/pyproject.toml` (group `measure`, script entry)
- Create: `mcp/src/mcp_server/measurement/model_run/__init__.py`,
  `mcp/src/mcp_server/measurement/model_run/config.py`,
  `mcp/src/mcp_server/measurement/model_run/pricing.py`
- Create: `mcp/measurement/models.toml`
- Existing data: `mcp/measurement/questions.json` (21 questions; fields `number`, `group`, `text`,
  `text_from`, `expected`, `expected_calls`, optional `area` GeoJSON, optional `requires`)
- Test: `mcp/tests/test_model_run_config.py`

**Interfaces:**
- Produces:
  - `Question(number: int, group: str, text: str, expected: str, expected_calls: int, area:
    dict | None, requires: str | None)` with `message() -> str`: the text, and when `area` is set,
    a blank line, `Zona (GeoJSON):` and the geometry as compact JSON.
  - `load_questions(path: Path, numbers: list[int] | None) -> list[Question]`: all questions
    without `requires` when `numbers` is None; exactly the named ones otherwise; an unknown number
    raises `ValueError`.
  - `Price(input: float, cached_input: float, cache_write: float, output: float, read_on: date,
    source: str)`, all in dollars per million tokens.
  - `ModelSpec(label: str, provider: Literal["anthropic", "openai", "deepseek"], model: str,
    price: Price)`.
  - `load_models(path: Path, labels: list[str]) -> list[ModelSpec]`: raises `ValueError` naming
    the label when it is unknown or any price field, `read_on` or `source` is missing.
    `cache_write` defaults to `input` when absent.
  - `Usage(input_tokens: int, cached_tokens: int, cache_write_tokens: int, output_tokens: int)`,
    where `input_tokens` is the total including cached and cache-write tokens, as LangChain's
    `usage_metadata` reports it, with `__add__`.
  - `cost(usage: Usage, price: Price) -> float`: uncached input at `input`, cached at
    `cached_input`, cache writes at `cache_write`, output at `output`.
  - `estimate_question(question: Question, fixed_tokens: int, price: Price) -> float`: upper bound
    without caching. With `c = expected_calls`, `R = 1000` tokens per call and result, and
    `O = 300` output tokens per turn: input `sum(fixed_tokens + k * R for k in range(c + 1))`,
    output `(c + 1) * O`.

`models.toml` holds one `[[model]]` table per model with `label`, `provider`, `model`, and
`price = { input, cached_input, cache_write, output, read_on, source }`. The file already
exists, filled from the providers' pages on 20 October 2026: eight models (DeepSeek publishes
two), DeepSeek at its peak rates. `load_models` must accept it as it stands; a test loads all
eight labels from it.

- [ ] **Step 1: Write the failing tests**

```python
def test_question_message_appends_area():
    q = Question(7, "C", "¿Cuántas hectáreas…?", "", 2, {"type": "Polygon", "coordinates": []}, None)
    assert q.message().startswith("¿Cuántas hectáreas…?\n\nZona (GeoJSON): {")

def test_load_questions_skips_required_by_default():
    numbers = [q.number for q in load_questions(QUESTIONS, None)]
    assert numbers == list(range(1, 20))

def test_load_questions_named_includes_required():
    assert [q.number for q in load_questions(QUESTIONS, [20, 3])] == [20, 3]

def test_load_questions_unknown_number():
    with pytest.raises(ValueError, match="22"):
        load_questions(QUESTIONS, [22])

def test_load_models_refuses_missing_price(tmp_path):
    (tmp_path / "m.toml").write_text('[[model]]\nlabel="x"\nprovider="openai"\nmodel="m"\n')
    with pytest.raises(ValueError, match="x"):
        load_models(tmp_path / "m.toml", ["x"])

def test_cost_splits_cached_tokens():
    price = Price(3.0, 0.3, 3.75, 15.0, date(2026, 10, 20), "https://example.org")
    usage = Usage(input_tokens=1_000_000, cached_tokens=600_000, cache_write_tokens=100_000,
                  output_tokens=100_000)
    assert cost(usage, price) == pytest.approx(0.9 + 0.18 + 0.375 + 1.5)

def test_estimate_question_grows_with_calls():
    price = Price(1.0, 0.1, 1.0, 1.0, date(2026, 10, 20), "s")
    q = Question(1, "A", "t", "", 2, None, None)
    # input: 4500 + 5500 + 6500 = 16500; output: 900
    assert estimate_question(q, 4500, price) == pytest.approx(17_400 / 1_000_000)
```

`QUESTIONS` is `Path(__file__).parents[1] / "measurement" / "questions.json"`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd mcp && uv run pytest tests/test_model_run_config.py -q`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** the dataclasses and functions above (frozen dataclasses; TOML with
`tomllib`). Add the `measure` group with `langchain-core`, `langchain-anthropic`,
`langchain-openai`, `langchain-deepseek` at their current releases (`uv add --group measure …`),
include it in `dev`, and add the script `amazonia360-mcp-measure =
"mcp_server.measurement.model_run.cli:main"` (the module comes in Task 5; until then the entry
is unused).

- [ ] **Step 4: Run tests and lint**

Run: `cd mcp && uv run pytest -q && uv run ruff check . && uv run ruff format --check .`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add mcp/pyproject.toml mcp/uv.lock mcp/measurement mcp/src/mcp_server/measurement/model_run mcp/tests/test_model_run_config.py
git commit -m "feat(mcp): base questions in Spanish, model prices and cost arithmetic for the model measurement (AM-755)"
```

---

### Task 3: The question loop and its trace

**Files:**
- Create: `mcp/src/mcp_server/measurement/model_run/trace.py`,
  `mcp/src/mcp_server/measurement/model_run/loop.py`
- Test: `mcp/tests/test_model_run_loop.py`

**Interfaces:**
- Consumes: `Question`, `Usage`, `Price`, `cost` from Task 2.
- Produces (`trace.py`):
  - `TurnRecord(input_tokens: int, cached_tokens: int, cache_write_tokens: int,
    output_tokens: int, model_ms: int)`.
  - `ToolCallRecord(name: str, arguments: dict, ms: int, result_chars: int, error: str | None)`.
  - `QuestionRecord(run_id: str, model: str, question: int, store: bool, started: str,
    ended_at: str, total_ms: int, turns: list[TurnRecord], calls: list[ToolCallRecord],
    usage: Usage, price_usd: float, answer: str, ended: Literal["answer", "turn_limit",
    "time_limit", "spend_cap", "error"], error: str | None)`.
  - `append_record(path: Path, record: QuestionRecord) -> None`: one JSON line, flushed;
    `read_records(path: Path) -> list[QuestionRecord]`, skipping a truncated last line.
- Produces (`loop.py`):
  - `ChatTurn = Callable[[list[BaseMessage]], Awaitable[AIMessage]]`: one model call with the
    tools already bound.
  - `CallTool = Callable[[str, dict], Awaitable[tuple[str, bool]]]`: returns the result text and
    whether it is an error.
  - `Limits(max_turns: int = 60, max_seconds: float = 600.0)`.
  - `Budget(cap_usd: float)` with `spent_usd: float`, `add(usd: float) -> None`,
    `exhausted() -> bool` (spent ≥ cap).
  - `async run_question(chat: ChatTurn, call_tool: CallTool, system_prompt: str,
    question: Question, price: Price, limits: Limits, budget: Budget, *, run_id: str, model: str,
    store: bool) -> QuestionRecord`.

Loop: messages start as `[SystemMessage(system_prompt), HumanMessage(question.message())]`. Each
turn: call `chat`, time it, read `usage_metadata` (`input_tokens`, `output_tokens`,
`input_token_details.cache_read`, `input_token_details.cache_creation`, missing ones as 0), add
its cost to the budget. No `tool_calls` → `ended="answer"`, `answer` is the message text. Else
run each tool call in order, append a `ToolMessage` per call (error text as content when it
failed), record it. After each turn check, in this order: budget exhausted → `"spend_cap"`;
turns ≥ `max_turns` → `"turn_limit"`; elapsed ≥ `max_seconds` → `"time_limit"`. An exception from
`chat` ends the question with `ended="error"` and the exception text. On any ending other than
`"answer"`, `answer` is the last model text seen, or `""`.

- [ ] **Step 1: Write the failing tests** with a scripted fake `chat` returning `AIMessage`s
(with `tool_calls` and `usage_metadata`) and a fake `call_tool`:

```python
async def test_answer_after_one_tool_call():
    record = await run_question(scripted([tool_msg("find_places", {"query": "Tena"}), final("Tena tiene…")]),
                                ok_tool, "sys", Q, PRICE, Limits(), Budget(10), run_id="r", model="m", store=True)
    assert record.ended == "answer" and record.answer == "Tena tiene…"
    assert [c.name for c in record.calls] == ["find_places"] and len(record.turns) == 2
    assert record.usage.input_tokens == 2 * 1000

async def test_turn_limit_stops_a_loop():
    record = await run_question(forever_calling(), ok_tool, "sys", Q, PRICE, Limits(max_turns=3),
                                Budget(10), run_id="r", model="m", store=True)
    assert record.ended == "turn_limit" and len(record.turns) == 3 and record.price_usd > 0

async def test_spend_cap_stops_mid_question():
    record = await run_question(forever_calling(), ok_tool, "sys", Q, PRICE, Limits(),
                                Budget(cap_usd=cost_of_two_turns), run_id="r", model="m", store=True)
    assert record.ended == "spend_cap" and len(record.turns) == 2

async def test_tool_error_goes_back_to_the_model():
    seen = []
    record = await run_question(scripted([tool_msg("area_by_category", {}), final("No pude.")], seen=seen),
                                failing_tool("ArcGIS timeout"), "sys", Q, PRICE, Limits(), Budget(10),
                                run_id="r", model="m", store=True)
    assert record.calls[0].error == "ArcGIS timeout"
    assert seen[-1][-1].content == "ArcGIS timeout"  # the ToolMessage the model received
    assert record.ended == "answer"

async def test_model_exception_is_recorded():
    record = await run_question(raising("rate limit"), ok_tool, "sys", Q, PRICE, Limits(), Budget(10),
                                run_id="r", model="m", store=True)
    assert record.ended == "error" and "rate limit" in record.error

def test_trace_survives_a_truncated_last_line(tmp_path):
    path = tmp_path / "trace.jsonl"
    append_record(path, some_record(question=1))
    with path.open("a") as f:
        f.write('{"run_id": "r", "mod')
    assert [r.question for r in read_records(path)] == [1]
```

Each fake turn reports `usage_metadata={"input_tokens": 1000, "output_tokens": 100,
"total_tokens": 1100}`; `cost_of_two_turns` is `2 * cost(Usage(1000, 0, 0, 100), PRICE)`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd mcp && uv run pytest tests/test_model_run_loop.py -q`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `trace.py` and `loop.py` as specified.

- [ ] **Step 4: Run tests and lint**

Run: `cd mcp && uv run pytest -q && uv run ruff check . && uv run ruff format --check .`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/measurement/model_run mcp/tests/test_model_run_loop.py
git commit -m "feat(mcp): question loop with turn, time and spending limits, and its trace (AM-755)"
```

---

### Task 4: The server session, the providers and the preflight

**Files:**
- Create: `mcp/src/mcp_server/measurement/model_run/session.py`,
  `mcp/src/mcp_server/measurement/model_run/providers.py`
- Test: `mcp/tests/test_model_run_session.py`

**Interfaces:**
- Consumes: `ModelSpec`, `ChatTurn`, `CallTool`.
- Produces (`session.py`):
  - `@asynccontextmanager async def server_session(env: dict[str, str]) ->
    AsyncIterator[ServerSession]`: starts `uv run amazonia360-mcp` over stdio from `mcp/`, with
    the parent environment plus `env`, through `mcp.client.stdio`.
  - `ServerSession` with `instructions: str`, `tools: list[dict]` (OpenAI function format:
    `{"type": "function", "function": {"name", "description", "parameters": inputSchema}}`),
    and `async call_tool(name: str, arguments: dict) -> tuple[str, bool]` returning the text
    content joined, and `isError`.
  - `system_prompt(instructions: str, skill_path: Path) -> str`: instructions, a blank line, the
    skill body without its YAML front matter.
  - `server_env(run_id: str, question: int, store: bool) -> dict[str, str]`: `MCP_RUN_ID`,
    `MCP_QUESTION`, and `MCP_AREA_SOURCES=arcgis` only when `store` is False.
- Produces (`providers.py`):
  - `make_chat(spec: ModelSpec, tools: list[dict]) -> ChatTurn`: `ChatAnthropic`, `ChatOpenAI` or
    `ChatDeepSeek` for the provider, `temperature` left at the provider's default, tools bound
    with `bind_tools(tools, strict=False)` where the class accepts `strict`. For Anthropic, mark
    the system message and the last message of each call with `cache_control: ephemeral` so the
    growing history is cached; OpenAI and DeepSeek cache on their own.
  - `CACHING: dict[str, str]`, the caching each provider uses, written into the run record.
  - `async preflight(spec: ModelSpec, tools: list[dict]) -> None`: one call with
    `HumanMessage("Responde solo: ok")` and the tools bound, `max_tokens` 16; any provider error
    raises `PreflightError` with the label, the provider and the provider's message.

- [ ] **Step 1: Write the failing tests** (no network; the server reads only its snapshots for
these tools):

```python
async def test_session_lists_the_published_tools():
    async with server_session(server_env("r", 1, store=True)) as s:
        names = {t["function"]["name"] for t in s.tools}
        assert {"find_places", "list_places", "area_by_category"} <= names and len(names) == 10
        assert "Ecuador module" in s.instructions

async def test_session_calls_a_tool_and_logs_the_question(tmp_path, monkeypatch):
    monkeypatch.setenv("MCP_CALL_LOG", str(tmp_path / "calls.jsonl"))
    async with server_session(server_env("r9", 3, store=True)) as s:
        text, is_error = await s.call_tool("find_places", {"query": "Tena"})
    assert not is_error and "canton:Napo/Tena" in text
    line = json.loads((tmp_path / "calls.jsonl").read_text().splitlines()[-1])
    assert line["run_id"] == "r9" and line["question"] == "3"

def test_system_prompt_drops_front_matter():
    prompt = system_prompt("INSTR", SKILL)
    assert prompt.startswith("INSTR\n\n# Amazonia 360") and "description:" not in prompt

def test_server_env_store_off():
    assert server_env("r", 1, store=False)["MCP_AREA_SOURCES"] == "arcgis"
    assert "MCP_AREA_SOURCES" not in server_env("r", 1, store=True)

async def test_preflight_names_the_provider(monkeypatch):
    # make the provider class raise on invoke; PreflightError carries label and message
    ...
    with pytest.raises(PreflightError, match="sonnet.*anthropic.*bad schema"):
        await preflight(SONNET, tools)
```

The last test monkeypatches the chat class in `providers` with a fake whose `ainvoke` raises
`ValueError("bad schema")`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd mcp && uv run pytest tests/test_model_run_session.py -q`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** as specified. Check the exact class names, the `strict` parameter and
the cache-control syntax against the installed LangChain packages, not from memory.

- [ ] **Step 4: Run tests and lint**

Run: `cd mcp && uv run pytest -q && uv run ruff check . && uv run ruff format --check .`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/measurement/model_run mcp/tests/test_model_run_session.py
git commit -m "feat(mcp): MCP session, chat models per provider and the schema preflight for the model measurement (AM-755)"
```

---

### Task 5: The command, the summary and the grading document

**Files:**
- Create: `mcp/src/mcp_server/measurement/model_run/cli.py`,
  `mcp/src/mcp_server/measurement/model_run/summary.py`
- Modify: `mcp/README.md` (section "Model measurement")
- Test: `mcp/tests/test_model_run_cli.py`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `amazonia360-mcp-measure estimate --models sonnet,… [--questions 1,19] [--sources arcgis]`:
    prints per model the estimated cost (`estimate_question` over the questions, `fixed_tokens`
    from the measured length of system prompt plus tool schemas divided by 3.5) and the total.
  - `amazonia360-mcp-measure run --models … --max-spend 20 [--questions …] [--sources arcgis]
    [--max-turns 60] [--max-seconds 600] [--yes]`: prints the estimate, asks `¿Seguir? [s/N]`
    unless `--yes`, runs the preflight for every model, then each model × question in order,
    one fresh server per question, appending to `var/model-runs/<run_id>/trace.jsonl`. One
    `Budget` for the whole run: when it is exhausted the run stops after recording that question.
    Writes `run.json` first: run id (UTC timestamp `YYYYMMDDTHHMMSSZ`), models with their prices,
    questions, store on or off, limits, `CACHING`, the server commit (`git rev-parse HEAD`).
  - `amazonia360-mcp-measure summary <run_dir>`: writes `summary.md` (per model: price per
    question, total, median and longest `total_ms`, tool calls, questions not ended by
    `"answer"`) and `answers.md` (per question: text, the proposal's `expected`, then each model's
    answer with its price, time and calls), from `trace.jsonl` and `run.json`.
  - `summarise(run: dict, records: list[QuestionRecord]) -> tuple[str, str]` in `summary.py`, the
    pure part, returning the two documents.

- [ ] **Step 1: Write the failing tests**

```python
def test_summary_per_model(tmp_records):
    summary, answers = summarise(RUN, tmp_records)  # two models, two questions, one turn_limit
    assert "| sonnet |" in summary and "turn_limit" in summary
    assert answers.index("## 19.") > answers.index("## 2.")
    assert "Expected:" in answers

def test_run_stops_at_the_cap_and_keeps_finished_questions(tmp_path, monkeypatch):
    # fakes: server_session, make_chat (each question costs 0.6 USD), preflight no-op
    main(["run", "--models", "sonnet", "--questions", "1,2,3", "--max-spend", "1.0", "--yes",
          "--out", str(tmp_path)])
    records = read_records(next(tmp_path.glob("*/trace.jsonl")))
    assert [r.ended for r in records] == ["answer", "spend_cap"]

def test_run_refuses_before_spending_when_preflight_fails(tmp_path, monkeypatch):
    # preflight raises PreflightError; make_chat must never be called for a question
    with pytest.raises(SystemExit):
        main(["run", "--models", "sonnet", "--max-spend", "1", "--yes", "--out", str(tmp_path)])
    assert not list(tmp_path.glob("*/trace.jsonl"))

def test_summary_reads_an_interrupted_trace(tmp_path):
    # run.json plus a trace with a truncated last line
    main(["summary", str(run_dir)])
    assert (run_dir / "summary.md").exists()
```

`--out` defaults to `var/model-runs`; tests pass it.

- [ ] **Step 2: Run to verify they fail**

Run: `cd mcp && uv run pytest tests/test_model_run_cli.py -q`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** the CLI and `summarise`. Add to `mcp/README.md` a "Model measurement"
section: what it measures, the keys it needs, filling `measurement/models.toml`, the three
commands with the first round as the example (`--models sonnet,<openai mid>,<deepseek mid>
--max-spend 20`), and where the files land.

- [ ] **Step 4: Run tests and lint**

Run: `cd mcp && uv run pytest -q && uv run ruff check . && uv run ruff format --check .`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/measurement/model_run mcp/tests/test_model_run_cli.py mcp/README.md
git commit -m "feat(mcp): amazonia360-mcp-measure estimates, runs and summarises the model measurement (AM-755)"
```
