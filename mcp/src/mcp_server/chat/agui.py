"""The AG-UI side of the chat: the request a client sends, and the events sent back.

Only the parts of AG-UI the chat uses. Field names are AG-UI's, in camelCase.
"""

import json
from dataclasses import dataclass
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage

LOCALES = {"en": "English", "es": "Spanish", "pt": "Portuguese"}
DEFAULT_LOCALE = "en"


class BadRequestError(Exception):
    pass


@dataclass(frozen=True)
class RunInput:
    thread_id: str
    run_id: str
    history: list[BaseMessage]
    locale: str


def parse_run_input(body: Any) -> RunInput:
    if not isinstance(body, dict):
        raise BadRequestError(
            "The body must be a JSON object (an AG-UI RunAgentInput)."
        )
    thread_id, run_id = body.get("threadId"), body.get("runId")
    if not isinstance(thread_id, str) or not thread_id:
        raise BadRequestError("threadId is required.")
    if not isinstance(run_id, str) or not run_id:
        raise BadRequestError("runId is required.")
    messages = body.get("messages")
    if not isinstance(messages, list):
        raise BadRequestError("messages must be a list.")
    history = to_langchain(messages)
    if not history or not isinstance(history[-1], HumanMessage):
        raise BadRequestError("The last message must be a user message.")
    props = body.get("forwardedProps")
    locale = props.get("locale") if isinstance(props, dict) else None
    if locale is not None and locale not in LOCALES:
        raise BadRequestError(f"locale must be one of {sorted(LOCALES)}.")
    return RunInput(thread_id, run_id, history, locale or DEFAULT_LOCALE)


def _text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        )
    return ""


def _tool_calls(message: dict) -> list[dict]:
    calls = []
    for call in message.get("toolCalls") or []:
        function = call.get("function") or {}
        try:
            args = json.loads(function.get("arguments") or "{}")
        except json.JSONDecodeError as exc:
            raise BadRequestError(
                f"Tool call {call.get('id')} has bad arguments."
            ) from exc
        calls.append({"id": call.get("id"), "name": function.get("name"), "args": args})
    return calls


def to_langchain(messages: list[Any]) -> list[BaseMessage]:
    """The client's history as LangChain messages. System and developer messages are
    dropped: the system prompt is the server's alone. A tool call with no result, or
    a result with no call, is dropped too, since every provider rejects either."""
    if not all(isinstance(m, dict) for m in messages):
        raise BadRequestError("Every message must be an object.")
    results = {
        m.get("toolCallId"): m
        for m in messages
        if m.get("role") == "tool" and m.get("toolCallId")
    }
    out: list[BaseMessage] = []
    for message in messages:
        role = message.get("role")
        if role == "user":
            out.append(HumanMessage(_text(message.get("content"))))
        elif role == "assistant":
            calls = [c for c in _tool_calls(message) if c["id"] in results]
            text = _text(message.get("content"))
            if text or calls:
                out.append(AIMessage(content=text, tool_calls=calls))
                out.extend(
                    ToolMessage(
                        content=_text(results[c["id"]].get("content")),
                        tool_call_id=c["id"],
                    )
                    for c in calls
                )
    return out


def frame(event: dict[str, Any]) -> str:
    """One SSE frame per event."""
    return f"data: {json.dumps(event, ensure_ascii=False, separators=(',', ':'))}\n\n"


def run_started(thread_id: str, run_id: str) -> dict[str, Any]:
    return {"type": "RUN_STARTED", "threadId": thread_id, "runId": run_id}


def run_finished(thread_id: str, run_id: str) -> dict[str, Any]:
    # Every tool runs here, inside the run, so the client must not continue it.
    return {
        "type": "RUN_FINISHED",
        "threadId": thread_id,
        "runId": run_id,
        "metadata": {"tanstack": {"finishReason": "stop"}},
    }


def run_error(code: str, message: str) -> dict[str, Any]:
    return {"type": "RUN_ERROR", "code": code, "message": message}


def text_message(message_id: str, text: str) -> list[dict[str, Any]]:
    return [
        {"type": "TEXT_MESSAGE_START", "messageId": message_id, "role": "assistant"},
        {"type": "TEXT_MESSAGE_CONTENT", "messageId": message_id, "delta": text},
        {"type": "TEXT_MESSAGE_END", "messageId": message_id},
    ]


def tool_call(
    call_id: str, name: str, args: dict[str, Any], parent_id: str
) -> list[dict[str, Any]]:
    return [
        {
            "type": "TOOL_CALL_START",
            "toolCallId": call_id,
            "toolCallName": name,
            "parentMessageId": parent_id,
        },
        {
            "type": "TOOL_CALL_ARGS",
            "toolCallId": call_id,
            "delta": json.dumps(args, ensure_ascii=False),
        },
        {"type": "TOOL_CALL_END", "toolCallId": call_id},
    ]


def tool_result(
    message_id: str, call_id: str, content: str, *, failed: bool
) -> dict[str, Any]:
    event: dict[str, Any] = {
        "type": "TOOL_CALL_RESULT",
        "messageId": message_id,
        "toolCallId": call_id,
        "role": "tool",
        "content": content,
    }
    if failed:
        event["metadata"] = {"tanstack": {"state": "output-error"}}
    return event


def run_summary(summary: dict[str, Any]) -> dict[str, Any]:
    return {"type": "CUSTOM", "name": "amazonia360:run-summary", "value": summary}
