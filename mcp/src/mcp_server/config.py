import os
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit


@dataclass(frozen=True)
class Settings:
    call_log_path: Path
    arcgis_timeout_s: float

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            call_log_path=Path(os.environ.get("MCP_CALL_LOG", "var/calls.jsonl")),
            # Just above ArcGIS Online's own ~59 s cut, so its 504 arrives first.
            arcgis_timeout_s=float(os.environ.get("ARCGIS_TIMEOUT_S", "65")),
        )


DEFAULT_REDIRECT_URIS = (
    "https://claude.ai/api/mcp/auth_callback",
    "https://claude.com/api/mcp/auth_callback",
    "https://chatgpt.com/connector_platform_oauth_redirect",
    # Loopback entries match any port and path: Claude Desktop, Claude Code and the
    # Gemini CLI listen on a port of their choosing.
    "http://localhost",
    "http://127.0.0.1",
)
_LOCAL_HOSTS = {"localhost", "127.0.0.1"}


class ConfigError(Exception):
    pass


def _list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class HttpSettings:
    public_url: str
    database_url: str
    google_client_id: str
    google_client_secret: str
    allowed_emails: frozenset[str]
    allowed_redirect_uris: tuple[str, ...]
    port: int

    @property
    def public_host(self) -> str:
        return urlsplit(self.public_url).netloc

    @property
    def mount_path(self) -> str:
        return urlsplit(self.public_url).path

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "HttpSettings":
        env = os.environ if env is None else env
        emails = frozenset(e.lower() for e in _list(env.get("MCP_ALLOWED_EMAILS", "")))
        values = {
            "MCP_PUBLIC_URL": env.get("MCP_PUBLIC_URL", "").strip().rstrip("/"),
            "MCP_DATABASE_URL": env.get("MCP_DATABASE_URL", "").strip(),
            "MCP_GOOGLE_CLIENT_ID": env.get("MCP_GOOGLE_CLIENT_ID", "").strip(),
            "MCP_GOOGLE_CLIENT_SECRET": env.get("MCP_GOOGLE_CLIENT_SECRET", "").strip(),
        }
        missing = [name for name, value in values.items() if not value]
        if not emails:
            missing.append("MCP_ALLOWED_EMAILS")
        if missing:
            raise ConfigError(f"Missing settings for HTTP: {', '.join(missing)}")
        url = urlsplit(values["MCP_PUBLIC_URL"])
        local = url.scheme == "http" and url.hostname in _LOCAL_HOSTS
        if not (url.scheme == "https" or local) or not url.path.strip("/"):
            raise ConfigError(
                "MCP_PUBLIC_URL must be https (plain http only on localhost) "
                "and end in the path the MCP is mounted at, such as https://host/mcp"
            )
        redirects = _list(env.get("MCP_ALLOWED_REDIRECT_URIS", ""))
        return cls(
            public_url=values["MCP_PUBLIC_URL"],
            database_url=values["MCP_DATABASE_URL"],
            google_client_id=values["MCP_GOOGLE_CLIENT_ID"],
            google_client_secret=values["MCP_GOOGLE_CLIENT_SECRET"],
            allowed_emails=emails,
            allowed_redirect_uris=tuple(redirects) or DEFAULT_REDIRECT_URIS,
            port=int(env.get("MCP_PORT", "8000")),
        )
