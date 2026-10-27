import os
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

DEFAULT_PORT = 8770


@dataclass(frozen=True)
class DocsSettings:
    database_url: str
    qdrant_url: str
    public_url: str = f"http://127.0.0.1:{DEFAULT_PORT}"
    data_dir: Path = Path("var/documents")
    port: int = DEFAULT_PORT

    @property
    def uploads_dir(self) -> Path:
        return self.data_dir / "uploads"

    @property
    def figures_dir(self) -> Path:
        return self.data_dir / "figures"

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "DocsSettings | None":
        """None when document search is not configured: the tools then stay off."""
        env = os.environ if env is None else env
        database_url = env.get("DOCS_DATABASE_URL", "").strip()
        qdrant_url = env.get("DOCS_QDRANT_URL", "").strip()
        if not database_url or not qdrant_url:
            return None
        port = int(env.get("DOCS_PORT", "") or DEFAULT_PORT)
        public_url = (
            env.get("DOCS_PUBLIC_URL", "").strip() or f"http://127.0.0.1:{port}"
        )
        return cls(
            database_url=database_url,
            qdrant_url=qdrant_url,
            public_url=public_url.rstrip("/"),
            data_dir=Path(env.get("DOCS_DATA_DIR", "") or "var/documents"),
            port=port,
        )
