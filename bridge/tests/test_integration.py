"""Integration tests: run the actual bridge subprocess end-to-end."""

import json
import subprocess
import sys

import pytest

# Determine if the bridge CLI is available by running --version at import time.
_version_probe = subprocess.run(
    [sys.executable, "-m", "amplifier_paperclip_bridge.main", "--version"],
    capture_output=True,
    text=True,
    timeout=10,
)
BRIDGE_AVAILABLE = _version_probe.returncode == 0


@pytest.mark.skipif(not BRIDGE_AVAILABLE, reason="Bridge CLI not available")
class TestBridgeCLI:
    def test_version_flag(self) -> None:
        """Runs bridge with --version, verifies returncode=0 and name in stdout."""
        result = subprocess.run(
            [sys.executable, "-m", "amplifier_paperclip_bridge.main", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        assert result.returncode == 0
        assert "amplifier-paperclip-bridge" in result.stdout

    def test_no_stdin_exits_nonzero(self) -> None:
        """Runs bridge with empty input, verifies returncode=1 and error JSONL."""
        result = subprocess.run(
            [sys.executable, "-m", "amplifier_paperclip_bridge.main"],
            capture_output=True,
            text=True,
            timeout=10,
            input="",
        )
        assert result.returncode == 1
        # If stdout has JSONL output, parse it and verify it is an error event.
        if result.stdout.strip():
            last_line = result.stdout.strip().splitlines()[-1]
            event = json.loads(last_line)
            assert event["type"] == "error"

    def test_bad_bundle_exits_nonzero(self) -> None:
        """Runs bridge with a nonexistent bundle and input, verifies returncode=1 and error JSONL."""
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "amplifier_paperclip_bridge.main",
                "--bundle",
                "this-bundle-does-not-exist-xyz-123",
            ],
            capture_output=True,
            text=True,
            timeout=30,
            input="do something",
        )
        assert result.returncode == 1
        assert result.stdout.strip(), "Expected JSONL error output on stdout"
        last_line = result.stdout.strip().splitlines()[-1]
        event = json.loads(last_line)
        assert event["type"] == "error"

    def test_prompt_flag_bypasses_stdin(self) -> None:
        """--prompt flag passes the prompt without reading stdin.

        When --prompt is provided and stdin is empty, the bridge should NOT emit
        a 'No prompt provided' error -- it should proceed to run the bundle
        (which may fail for other reasons such as a bad bundle name, but the
        prompt-reading step must succeed).
        """
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "amplifier_paperclip_bridge.main",
                "--prompt",
                "say hello",
                "--bundle",
                "this-bundle-does-not-exist-xyz-123",
            ],
            capture_output=True,
            text=True,
            timeout=30,
            stdin=subprocess.DEVNULL,
        )
        assert result.returncode == 1
        assert result.stdout.strip(), "Expected JSONL error output on stdout"
        last_line = result.stdout.strip().splitlines()[-1]
        event = json.loads(last_line)
        assert event["type"] == "error"
        # The error must NOT be "No prompt provided" -- it should be a bundle error
        assert "prompt" not in event.get("message", "").lower()
