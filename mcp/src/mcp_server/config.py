import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    call_log_path: Path
    arcgis_timeout_s: float

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            call_log_path=Path(os.environ.get("MCP_CALL_LOG", "var/calls.jsonl")),
            arcgis_timeout_s=float(os.environ.get("ARCGIS_TIMEOUT_S", "60")),
        )
