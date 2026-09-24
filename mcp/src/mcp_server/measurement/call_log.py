import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


class CallLog:
    def __init__(self, path: Path) -> None:
        self._path = path

    def write(self, record: dict[str, Any]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        line = {"ts": datetime.now(UTC).isoformat(), **record}
        with self._path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
