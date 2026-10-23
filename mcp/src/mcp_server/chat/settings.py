"""Settings of the chat API, read from MCP_CHAT_* variables."""

import os
import sys
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

from mcp_server.config import ConfigError

MIN_DEV_TOKEN_LENGTH = 32
DEFAULT_MODEL = "sonnet"
LOCAL_ORIGINS = r"http://(localhost|127\.0\.0\.1)(:\d+)?"


@dataclass(frozen=True)
class ChatSettings:
    model: str
    # token -> developer name
    dev_tokens: Mapping[str, str]
    jwks_url: str | None
    jwt_issuer: str | None
    allowed_origins: tuple[str, ...]
    max_turns: int
    max_seconds: float
    run_log_path: Path

    @property
    def has_auth(self) -> bool:
        return bool(self.dev_tokens) or self.jwks_url is not None

    @property
    def local_origins(self) -> str | None:
        # Front-end developers run on localhost while they use development tokens.
        return LOCAL_ORIGINS if self.dev_tokens else None

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "ChatSettings":
        env = os.environ if env is None else env
        jwks_url = env.get("MCP_CHAT_JWKS_URL", "").strip() or None
        issuer = env.get("MCP_CHAT_JWT_ISSUER", "").strip() or None
        if jwks_url and not issuer:
            raise ConfigError("MCP_CHAT_JWKS_URL needs MCP_CHAT_JWT_ISSUER")
        dev_tokens = _dev_tokens(env.get("MCP_CHAT_DEV_TOKENS", ""))
        if dev_tokens:
            print(
                f"Chat: {len(dev_tokens)} development token(s) active. Remove "
                "MCP_CHAT_DEV_TOKENS once the front end issues its JWT.",
                file=sys.stderr,
            )
        origins = tuple(
            o.strip().rstrip("/")
            for o in env.get("MCP_CHAT_ALLOWED_ORIGINS", "").split(",")
            if o.strip()
        )
        return cls(
            model=env.get("MCP_CHAT_MODEL", "").strip() or DEFAULT_MODEL,
            dev_tokens=dev_tokens,
            jwks_url=jwks_url,
            jwt_issuer=issuer,
            allowed_origins=origins,
            max_turns=int(env.get("MCP_CHAT_MAX_TURNS", "60")),
            max_seconds=float(env.get("MCP_CHAT_MAX_SECONDS", "300")),
            run_log_path=Path(env.get("MCP_CHAT_RUN_LOG", "var/chat-runs.jsonl")),
        )


def _dev_tokens(raw: str) -> dict[str, str]:
    tokens: dict[str, str] = {}
    for item in (i.strip() for i in raw.split(",")):
        if not item:
            continue
        name, sep, token = item.partition(":")
        name, token = name.strip(), token.strip()
        if not sep or not name or not token:
            raise ConfigError("MCP_CHAT_DEV_TOKENS takes name:token pairs")
        if len(token) < MIN_DEV_TOKEN_LENGTH:
            raise ConfigError(
                f"The development token of {name} is shorter than "
                f"{MIN_DEV_TOKEN_LENGTH} characters"
            )
        if token in tokens:
            raise ConfigError("Two developers share a development token")
        tokens[token] = name
    return tokens
