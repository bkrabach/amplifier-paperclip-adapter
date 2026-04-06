"""Tests for CLI argument parsing in main.py."""

import pytest

from amplifier_paperclip_bridge.main import parse_args


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
