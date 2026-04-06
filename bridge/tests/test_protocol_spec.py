"""Tests that verify the JSONL protocol specification document exists and is complete.

These tests validate the structure and content of protocol.md according to the spec
for JSONL Protocol v1.0.
"""

from pathlib import Path

import pytest

PROTOCOL_MD = Path(__file__).parent.parent.parent / "protocol.md"


@pytest.fixture(scope="module")
def protocol_content() -> str:
    """Load the protocol.md content."""
    assert PROTOCOL_MD.exists(), f"protocol.md not found at {PROTOCOL_MD}"
    return PROTOCOL_MD.read_text(encoding="utf-8")


class TestProtocolDocumentExists:
    def test_protocol_md_exists(self) -> None:
        """protocol.md must exist at the repo root."""
        assert PROTOCOL_MD.exists(), f"protocol.md must exist at {PROTOCOL_MD}"

    def test_protocol_md_is_not_empty(self, protocol_content: str) -> None:
        """protocol.md must not be empty."""
        assert len(protocol_content.strip()) > 0


class TestProtocolTitle:
    def test_has_title_with_version(self, protocol_content: str) -> None:
        """Document must include title indicating JSONL Protocol and version 1.0."""
        lower = protocol_content.lower()
        assert "jsonl protocol" in lower, "Title must mention 'JSONL Protocol'"
        assert "1.0" in protocol_content, "Title must include version 1.0"


class TestTransportSection:
    def test_has_transport_section(self, protocol_content: str) -> None:
        """Document must have a Transport section."""
        assert "transport" in protocol_content.lower(), "Must have a Transport section"

    def test_transport_mentions_stdout(self, protocol_content: str) -> None:
        """Transport section must mention stdout."""
        assert "stdout" in protocol_content.lower()

    def test_transport_mentions_stderr(self, protocol_content: str) -> None:
        """Logs go to stderr only."""
        assert "stderr" in protocol_content.lower()

    def test_transport_mentions_newline_delimited(self, protocol_content: str) -> None:
        """Transport must specify newline-delimited JSON."""
        lower = protocol_content.lower()
        assert (
            "newline" in lower
            or "newline-delimited" in lower
            or "\\n" in protocol_content
        )

    def test_transport_mentions_utf8(self, protocol_content: str) -> None:
        """Transport must specify UTF-8 encoding."""
        lower = protocol_content.lower()
        assert "utf-8" in lower or "utf8" in lower


class TestEventTypesSection:
    def test_has_event_types_section(self, protocol_content: str) -> None:
        """Document must have an Event Types section."""
        lower = protocol_content.lower()
        assert "event type" in lower or "event types" in lower

    def test_has_init_event(self, protocol_content: str) -> None:
        """`init` event type must be documented."""
        assert "init" in protocol_content

    def test_has_content_delta_event(self, protocol_content: str) -> None:
        """`content_delta` event type must be documented."""
        assert "content_delta" in protocol_content

    def test_has_tool_start_event(self, protocol_content: str) -> None:
        """`tool_start` event type must be documented."""
        assert "tool_start" in protocol_content

    def test_has_tool_end_event(self, protocol_content: str) -> None:
        """`tool_end` event type must be documented."""
        assert "tool_end" in protocol_content

    def test_has_result_event(self, protocol_content: str) -> None:
        """`result` event type must be documented."""
        assert "result" in protocol_content

    def test_has_error_event(self, protocol_content: str) -> None:
        """`error` event type must be documented."""
        assert "error" in protocol_content


class TestInitEventFields:
    def test_init_has_session_id_field(self, protocol_content: str) -> None:
        """init event must document session_id field."""
        assert "session_id" in protocol_content

    def test_init_has_model_field(self, protocol_content: str) -> None:
        """init event must document model field."""
        assert "model" in protocol_content

    def test_init_has_bundle_field(self, protocol_content: str) -> None:
        """init event must document bundle field."""
        assert "bundle" in protocol_content

    def test_init_mentions_bundle_default(self, protocol_content: str) -> None:
        """init model field must mention 'bundle-default' value."""
        assert "bundle-default" in protocol_content

    def test_init_mentions_uuid(self, protocol_content: str) -> None:
        """init session_id must be described as UUID."""
        lower = protocol_content.lower()
        assert "uuid" in lower

    def test_init_mentions_uri(self, protocol_content: str) -> None:
        """init bundle must be described as URI."""
        assert "URI" in protocol_content or "uri" in protocol_content.lower()


class TestContentDeltaFields:
    def test_content_delta_has_text_field(self, protocol_content: str) -> None:
        """content_delta event must document text field."""
        assert "text" in protocol_content

    def test_content_delta_mentions_streaming(self, protocol_content: str) -> None:
        """content_delta must be described as streaming/optional."""
        lower = protocol_content.lower()
        assert "streaming" in lower or "stream" in lower or "optional" in lower


