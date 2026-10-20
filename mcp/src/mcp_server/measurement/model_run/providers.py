"""LangChain chat models per provider, and the schema preflight before a run."""

from __future__ import annotations

import os
from typing import Any, cast

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI

from mcp_server.measurement.model_run.config import ModelSpec, Provider
from mcp_server.measurement.model_run.loop import ChatTurn

API_KEY_VARS: dict[Provider, str] = {
    "anthropic": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
    "deepseek": "DEEPSEEK_API_KEY",
}
CACHING: dict[str, str] = {
    "anthropic": "cache_control ephemeral on the system message and the last message",
    "openai": "automatic prefix caching by the provider",
    "deepseek": "automatic context caching by the provider",
}
EPHEMERAL = {"type": "ephemeral"}
PREFLIGHT_MESSAGE = "Responde solo: ok"
PREFLIGHT_MAX_TOKENS = 16


class PreflightError(Exception):
    pass


def _chat_class(provider: Provider) -> Any:
    # Looked up at call time so tests can replace a class on this module.
    return {
        "anthropic": ChatAnthropic,
        "openai": ChatOpenAI,
        "deepseek": ChatDeepSeek,
    }[provider]


def _cached(message: BaseMessage) -> BaseMessage:
    content = message.content
    if isinstance(content, str):
        if not content:
            return message  # Anthropic rejects an empty text block
        blocks: list = [{"type": "text", "text": content}]
    else:
        blocks = [
            {"type": "text", "text": b} if isinstance(b, str) else dict(b)
            for b in content
        ]
    if not blocks:
        return message
    blocks[-1] = {**blocks[-1], "cache_control": EPHEMERAL}
    return message.model_copy(update={"content": blocks})


def _with_cache_marks(messages: list[BaseMessage]) -> list[BaseMessage]:
    marked = list(messages)
    if marked and marked[0].type == "system":
        marked[0] = _cached(marked[0])
    if marked:
        marked[-1] = _cached(marked[-1])
    return marked


def make_chat(
    spec: ModelSpec, tools: list[dict], *, max_tokens: int | None = None
) -> ChatTurn:
    var = API_KEY_VARS[spec.provider]
    api_key = os.environ.get(var)
    if not api_key:
        raise ValueError(f"{var} is not set")
    options: dict[str, Any] = {"model": spec.model, "api_key": api_key}
    if max_tokens is not None:
        options["max_tokens"] = max_tokens
    chat_model = _chat_class(spec.provider)(**options)
    bound = chat_model.bind_tools(tools, strict=False) if tools else chat_model
    anthropic = spec.provider == "anthropic"

    async def chat(messages: list[BaseMessage]) -> AIMessage:
        sent = _with_cache_marks(messages) if anthropic else messages
        return cast(AIMessage, await bound.ainvoke(sent))

    return chat


async def preflight(spec: ModelSpec, tools: list[dict]) -> None:
    try:
        chat = make_chat(spec, tools, max_tokens=PREFLIGHT_MAX_TOKENS)
        await chat([HumanMessage(PREFLIGHT_MESSAGE)])
    except Exception as exc:
        raise PreflightError(
            f"{spec.label} ({spec.provider}): {type(exc).__name__}: {exc}"
        ) from exc
