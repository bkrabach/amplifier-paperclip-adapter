"""Tests for CLI argument parsing in main.py."""

import asyncio
import json
from pathlib import Path
from unittest.mock import ANY, AsyncMock, MagicMock, patch

import pytest

from amplifier_paperclip_bridge.main import parse_args

# Default stub config returned by mock resolve_bundle_config
_STUB_CONFIG: dict = {}


class TestParseArgs:
    def test_defaults(self) -> None:
        """Verifies default bundle="amplifier-dev", cwd=None, timeout=300."""
        args = parse_args([])
        assert args.bundle == "amplifier-dev"
        assert args.cwd is None
        assert args.timeout == 300

    def test_custom_bundle(self) -> None:
        """--bundle my-bundle sets args.bundle."""
        args = parse_args(["--bundle", "my-bundle"])
        assert args.bundle == "my-bundle"

    def test_custom_cwd(self) -> None:
        """--cwd /workspace/project sets args.cwd."""
        args = parse_args(["--cwd", "/workspace/project"])
        assert args.cwd == "/workspace/project"

    def test_custom_timeout(self) -> None:
        """--timeout 600 sets args.timeout to int 600."""
        args = parse_args(["--timeout", "600"])
        assert args.timeout == 600
        assert isinstance(args.timeout, int)

    def test_all_args(self) -> None:
        """All three flags together with git+https bundle URL."""
        args = parse_args(
            [
                "--bundle",
                "git+https://github.com/example/my-bundle",
                "--cwd",
                "/home/user/project",
                "--timeout",
                "120",
            ]
        )
        assert args.bundle == "git+https://github.com/example/my-bundle"
        assert args.cwd == "/home/user/project"
        assert args.timeout == 120

    def test_version_flag(self) -> None:
        """--version raises SystemExit with code 0."""
        with pytest.raises(SystemExit) as exc_info:
            parse_args(["--version"])
        assert exc_info.value.code == 0


def _make_mock_session(
    session_id: str = "test-session-123", response: str = "ok"
) -> MagicMock:
    """Build a fully mocked async session with coordinator hooks."""
    mock_session = AsyncMock()
    mock_session.session_id = session_id
    mock_session.execute = AsyncMock(return_value=response)
    mock_session.coordinator = MagicMock()
    mock_session.coordinator.hooks = MagicMock()
    mock_session.coordinator.hooks.register = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    return mock_session


def _make_mock_prepared(mock_session: MagicMock) -> MagicMock:
    mock_prepared = AsyncMock()
    mock_prepared.create_session = AsyncMock(return_value=mock_session)
    return mock_prepared


