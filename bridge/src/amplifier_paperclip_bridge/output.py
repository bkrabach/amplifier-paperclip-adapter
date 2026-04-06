"""JSONL event formatting helpers."""

import json
from typing import Any


def emit_init(*, session_id: str, model: str, bundle: str) -> str:
    """Return a JSON string for a session init event."""
    return json.dumps(
        {"type": "init", "session_id": session_id, "model": model, "bundle": bundle}
    )


def emit_content_delta(*, text: str) -> str:
    """Return a JSON string for a content delta event."""
    return json.dumps({"type": "content_delta", "text": text})


def emit_tool_start(*, tool: str, input_data: str) -> str:
    """Return a JSON string for a tool start event."""
    return json.dumps({"type": "tool_start", "tool": tool, "input": input_data})


def emit_tool_end(*, tool: str, output: str) -> str:
    """Return a JSON string for a tool end event."""
    return json.dumps({"type": "tool_end", "tool": tool, "output": output})


def emit_result(
    *,
    session_id: str,
    response: str,
    usage: dict[str, Any] | None,
    cost_usd: float | None,
) -> str:
    """Return a JSON string for a result event."""
    return json.dumps(
        {
            "type": "result",
            "session_id": session_id,
            "response": response,
            "usage": usage,
            "cost_usd": cost_usd,
            "status": "completed",
        }
    )


def emit_error(message: str, code: str = "UNKNOWN") -> str:
    """Return a JSON string for an error event."""
    return json.dumps({"type": "error", "message": message, "code": code})
