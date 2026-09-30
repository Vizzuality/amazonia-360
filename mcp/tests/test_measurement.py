import json
from pathlib import Path

import pytest

from mcp_server.measurement import stopwatch
from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.stopwatch import Stopwatch


class Clock:
    def __init__(self) -> None:
        self.now = 100.0

    def __call__(self) -> float:
        return self.now


@pytest.fixture
def clock(monkeypatch: pytest.MonkeyPatch) -> Clock:
    fake = Clock()
    monkeypatch.setattr(stopwatch, "perf_counter", fake)
    return fake


def test_laps_accumulate(clock: Clock) -> None:
    watch = Stopwatch()
    with watch.lap("arcgis"):
        clock.now += 0.25
    clock.now += 1.0
    with watch.lap("arcgis"):
        clock.now += 0.5
    assert watch.ms("arcgis") == 750
    assert watch.ms("clip") == 0
    assert watch.total_ms() == 1750


def test_a_lap_is_recorded_when_the_block_raises(clock: Clock) -> None:
    watch = Stopwatch()
    with pytest.raises(RuntimeError), watch.lap("arcgis"):
        clock.now += 0.01
        raise RuntimeError
    assert watch.ms("arcgis") == 10


def test_call_log_appends_json_lines(tmp_path: Path) -> None:
    path = tmp_path / "nested" / "calls.jsonl"
    log = CallLog(path)
    log.write({"tool": "count_in_area", "ok": True})
    log.write({"tool": "area_by_category", "ok": False})
    lines = [json.loads(line) for line in path.read_text().splitlines()]
    assert [line["tool"] for line in lines] == ["count_in_area", "area_by_category"]
    assert all(line["ts"].endswith("+00:00") for line in lines)


def test_an_unwritable_call_log_does_not_raise(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:

    blocked = tmp_path / "file"
    blocked.write_text("")
    # A file where the log's directory should be: mkdir fails with an OSError.
    CallLog(blocked / "calls.jsonl").write({"tool": "x"})
    assert "call log not written" in capsys.readouterr().err
