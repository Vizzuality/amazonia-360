import json
from pathlib import Path

import pytest

from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.timing_run import load_areas, run_round, summarise
from tests.test_handlers import FakeClient

pytestmark = pytest.mark.usefixtures("fixed_catalogue")


def test_the_fixed_areas_are_the_three_trial_towns() -> None:
    assert set(load_areas()) == {"puyo", "tena", "nuevo-rocafuerte"}


@pytest.mark.anyio
async def test_a_round_times_each_tool_each_indicator_takes(tmp_path: Path) -> None:
    log_path = tmp_path / "timing.jsonl"
    areas = {"tena": load_areas()["tena"]}
    await run_round(
        AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        areas,
        CallLog(log_path),
        1,
    )
    records = [json.loads(line) for line in log_path.read_text().splitlines()]
    calls = {(r["indicator_id"], r["tool"]) for r in records}
    # The fixed catalogue: 210 and 211 categorical, 202 count.
    assert calls == {
        (210, "categories_in_area"),
        (210, "area_by_category"),
        (211, "categories_in_area"),
        (211, "area_by_category"),
        (202, "count_in_area"),
    }
    assert all(r["ok"] and isinstance(r["elapsed_ms"], int) for r in records)


def test_summary_counts_slow_calls_and_errors(tmp_path: Path) -> None:
    log_path = tmp_path / "timing.jsonl"
    rows = [
        {"tool": "area_by_category", "indicator_id": 210, "ok": True, "elapsed_ms": ms}
        for ms in (3_000, 3_500, 61_000)
    ] + [
        {
            "tool": "area_by_category",
            "indicator_id": 210,
            "ok": False,
            "elapsed_ms": 900,
        }
    ]
    log_path.write_text("".join(json.dumps(r) + "\n" for r in rows))
    [row] = summarise(log_path)
    assert row["calls"] == 4
    assert row["errors"] == 1
    assert row["over_10s"] == 1
    assert row["over_60s"] == 1
    assert row["max_ms"] == 61_000
