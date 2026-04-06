"""Tests for JSONL event formatting helpers in output.py."""

import json

import pytest

from amplifier_paperclip_bridge.output import (
    emit_content_delta,
    emit_error,
    emit_init,
    emit_result,
    emit_tool_end,
    emit_tool_start,
)


class TestEmitInit:
    def test_init_event_has_required_fields(self) -> None:
        result = emit_init(
            session_id="sess-123", model="claude-3-5-sonnet", bundle="my-bundle"
        )
        data = json.loads(result)
        assert data["type"] == "init"
        assert data["session_id"] == "sess-123"
        assert data["model"] == "claude-3-5-sonnet"
        assert data["bundle"] == "my-bundle"

    def test_init_event_is_valid_json(self) -> None:
        result = emit_init(session_id="s1", model="m1", bundle="b1")
        # Should not raise
        parsed = json.loads(result)
        assert isinstance(parsed, dict)


class TestEmitContentDelta:
    def test_content_delta_has_text(self) -> None:
        result = emit_content_delta(text="Hello, world!")
        data = json.loads(result)
        assert data["type"] == "content_delta"
        assert data["text"] == "Hello, world!"

    def test_content_delta_empty_text(self) -> None:
        result = emit_content_delta(text="")
        data = json.loads(result)
        assert data["type"] == "content_delta"
        assert data["text"] == ""


class TestEmitToolStart:
    def test_tool_start_has_fields(self) -> None:
        result = emit_tool_start(tool="bash", input='{"command": "ls"}')
        data = json.loads(result)
        assert data["type"] == "tool_start"
        assert data["tool"] == "bash"
        assert data["input"] == '{"command": "ls"}'


class TestEmitToolEnd:
    def test_tool_end_has_fields(self) -> None:
        result = emit_tool_end(tool="bash", output="file1.txt\nfile2.txt")
        data = json.loads(result)
        assert data["type"] == "tool_end"
        assert data["tool"] == "bash"
        assert data["output"] == "file1.txt\nfile2.txt"


class TestEmitResult:
    def test_result_has_all_fields(self) -> None:
        usage = {"input_tokens": 100, "output_tokens": 50}
        result = emit_result(
            session_id="sess-456",
            response="Done!",
            usage=usage,
            cost_usd=0.0025,
        )
        data = json.loads(result)
        assert data["type"] == "result"
        assert data["session_id"] == "sess-456"
        assert data["response"] == "Done!"
        assert data["usage"]["input_tokens"] == 100
        assert data["usage"]["output_tokens"] == 50
        assert data["cost_usd"] == pytest.approx(0.0025)
        assert data["status"] == "completed"

    def test_result_with_no_usage(self) -> None:
        result = emit_result(
            session_id="sess-789",
            response="No usage available",
            usage=None,
            cost_usd=None,
        )
        data = json.loads(result)
        assert data["type"] == "result"
        assert data["usage"] is None
        assert data["cost_usd"] is None
        assert data["status"] == "completed"


class TestEmitError:
    def test_error_has_message_and_code(self) -> None:
        result = emit_error("Something went wrong", code="SESSION_FAILED")
        data = json.loads(result)
        assert data["type"] == "error"
        assert data["message"] == "Something went wrong"
        assert data["code"] == "SESSION_FAILED"

    def test_error_default_code(self) -> None:
        result = emit_error("Generic error")
        data = json.loads(result)
        assert data["type"] == "error"
        assert data["message"] == "Generic error"
        assert data["code"] == "UNKNOWN"
