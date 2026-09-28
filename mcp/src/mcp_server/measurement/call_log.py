import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


class CallLog:
    def __init__(self, path: Path) -> None:
        self._path = path

    def write(self, record: dict[str, Any]) -> None:
        line = {"ts": datetime.now(UTC).isoformat(), **record}
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with self._path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(line, ensure_ascii=False) + "\n")
        except OSError as exc:
            # The log is for measurement; it must never replace a tool's answer.
            # stderr, because stdout is the MCP channel on stdio.
            print(f"call log not written to {self._path}: {exc}", file=sys.stderr)
