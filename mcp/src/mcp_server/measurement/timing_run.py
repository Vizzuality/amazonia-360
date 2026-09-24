"""``amazonia360-mcp-timing``: time every tool on fixed areas, round after round.

Measures how often ArcGIS takes far longer than usual on a query that is normally
fast. One round runs every available indicator through each tool it takes, on each
area in ``examples/areas.geojson``, one call at a time. ``summary`` reads the log back.
"""

import argparse
import asyncio
import json
import statistics
import time
from collections import defaultdict
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

import httpx

from mcp_server.arcgis.client import ArcGISClient
from mcp_server.catalogue import list_indicators
from mcp_server.catalogue.models import Operation
from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.result import Result
from mcp_server.measurement.call_log import CallLog

AREAS_FILE = Path(__file__).parents[3] / "examples" / "areas.geojson"
TIMING_LOG = Path("var/timing.jsonl")
SLOW_MS = (10_000, 60_000)

Tool = Callable[[int, dict[str, Any]], Awaitable[Result]]


def load_areas(path: Path = AREAS_FILE) -> dict[str, dict[str, Any]]:
    features = json.loads(path.read_text("utf-8"))["features"]
    return {f["properties"]["name"]: f["geometry"] for f in features}


def _tools(handlers: AreaHandlers) -> dict[Operation, tuple[str, Tool]]:
    return {
        "presence": ("categories_in_area", handlers.categories_in_area),
        "count": ("count_in_area", handlers.count_in_area),
        "area": ("area_by_category", handlers.area_by_category),
    }


async def run_round(
    handlers: AreaHandlers,
    areas: dict[str, dict[str, Any]],
    log: CallLog,
    round_no: int,
) -> None:
    tools = _tools(handlers)
    for indicator in list_indicators():
        if not (indicator.available and indicator.ai_answerable):
            continue
        for operation, (tool, call) in tools.items():
            if not indicator.allows(operation):
                continue
            for area_name, area in areas.items():
                record: dict[str, Any] = {
                    "round": round_no,
                    "area": area_name,
                    "indicator_id": indicator.id,
                    "tool": tool,
                }
                start = time.perf_counter()
                try:
                    result = await call(indicator.id, area)
                except Exception as exc:  # a failure is a measurement too
                    record |= {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
                else:
                    record |= {"ok": True, "timing": result.timing.model_dump()}
                record["elapsed_ms"] = round((time.perf_counter() - start) * 1000)
                log.write(record)


def summarise(path: Path = TIMING_LOG) -> list[dict[str, Any]]:
    by_key: dict[tuple[str, int], list[dict[str, Any]]] = defaultdict(list)
    for line in path.read_text("utf-8").splitlines():
        record = json.loads(line)
        by_key[(record["tool"], record["indicator_id"])].append(record)
    rows = []
    for (tool, indicator_id), records in sorted(by_key.items()):
        times = sorted(r["elapsed_ms"] for r in records)
        rows.append(
            {
                "tool": tool,
                "indicator_id": indicator_id,
                "calls": len(records),
                "errors": sum(not r["ok"] for r in records),
                "median_ms": round(statistics.median(times)),
                "max_ms": times[-1],
                **{f"over_{ms // 1000}s": sum(t > ms for t in times) for ms in SLOW_MS},
            }
        )
    return rows


async def _run(rounds: int, every_s: float, timeout_s: float, log_path: Path) -> None:
    areas = load_areas()
    log = CallLog(log_path)
    async with httpx.AsyncClient(timeout=timeout_s) as http:
        handlers = AreaHandlers(ArcGISClient(http))
        for round_no in range(1, rounds + 1):
            started = time.monotonic()
            await run_round(handlers, areas, log, round_no)
            print(f"round {round_no}/{rounds} done", flush=True)
            if round_no < rounds:
                await asyncio.sleep(max(every_s - (time.monotonic() - started), 0))


def main() -> None:
    parser = argparse.ArgumentParser(prog="amazonia360-mcp-timing")
    commands = parser.add_subparsers(dest="command", required=True)
    run = commands.add_parser("run", help="time every tool on the fixed areas")
    run.add_argument("--rounds", type=int, default=24)
    run.add_argument("--every", type=float, default=3600.0, help="seconds")
    run.add_argument("--timeout", type=float, default=120.0)
    run.add_argument("--log", type=Path, default=TIMING_LOG)
    summary = commands.add_parser("summary", help="summarise the timing log")
    summary.add_argument("--log", type=Path, default=TIMING_LOG)
    args = parser.parse_args()
    if args.command == "run":
        asyncio.run(_run(args.rounds, args.every, args.timeout, args.log))
    else:
        for row in summarise(args.log):
            print(json.dumps(row))


if __name__ == "__main__":
    main()
