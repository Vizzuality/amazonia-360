import json
import sys
from contextvars import ContextVar
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# The chat's user and thread when its tools run in process, where there is no OAuth
# token and no MCP session header to read them from.
CHAT_CALLER: ContextVar[tuple[str, str] | None] = ContextVar(
    "chat_caller", default=None
)


class CallLog:
    def __init__(self, path: Path, context: dict[str, str] | None = None) -> None:
        self._path = path
        self._context = context or {}

    def write(self, record: dict[str, Any]) -> None:
        line = {
            "ts": datetime.now(UTC).isoformat(),
            **self._context,
            **record,
        }
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with self._path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(line, ensure_ascii=False) + "\n")
        except OSError as exc:
            # The log is for measurement; it must never replace a tool's answer.
            # stderr, because stdout is the MCP channel on stdio.
            print(f"call log not written to {self._path}: {exc}", file=sys.stderr)
