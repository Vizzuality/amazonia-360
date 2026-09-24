import json
import time
from pathlib import Path

from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.stopwatch import Stopwatch


def test_laps_accumulate() -> None:
    watch = Stopwatch()
    with watch.lap("arcgis"):
        time.sleep(0.01)
    with watch.lap("arcgis"):
        time.sleep(0.01)
    assert watch.ms("arcgis") >= 20
    assert watch.ms("clip") == 0
    assert watch.total_ms() >= watch.ms("arcgis")


def test_a_lap_is_recorded_when_the_block_raises() -> None:
    watch = Stopwatch()
    try:
        with watch.lap("arcgis"):
            time.sleep(0.01)
            raise RuntimeError
    except RuntimeError:
        pass
    assert watch.ms("arcgis") >= 10


def test_call_log_appends_json_lines(tmp_path: Path) -> None:
    path = tmp_path / "nested" / "calls.jsonl"
    log = CallLog(path)
    log.write({"tool": "count_in_area", "ok": True})
    log.write({"tool": "area_by_category", "ok": False})
    lines = [json.loads(line) for line in path.read_text().splitlines()]
    assert [line["tool"] for line in lines] == ["count_in_area", "area_by_category"]
    assert all(line["ts"].endswith("+00:00") for line in lines)