class TestToolStartFields:
    def test_tool_start_has_tool_field(self, protocol_content: str) -> None:
        """tool_start must document tool field."""
        # 'tool' appears multiple times, just check it's there
        assert "tool" in protocol_content

    def test_tool_start_has_input_field(self, protocol_content: str) -> None:
        """tool_start must document input field."""
        assert "input" in protocol_content

    def test_tool_start_mentions_truncated(self, protocol_content: str) -> None:
        """tool_start input field must mention it may be truncated."""
        assert "truncat" in protocol_content.lower()

    def test_tool_start_mentions_observability(self, protocol_content: str) -> None:
        """tool_start must be described as observability event."""
        assert "observability" in protocol_content.lower()


class TestToolEndFields:
    def test_tool_end_has_output_field(self, protocol_content: str) -> None:
        """tool_end must document output field."""
        assert "output" in protocol_content

    def test_tool_end_mentions_2000_chars(self, protocol_content: str) -> None:
        """tool_end output must mention 2000 char truncation."""
        assert "2000" in protocol_content


class TestResultEventFields:
    def test_result_has_session_id(self, protocol_content: str) -> None:
        """result event must document session_id."""
        assert "session_id" in protocol_content

    def test_result_has_response_field(self, protocol_content: str) -> None:
        """result event must document response field."""
        assert "response" in protocol_content

    def test_result_has_usage_field(self, protocol_content: str) -> None:
        """result event must document usage field."""
        assert "usage" in protocol_content

    def test_result_usage_mentions_input_tokens(self, protocol_content: str) -> None:
        """result usage must mention input_tokens."""
        assert "input_tokens" in protocol_content

    def test_result_usage_mentions_output_tokens(self, protocol_content: str) -> None:
        """result usage must mention output_tokens."""
        assert "output_tokens" in protocol_content

    def test_result_has_cost_usd_field(self, protocol_content: str) -> None:
        """result event must document cost_usd field."""
        assert "cost_usd" in protocol_content

    def test_result_has_status_field(self, protocol_content: str) -> None:
        """result event must document status field always 'completed'."""
        assert "status" in protocol_content
        assert "completed" in protocol_content

    def test_result_is_terminal(self, protocol_content: str) -> None:
        """result must be described as terminal event."""
        assert "terminal" in protocol_content.lower()


class TestErrorEventFields:
    def test_error_has_message_field(self, protocol_content: str) -> None:
        """error event must document message field."""
        assert "message" in protocol_content

    def test_error_has_code_field(self, protocol_content: str) -> None:
        """error event must document code field."""
        assert "code" in protocol_content

    def test_error_is_terminal(self, protocol_content: str) -> None:
        """error must be described as terminal event."""
        assert "terminal" in protocol_content.lower()


class TestErrorCodes:
    def test_has_timeout_code(self, protocol_content: str) -> None:
        """Error codes must include TIMEOUT."""
        assert "TIMEOUT" in protocol_content

    def test_has_bundle_not_found_code(self, protocol_content: str) -> None:
        """Error codes must include BUNDLE_NOT_FOUND."""
        assert "BUNDLE_NOT_FOUND" in protocol_content

    def test_has_prepare_failed_code(self, protocol_content: str) -> None:
        """Error codes must include PREPARE_FAILED."""
        assert "PREPARE_FAILED" in protocol_content

    def test_has_session_error_code(self, protocol_content: str) -> None:
        """Error codes must include SESSION_ERROR."""
        assert "SESSION_ERROR" in protocol_content

    def test_has_unknown_code(self, protocol_content: str) -> None:
        """Error codes must include UNKNOWN."""
        assert "UNKNOWN" in protocol_content


class TestInvariantsSection:
    def test_has_invariants_section(self, protocol_content: str) -> None:
        """Document must have an Invariants section."""
        assert "invariant" in protocol_content.lower()

    def test_invariant_init_is_first(self, protocol_content: str) -> None:
        """Invariants must state init is first."""
        lower = protocol_content.lower()
        assert "first" in lower or "exactly one" in lower

    def test_invariant_exactly_one_terminal(self, protocol_content: str) -> None:
        """Invariants must state exactly one terminal event (result or error, not both)."""
        lower = protocol_content.lower()
        assert "exactly one" in lower or "never both" in lower or "not both" in lower

    def test_invariant_exit_codes(self, protocol_content: str) -> None:
        """Invariants must mention exit codes."""
        lower = protocol_content.lower()
        assert "exit" in lower

    def test_invariant_valid_json_per_line(self, protocol_content: str) -> None:
        """Invariants must state each line is valid JSON."""
        lower = protocol_content.lower()
        assert "valid json" in lower or "each line" in lower

    def test_invariant_adapter_requires_init_and_terminal(
        self, protocol_content: str
    ) -> None:
        """Invariants must note adapter only requires init and result/error."""
        lower = protocol_content.lower()
        assert "adapter" in lower and ("requires" in lower or "only" in lower)