class TestRunBridge:
    @pytest.mark.asyncio
    async def test_emits_init_and_result(self) -> None:
        """Verifies init event with session_id and result event with response are emitted."""
        from amplifier_paperclip_bridge.main import run_bridge

        session_id = "test-session-123"
        response_text = "Hello from Amplifier"

        mock_session = _make_mock_session(session_id=session_id, response=response_text)
        mock_prepared = _make_mock_prepared(mock_session)

        output_lines: list[str] = []

        with (
            patch(
                "amplifier_paperclip_bridge.main.resolve_bundle_config",
                AsyncMock(return_value=(_STUB_CONFIG, mock_prepared)),
            ),
            patch(
                "amplifier_paperclip_bridge.main._write_event",
                side_effect=output_lines.append,
            ),
        ):
            await run_bridge(
                bundle_uri="amplifier-dev",
                cwd=None,
                timeout=300,
                prompt="Hello",
            )

        assert len(output_lines) >= 2

        first = json.loads(output_lines[0])
        assert first["type"] == "init"
        assert first["session_id"] == session_id

        last = json.loads(output_lines[-1])
        assert last["type"] == "result"
        assert last["response"] == response_text

    @pytest.mark.asyncio
    async def test_calls_resolve_bundle_config_with_uri(self) -> None:
        """Verifies resolve_bundle_config called with the exact bundle URI string."""
        from amplifier_paperclip_bridge.main import run_bridge

        bundle_uri = "git+https://github.com/example/my-bundle"

        mock_session = _make_mock_session()
        mock_prepared = _make_mock_prepared(mock_session)

        mock_resolve = AsyncMock(return_value=(_STUB_CONFIG, mock_prepared))

        with (
            patch("amplifier_paperclip_bridge.main.resolve_bundle_config", mock_resolve),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            await run_bridge(
                bundle_uri=bundle_uri,
                cwd=None,
                timeout=300,
                prompt="Hello",
            )

        # resolve_bundle_config is called with (bundle_uri, app_settings_instance)
        mock_resolve.assert_called_once()
        call_args = mock_resolve.call_args
        assert call_args[0][0] == bundle_uri  # first positional arg is the URI

    @pytest.mark.asyncio
    async def test_passes_cwd_to_create_session(self) -> None:
        """Verifies create_session called with session_cwd=Path('/workspace/my-project')."""
        from amplifier_paperclip_bridge.main import run_bridge

        mock_session = _make_mock_session()
        mock_prepared = _make_mock_prepared(mock_session)

        with (
            patch(
                "amplifier_paperclip_bridge.main.resolve_bundle_config",
                AsyncMock(return_value=(_STUB_CONFIG, mock_prepared)),
            ),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            await run_bridge(
                bundle_uri="amplifier-dev",
                cwd="/workspace/my-project",
                timeout=300,
                prompt="Hello",
            )

        mock_prepared.create_session.assert_called_once_with(
            approval_system=ANY,
            session_cwd=Path("/workspace/my-project"),
        )


class TestRunBridgeErrors:
    @pytest.mark.asyncio
    async def test_bundle_not_found_emits_error(self) -> None:
        """Verifies FileNotFoundError propagates from run_bridge when bundle is not found."""
        from amplifier_paperclip_bridge.main import run_bridge

        with (
            patch(
                "amplifier_paperclip_bridge.main.resolve_bundle_config",
                AsyncMock(side_effect=FileNotFoundError("Bundle 'nope' not found")),
            ),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            with pytest.raises(FileNotFoundError, match="Bundle 'nope' not found"):
                await run_bridge(
                    bundle_uri="nope",
                    cwd=None,
                    timeout=300,
                    prompt="Hello",
                )

    @pytest.mark.asyncio
    async def test_timeout_raises(self) -> None:
        """Verifies asyncio.TimeoutError propagates when session execution exceeds timeout."""
        from amplifier_paperclip_bridge.main import run_bridge

        mock_session = _make_mock_session()

        async def slow_execute(*args: object, **kwargs: object) -> None:
            await asyncio.sleep(10)

        mock_session.execute = AsyncMock(side_effect=slow_execute)
        mock_prepared = _make_mock_prepared(mock_session)

        with (
            patch(
                "amplifier_paperclip_bridge.main.resolve_bundle_config",
                AsyncMock(return_value=(_STUB_CONFIG, mock_prepared)),
            ),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            with pytest.raises(asyncio.TimeoutError):
                await run_bridge(
                    bundle_uri="amplifier-dev",
                    cwd=None,
                    timeout=1,
                    prompt="Hello",
                )

    @pytest.mark.asyncio
    async def test_session_error_propagates(self) -> None:
        """Verifies RuntimeError from session.execute propagates from run_bridge."""
        from amplifier_paperclip_bridge.main import run_bridge

        mock_session = _make_mock_session()
        mock_session.execute = AsyncMock(
            side_effect=RuntimeError("orchestrator crashed")
        )
        mock_prepared = _make_mock_prepared(mock_session)

        with (
            patch(
                "amplifier_paperclip_bridge.main.resolve_bundle_config",
                AsyncMock(return_value=(_STUB_CONFIG, mock_prepared)),
            ),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            with pytest.raises(RuntimeError, match="orchestrator crashed"):
                await run_bridge(
                    bundle_uri="amplifier-dev",
                    cwd=None,
                    timeout=300,
                    prompt="Hello",
                )
