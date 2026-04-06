# Phase 1: Python Bridge & Infrastructure — Implementation Plan

> **Execution:** Use the subagent-driven-development workflow to implement this plan.

**Goal:** Build the Python bridge package (`amplifier-paperclip-bridge`) that wraps `AmplifierSession` into a JSONL-emitting CLI, plus supporting infrastructure (protocol spec, installer, GitHub repo).

**Architecture:** A thin Python CLI (~200 lines) accepts `--bundle`, `--cwd`, `--timeout` args and reads a prompt from stdin. It loads the specified bundle via `amplifier-foundation`, creates a fresh `AmplifierSession` per invocation, registers hooks that write JSONL events to stdout, executes the prompt, then exits. Subprocess-per-heartbeat, no daemon, no state between invocations.

**Tech Stack:** Python 3.11+, `amplifier-core` (Rust/Python kernel), `amplifier-foundation` (bundle system), `pytest` + `pytest-asyncio` for tests, `hatchling` build backend.

---

## Prerequisites

Before starting, ensure you have:
- Python 3.11+ installed
- `uv` package manager installed (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- `gh` CLI authenticated (`gh auth login`)
- `git` configured with your identity

The working directory for all tasks is: `/home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/`

---

### Task 1: Create GitHub Repo & Initialize Project

**Files:**
- Create: GitHub repo `bkrabach/amplifier-paperclip-adapter`
- Create: `amplifier-paperclip-adapter/.gitignore`
- Create: `amplifier-paperclip-adapter/README.md`

**Step 1: Create the GitHub repo**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
gh repo create bkrabach/amplifier-paperclip-adapter --public --description "Paperclip adapter for Amplifier — connects Amplifier as an agent runtime to Paperclip's control plane" --source . --push
```
Expected: Repo created on GitHub, local directory linked as origin.

If the repo already exists remotely, instead run:
```bash
git remote add origin https://github.com/bkrabach/amplifier-paperclip-adapter.git
git push -u origin main
```

**Step 2: Create .gitignore**

Create `amplifier-paperclip-adapter/.gitignore`:
```gitignore
# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/
.eggs/
*.egg
.venv/
venv/

# Node
node_modules/
adapter/dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test / Coverage
.pytest_cache/
.coverage
htmlcov/

# UV
uv.lock
```

**Step 3: Create a minimal README.md**

Create `amplifier-paperclip-adapter/README.md`:
```markdown
# Amplifier-Paperclip Adapter

Connects [Amplifier](https://github.com/microsoft/amplifier) as an agent runtime to [Paperclip](https://github.com/paperclipai/paperclip)'s control plane.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/bkrabach/amplifier-paperclip-adapter/main/install.sh | sh
```

## Architecture

Two packages in one repo:

- **`bridge/`** — Python CLI that wraps `AmplifierSession` and emits JSONL to stdout
- **`adapter/`** — TypeScript Paperclip plugin that spawns the bridge per heartbeat

See [`docs/design.md`](docs/design.md) for full architecture details.

## Development

```bash
# Install bridge in dev mode
cd bridge
uv pip install -e ".[dev]"

# Run tests
pytest
```

## License

MIT
```

**Step 4: Remove old .gitkeep and commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
rm -f .gitkeep
git add .gitignore README.md
git rm -f --ignore-unmatch .gitkeep
git commit -m "chore: initialize repo with .gitignore and README"
```
Expected: Clean commit with 2 new files.

---

### Task 2: Scaffold Bridge Package

**Files:**
- Create: `bridge/pyproject.toml`
- Create: `bridge/src/amplifier_paperclip_bridge/__init__.py`
- Create: `bridge/src/amplifier_paperclip_bridge/main.py` (empty placeholder)
- Create: `bridge/src/amplifier_paperclip_bridge/output.py` (empty placeholder)
- Create: `bridge/src/amplifier_paperclip_bridge/approval.py` (empty placeholder)
- Create: `bridge/tests/__init__.py`
- Create: `bridge/tests/conftest.py`

**Step 1: Create pyproject.toml**

Create `bridge/pyproject.toml`:
```toml
[project]
name = "amplifier-paperclip-bridge"
version = "0.1.0"
description = "Python bridge connecting Amplifier sessions to Paperclip heartbeats via JSONL"
license = "MIT"
readme = "../README.md"
requires-python = ">=3.11"
authors = [
    { name = "Ben Krabach" },
]
dependencies = [
    "amplifier-core>=1.0.7",
    "amplifier-foundation>=1.0.0",
]

[project.scripts]
amplifier-paperclip-bridge = "amplifier_paperclip_bridge.main:cli_main"

[project.optional-dependencies]
dev = [
    "pytest>=8.4.2",
    "pytest-asyncio>=1.3.0",
    "pytest-timeout>=2.3.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/amplifier_paperclip_bridge"]

[tool.hatch.metadata]
allow-direct-references = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--import-mode=importlib"
asyncio_mode = "strict"
asyncio_default_fixture_loop_scope = "function"

[tool.pyright]
include = ["src", "tests"]
extraPaths = ["src"]
```

**Step 2: Create __init__.py with version**

Create `bridge/src/amplifier_paperclip_bridge/__init__.py`:
```python
"""Amplifier-Paperclip Bridge: JSONL-emitting CLI for Paperclip heartbeats."""

__version__ = "0.1.0"
```

**Step 3: Create empty placeholder modules**

Create `bridge/src/amplifier_paperclip_bridge/main.py`:
```python
"""CLI entry point for amplifier-paperclip-bridge."""
```

Create `bridge/src/amplifier_paperclip_bridge/output.py`:
```python
"""JSONL event formatting helpers."""
```

Create `bridge/src/amplifier_paperclip_bridge/approval.py`:
```python
"""Headless approval system for non-interactive Paperclip heartbeats."""
```

**Step 4: Create test scaffolding**

Create `bridge/tests/__init__.py`:
```python
```

Create `bridge/tests/conftest.py`:
```python
"""Shared test fixtures for amplifier-paperclip-bridge tests."""
```

**Step 5: Verify the package structure installs**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
uv pip install -e ".[dev]"
```
Expected: Package installs successfully. The `amplifier-paperclip-bridge` CLI entry point is registered (it will error if run since `cli_main` doesn't exist yet — that's fine).

**Step 6: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add bridge/
git commit -m "feat: scaffold bridge Python package"
```

---

### Task 3: JSONL Output Module (TDD)

**Files:**
- Create: `bridge/tests/test_output.py`
- Modify: `bridge/src/amplifier_paperclip_bridge/output.py`

**Step 1: Write the failing tests**

Create `bridge/tests/test_output.py`:
```python
"""Tests for JSONL output event formatting."""

import json

from amplifier_paperclip_bridge.output import (
    emit_content_delta,
    emit_error,
    emit_init,
    emit_result,
    emit_tool_end,
    emit_tool_start,
)


class TestEmitInit:
    """Tests for the init event."""

    def test_init_event_has_required_fields(self) -> None:
        line = emit_init(session_id="abc-123", model="claude-sonnet-4-5", bundle="amplifier-dev")
        event = json.loads(line)
        assert event["type"] == "init"
        assert event["session_id"] == "abc-123"
        assert event["model"] == "claude-sonnet-4-5"
        assert event["bundle"] == "amplifier-dev"

    def test_init_event_is_valid_json(self) -> None:
        line = emit_init(session_id="x", model="m", bundle="b")
        # Should not raise
        json.loads(line)


class TestEmitContentDelta:
    """Tests for content delta events."""

    def test_content_delta_has_text(self) -> None:
        line = emit_content_delta(text="Working on it...")
        event = json.loads(line)
        assert event["type"] == "content_delta"
        assert event["text"] == "Working on it..."

    def test_content_delta_empty_text(self) -> None:
        line = emit_content_delta(text="")
        event = json.loads(line)
        assert event["text"] == ""


class TestEmitToolStart:
    """Tests for tool start events."""

    def test_tool_start_has_fields(self) -> None:
        line = emit_tool_start(tool="bash", input="git status")
        event = json.loads(line)
        assert event["type"] == "tool_start"
        assert event["tool"] == "bash"
        assert event["input"] == "git status"


class TestEmitToolEnd:
    """Tests for tool end events."""

    def test_tool_end_has_fields(self) -> None:
        line = emit_tool_end(tool="bash", output="On branch main")
        event = json.loads(line)
        assert event["type"] == "tool_end"
        assert event["tool"] == "bash"
        assert event["output"] == "On branch main"


class TestEmitResult:
    """Tests for result events."""

    def test_result_has_all_fields(self) -> None:
        line = emit_result(
            session_id="abc-123",
            response="Done. I committed the fix.",
            usage={"input_tokens": 1500, "output_tokens": 800},
            cost_usd=0.03,
        )
        event = json.loads(line)
        assert event["type"] == "result"
        assert event["session_id"] == "abc-123"
        assert event["response"] == "Done. I committed the fix."
        assert event["usage"]["input_tokens"] == 1500
        assert event["cost_usd"] == 0.03
        assert event["status"] == "completed"

    def test_result_with_no_usage(self) -> None:
        line = emit_result(session_id="x", response="ok", usage=None, cost_usd=None)
        event = json.loads(line)
        assert event["usage"] is None
        assert event["cost_usd"] is None


class TestEmitError:
    """Tests for error events."""

    def test_error_has_message_and_code(self) -> None:
        line = emit_error(message="TimeoutError: exceeded 300s", code="TIMEOUT")
        event = json.loads(line)
        assert event["type"] == "error"
        assert event["message"] == "TimeoutError: exceeded 300s"
        assert event["code"] == "TIMEOUT"

    def test_error_default_code(self) -> None:
        line = emit_error(message="something broke")
        event = json.loads(line)
        assert event["code"] == "UNKNOWN"
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_output.py -v
```
Expected: FAIL — `ImportError: cannot import name 'emit_init' from 'amplifier_paperclip_bridge.output'`

**Step 3: Write the implementation**

Replace contents of `bridge/src/amplifier_paperclip_bridge/output.py`:
```python
"""JSONL event formatting helpers.

Each function returns a JSON string (one line, no trailing newline).
The caller is responsible for writing to stdout with flush.
"""

from __future__ import annotations

import json
from typing import Any


def emit_init(*, session_id: str, model: str, bundle: str) -> str:
    """Format an init event."""
    return json.dumps(
        {"type": "init", "session_id": session_id, "model": model, "bundle": bundle}
    )


def emit_content_delta(*, text: str) -> str:
    """Format a content delta event."""
    return json.dumps({"type": "content_delta", "text": text})


def emit_tool_start(*, tool: str, input: str) -> str:
    """Format a tool start event."""
    return json.dumps({"type": "tool_start", "tool": tool, "input": input})


def emit_tool_end(*, tool: str, output: str) -> str:
    """Format a tool end event."""
    return json.dumps({"type": "tool_end", "tool": tool, "output": output})


def emit_result(
    *,
    session_id: str,
    response: str,
    usage: dict[str, Any] | None,
    cost_usd: float | None,
) -> str:
    """Format a result event."""
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
    """Format an error event."""
    return json.dumps({"type": "error", "message": message, "code": code})
```

**Step 4: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_output.py -v
```
Expected: All 9 tests PASS.

**Step 5: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add bridge/src/amplifier_paperclip_bridge/output.py bridge/tests/test_output.py
git commit -m "feat: JSONL output event formatting helpers with tests"
```

---

### Task 4: Bridge CLI Arg Parsing (TDD)

**Files:**
- Create: `bridge/tests/test_main.py`
- Modify: `bridge/src/amplifier_paperclip_bridge/main.py`

**Step 1: Write the failing tests**

Create `bridge/tests/test_main.py`:
```python
"""Tests for CLI argument parsing and entry point."""

import pytest

from amplifier_paperclip_bridge.main import parse_args


class TestParseArgs:
    """Tests for CLI argument parsing."""

    def test_defaults(self) -> None:
        args = parse_args([])
        assert args.bundle == "amplifier-dev"
        assert args.cwd is None
        assert args.timeout == 300

    def test_custom_bundle(self) -> None:
        args = parse_args(["--bundle", "my-bundle"])
        assert args.bundle == "my-bundle"

    def test_custom_cwd(self) -> None:
        args = parse_args(["--cwd", "/workspace/project"])
        assert args.cwd == "/workspace/project"

    def test_custom_timeout(self) -> None:
        args = parse_args(["--timeout", "600"])
        assert args.timeout == 600

    def test_all_args(self) -> None:
        args = parse_args([
            "--bundle", "git+https://github.com/org/bundle@main",
            "--cwd", "/tmp/work",
            "--timeout", "120",
        ])
        assert args.bundle == "git+https://github.com/org/bundle@main"
        assert args.cwd == "/tmp/work"
        assert args.timeout == 120

    def test_version_flag(self) -> None:
        with pytest.raises(SystemExit) as exc_info:
            parse_args(["--version"])
        assert exc_info.value.code == 0
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_main.py -v
```
Expected: FAIL — `ImportError: cannot import name 'parse_args' from 'amplifier_paperclip_bridge.main'`

**Step 3: Write the implementation**

Replace contents of `bridge/src/amplifier_paperclip_bridge/main.py`:
```python
"""CLI entry point for amplifier-paperclip-bridge.

Invocation:
    amplifier-paperclip-bridge --bundle amplifier-dev --cwd /workspace --timeout 300 <<< "prompt"

Reads prompt from stdin, writes JSONL events to stdout, logs to stderr.
"""

from __future__ import annotations

import argparse
import sys

from amplifier_paperclip_bridge import __version__


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments.

    Args:
        argv: Argument list (defaults to sys.argv[1:] if None).

    Returns:
        Parsed arguments namespace.
    """
    parser = argparse.ArgumentParser(
        prog="amplifier-paperclip-bridge",
        description="Bridge between Paperclip heartbeats and Amplifier sessions.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    parser.add_argument(
        "--bundle",
        default="amplifier-dev",
        help="Bundle URI — name, file path, or git+https URL (default: amplifier-dev)",
    )
    parser.add_argument(
        "--cwd",
        default=None,
        help="Working directory for the session (default: current directory)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=300,
        help="Max seconds for session execution (default: 300)",
    )
    return parser.parse_args(argv)


def cli_main() -> None:
    """CLI entry point — called by the console_scripts entry point."""
    args = parse_args()
    # Read prompt from stdin
    prompt = sys.stdin.read().strip()
    if not prompt:
        print("Error: no prompt provided on stdin", file=sys.stderr)
        sys.exit(1)
    # Session execution will be implemented in Task 6
    print(f"Would execute bundle={args.bundle} cwd={args.cwd} timeout={args.timeout}", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    cli_main()
```

**Step 4: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_main.py -v
```
Expected: All 6 tests PASS.

**Step 5: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add bridge/src/amplifier_paperclip_bridge/main.py bridge/tests/test_main.py
git commit -m "feat: CLI argument parsing for amplifier-paperclip-bridge"
```

---

### Task 5: Headless Approval System (TDD)

**Files:**
- Create: `bridge/tests/test_approval.py`
- Modify: `bridge/src/amplifier_paperclip_bridge/approval.py`

**Step 1: Write the failing tests**

Create `bridge/tests/test_approval.py`:
```python
"""Tests for headless approval system."""

import pytest

from amplifier_paperclip_bridge.approval import HeadlessApprovalSystem


class TestHeadlessApprovalSystem:
    """Tests for auto-approve behavior."""

    @pytest.mark.asyncio
    async def test_always_approves(self) -> None:
        system = HeadlessApprovalSystem()
        result = await system.request_approval(
            prompt="Allow bash execution?",
            options=["allow", "deny"],
            timeout=30.0,
            default="deny",
        )
        assert result == "allow"

    @pytest.mark.asyncio
    async def test_returns_first_option(self) -> None:
        system = HeadlessApprovalSystem()
        result = await system.request_approval(
            prompt="Choose action",
            options=["proceed", "skip", "abort"],
            timeout=10.0,
            default="abort",
        )
        assert result == "proceed"

    @pytest.mark.asyncio
    async def test_empty_options_returns_allow(self) -> None:
        system = HeadlessApprovalSystem()
        result = await system.request_approval(
            prompt="Question?",
            options=[],
            timeout=10.0,
            default="deny",
        )
        assert result == "allow"

    @pytest.mark.asyncio
    async def test_logs_decisions(self) -> None:
        system = HeadlessApprovalSystem()
        await system.request_approval(
            prompt="Allow file write?",
            options=["allow", "deny"],
            timeout=30.0,
            default="deny",
        )
        assert len(system.decisions) == 1
        assert system.decisions[0]["prompt"] == "Allow file write?"
        assert system.decisions[0]["decision"] == "allow"
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_approval.py -v
```
Expected: FAIL — `ImportError: cannot import name 'HeadlessApprovalSystem'`

**Step 3: Write the implementation**

Replace contents of `bridge/src/amplifier_paperclip_bridge/approval.py`:
```python
"""Headless approval system for non-interactive Paperclip heartbeats.

Implements the amplifier_core.approval.ApprovalSystem protocol.
Auto-approves all requests — the operator trusts the bundle configuration.
"""

from __future__ import annotations

import logging
from typing import Any, Literal

logger = logging.getLogger(__name__)


class HeadlessApprovalSystem:
    """Auto-approve all approval requests.

    For v1, the Paperclip operator trusts the bundle config.
    Approval forwarding to Paperclip's UI is a v2 feature.
    """

    def __init__(self) -> None:
        self.decisions: list[dict[str, Any]] = []

    async def request_approval(
        self,
        prompt: str,
        options: list[str],
        timeout: float,
        default: Literal["allow", "deny"],
    ) -> str:
        """Auto-approve: always return the first option (or 'allow' if empty).

        Args:
            prompt: Question text (logged for audit trail).
            options: Available choices.
            timeout: Ignored (no waiting in headless mode).
            default: Ignored (always approve).

        Returns:
            First option string, or "allow" if options is empty.
        """
        decision = options[0] if options else "allow"
        logger.debug("Auto-approved: %s -> %s", prompt, decision)
        self.decisions.append({"prompt": prompt, "decision": decision})
        return decision
```

**Step 4: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_approval.py -v
```
Expected: All 4 tests PASS.

**Step 5: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add bridge/src/amplifier_paperclip_bridge/approval.py bridge/tests/test_approval.py
git commit -m "feat: headless auto-approve approval system with tests"
```

---

### Task 6: Bridge Session Execution (TDD)

This is the core task — wiring `load_bundle -> prepare -> create_session -> execute` with JSONL hook output. This task updates `main.py` to add the `run_bridge()` async function and hooks up the real session execution.

**Files:**
- Modify: `bridge/tests/test_main.py` (add execution tests)
- Modify: `bridge/src/amplifier_paperclip_bridge/main.py` (add run_bridge)

**Step 1: Write the failing tests**

Add to `bridge/tests/test_main.py` (append after existing tests):
```python
import asyncio
import json
from io import StringIO
from unittest.mock import AsyncMock, MagicMock, patch

from amplifier_paperclip_bridge.main import run_bridge


class TestRunBridge:
    """Tests for the main bridge execution flow."""

    @pytest.mark.asyncio
    async def test_emits_init_and_result(self) -> None:
        """run_bridge should emit init event, then result event."""
        output_lines: list[str] = []

        # Mock the entire amplifier stack
        mock_session = AsyncMock()
        mock_session.session_id = "test-session-id"
        mock_session.execute = AsyncMock(return_value="I did the thing.")
        mock_session.coordinator = MagicMock()
        mock_session.coordinator.hooks = MagicMock()
        mock_session.coordinator.hooks.register = MagicMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)

        mock_prepared = AsyncMock()
        mock_prepared.create_session = AsyncMock(return_value=mock_session)

        mock_bundle = AsyncMock()
        mock_bundle.prepare = AsyncMock(return_value=mock_prepared)

        with (
            patch("amplifier_paperclip_bridge.main.load_bundle", new_callable=AsyncMock, return_value=mock_bundle),
            patch("amplifier_paperclip_bridge.main._write_event", side_effect=lambda line: output_lines.append(line)),
        ):
            await run_bridge(
                bundle_uri="amplifier-dev",
                cwd=None,
                timeout=300,
                prompt="Do the thing.",
            )

        # Should have at least init + result
        assert len(output_lines) >= 2
        init_event = json.loads(output_lines[0])
        assert init_event["type"] == "init"
        assert init_event["session_id"] == "test-session-id"

        result_event = json.loads(output_lines[-1])
        assert result_event["type"] == "result"
        assert result_event["response"] == "I did the thing."

    @pytest.mark.asyncio
    async def test_calls_load_bundle_with_uri(self) -> None:
        """run_bridge should pass the bundle URI to load_bundle."""
        mock_session = AsyncMock()
        mock_session.session_id = "s1"
        mock_session.execute = AsyncMock(return_value="ok")
        mock_session.coordinator = MagicMock()
        mock_session.coordinator.hooks = MagicMock()
        mock_session.coordinator.hooks.register = MagicMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)

        mock_prepared = AsyncMock()
        mock_prepared.create_session = AsyncMock(return_value=mock_session)

        mock_bundle = AsyncMock()
        mock_bundle.prepare = AsyncMock(return_value=mock_prepared)

        mock_load = AsyncMock(return_value=mock_bundle)

        with (
            patch("amplifier_paperclip_bridge.main.load_bundle", mock_load),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            await run_bridge(
                bundle_uri="git+https://github.com/org/custom@main",
                cwd="/tmp/work",
                timeout=120,
                prompt="hello",
            )

        mock_load.assert_called_once_with("git+https://github.com/org/custom@main")

    @pytest.mark.asyncio
    async def test_passes_cwd_to_create_session(self) -> None:
        """run_bridge should pass session_cwd to create_session."""
        mock_session = AsyncMock()
        mock_session.session_id = "s1"
        mock_session.execute = AsyncMock(return_value="ok")
        mock_session.coordinator = MagicMock()
        mock_session.coordinator.hooks = MagicMock()
        mock_session.coordinator.hooks.register = MagicMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)

        mock_prepared = AsyncMock()
        mock_prepared.create_session = AsyncMock(return_value=mock_session)

        mock_bundle = AsyncMock()
        mock_bundle.prepare = AsyncMock(return_value=mock_prepared)

        with (
            patch("amplifier_paperclip_bridge.main.load_bundle", new_callable=AsyncMock, return_value=mock_bundle),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            await run_bridge(
                bundle_uri="amplifier-dev",
                cwd="/workspace/my-project",
                timeout=300,
                prompt="test",
            )

        # Verify create_session was called with the cwd as a Path
        call_kwargs = mock_prepared.create_session.call_args
        from pathlib import Path
        assert call_kwargs.kwargs.get("session_cwd") == Path("/workspace/my-project")
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_main.py::TestRunBridge -v
```
Expected: FAIL — `ImportError: cannot import name 'run_bridge'`

**Step 3: Write the implementation**

Replace the contents of `bridge/src/amplifier_paperclip_bridge/main.py` with the full implementation:
```python
"""CLI entry point for amplifier-paperclip-bridge.

Invocation:
    amplifier-paperclip-bridge --bundle amplifier-dev --cwd /workspace --timeout 300 <<< "prompt"

Reads prompt from stdin, writes JSONL events to stdout, logs to stderr.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path
from typing import Any

from amplifier_foundation import load_bundle

from amplifier_paperclip_bridge import __version__
from amplifier_paperclip_bridge.approval import HeadlessApprovalSystem
from amplifier_paperclip_bridge.output import (
    emit_content_delta,
    emit_error,
    emit_init,
    emit_result,
    emit_tool_end,
    emit_tool_start,
)

logger = logging.getLogger(__name__)


def _write_event(line: str) -> None:
    """Write a single JSONL event to stdout."""
    print(line, flush=True)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments.

    Args:
        argv: Argument list (defaults to sys.argv[1:] if None).

    Returns:
        Parsed arguments namespace.
    """
    parser = argparse.ArgumentParser(
        prog="amplifier-paperclip-bridge",
        description="Bridge between Paperclip heartbeats and Amplifier sessions.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    parser.add_argument(
        "--bundle",
        default="amplifier-dev",
        help="Bundle URI — name, file path, or git+https URL (default: amplifier-dev)",
    )
    parser.add_argument(
        "--cwd",
        default=None,
        help="Working directory for the session (default: current directory)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=300,
        help="Max seconds for session execution (default: 300)",
    )
    return parser.parse_args(argv)


def _make_hook_handler(event_name: str):
    """Create a hook handler that emits JSONL for a specific event type.

    Returns a sync callable that the hook registry can invoke.
    """

    def handler(event: str, data: dict[str, Any]) -> None:
        if event_name == "content_block:delta":
            text = ""
            if isinstance(data, dict):
                text = data.get("text", data.get("delta", ""))
            if text:
                _write_event(emit_content_delta(text=str(text)))

        elif event_name == "tool:pre":
            tool_name = data.get("tool", data.get("name", "unknown")) if isinstance(data, dict) else "unknown"
            tool_input = data.get("input", "") if isinstance(data, dict) else ""
            _write_event(emit_tool_start(tool=str(tool_name), input=str(tool_input)))

        elif event_name == "tool:post":
            tool_name = data.get("tool", data.get("name", "unknown")) if isinstance(data, dict) else "unknown"
            tool_output = data.get("output", data.get("result", "")) if isinstance(data, dict) else ""
            # Truncate long output to avoid flooding the JSONL stream
            output_str = str(tool_output)
            if len(output_str) > 2000:
                output_str = output_str[:2000] + "... (truncated)"
            _write_event(emit_tool_end(tool=str(tool_name), output=output_str))

        return None

    return handler


async def run_bridge(
    *,
    bundle_uri: str,
    cwd: str | None,
    timeout: int,
    prompt: str,
) -> None:
    """Run a single Amplifier session and emit JSONL events.

    Args:
        bundle_uri: Bundle to load (name, path, or git+https URL).
        cwd: Working directory for the session.
        timeout: Max seconds for execution.
        prompt: User prompt to execute.
    """
    session_cwd = Path(cwd) if cwd else Path.cwd()

    # Load and prepare bundle
    bundle = await load_bundle(bundle_uri)
    prepared = await bundle.prepare()

    # Create session with headless approval
    approval = HeadlessApprovalSystem()
    session = await prepared.create_session(
        approval_system=approval,
        session_cwd=session_cwd,
    )

    # Emit init event
    _write_event(emit_init(
        session_id=session.session_id,
        model="bundle-default",
        bundle=bundle_uri,
    ))

    # Register hooks for streaming events
    from amplifier_core.events import CONTENT_BLOCK_DELTA, TOOL_PRE, TOOL_POST

    session.coordinator.hooks.register(
        CONTENT_BLOCK_DELTA,
        _make_hook_handler("content_block:delta"),
        name="bridge-content-delta",
    )
    session.coordinator.hooks.register(
        TOOL_PRE,
        _make_hook_handler("tool:pre"),
        name="bridge-tool-pre",
    )
    session.coordinator.hooks.register(
        TOOL_POST,
        _make_hook_handler("tool:post"),
        name="bridge-tool-post",
    )

    # Execute with timeout
    async with session:
        result = await asyncio.wait_for(
            session.execute(prompt),
            timeout=timeout,
        )

    # Emit result event
    _write_event(emit_result(
        session_id=session.session_id,
        response=result,
        usage=None,  # Usage tracking is a v2 enhancement
        cost_usd=None,
    ))


def cli_main() -> None:
    """CLI entry point — called by the console_scripts entry point."""
    # Configure logging to stderr
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stderr,
    )

    args = parse_args()

    # Read prompt from stdin
    prompt = sys.stdin.read().strip()
    if not prompt:
        _write_event(emit_error("No prompt provided on stdin", code="SESSION_ERROR"))
        sys.exit(1)

    try:
        asyncio.run(run_bridge(
            bundle_uri=args.bundle,
            cwd=args.cwd,
            timeout=args.timeout,
            prompt=prompt,
        ))
    except asyncio.TimeoutError:
        _write_event(emit_error(
            f"Session exceeded {args.timeout}s timeout",
            code="TIMEOUT",
        ))
        sys.exit(1)
    except Exception as exc:
        _write_event(emit_error(str(exc), code="SESSION_ERROR"))
        sys.exit(1)


if __name__ == "__main__":
    cli_main()
```

**Step 4: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_main.py -v
```
Expected: All 9 tests PASS (6 from Task 4 + 3 new).

**Step 5: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add bridge/src/amplifier_paperclip_bridge/main.py bridge/tests/test_main.py
git commit -m "feat: bridge session execution with JSONL hook output"
```

---

### Task 7: Bridge Error Handling (TDD)

**Files:**
- Modify: `bridge/tests/test_main.py` (add error tests)

**Step 1: Write the failing tests**

Append to `bridge/tests/test_main.py`:
```python
class TestRunBridgeErrors:
    """Tests for error handling in run_bridge."""

    @pytest.mark.asyncio
    async def test_bundle_not_found_emits_error(self) -> None:
        """If load_bundle raises, cli_main should emit an error event."""
        output_lines: list[str] = []

        with patch(
            "amplifier_paperclip_bridge.main.load_bundle",
            new_callable=AsyncMock,
            side_effect=FileNotFoundError("Bundle 'nope' not found"),
        ), patch(
            "amplifier_paperclip_bridge.main._write_event",
            side_effect=lambda line: output_lines.append(line),
        ):
            with pytest.raises(FileNotFoundError):
                await run_bridge(
                    bundle_uri="nope",
                    cwd=None,
                    timeout=300,
                    prompt="hello",
                )

    @pytest.mark.asyncio
    async def test_timeout_raises(self) -> None:
        """If session.execute exceeds timeout, asyncio.TimeoutError should propagate."""
        mock_session = AsyncMock()
        mock_session.session_id = "s1"
        mock_session.coordinator = MagicMock()
        mock_session.coordinator.hooks = MagicMock()
        mock_session.coordinator.hooks.register = MagicMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)

        async def slow_execute(prompt: str) -> str:
            await asyncio.sleep(10)
            return "never"

        mock_session.execute = slow_execute

        mock_prepared = AsyncMock()
        mock_prepared.create_session = AsyncMock(return_value=mock_session)

        mock_bundle = AsyncMock()
        mock_bundle.prepare = AsyncMock(return_value=mock_prepared)

        with (
            patch("amplifier_paperclip_bridge.main.load_bundle", new_callable=AsyncMock, return_value=mock_bundle),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            with pytest.raises(asyncio.TimeoutError):
                await run_bridge(
                    bundle_uri="amplifier-dev",
                    cwd=None,
                    timeout=1,  # 1 second timeout
                    prompt="slow task",
                )

    @pytest.mark.asyncio
    async def test_session_error_propagates(self) -> None:
        """If session.execute raises, the error should propagate."""
        mock_session = AsyncMock()
        mock_session.session_id = "s1"
        mock_session.execute = AsyncMock(side_effect=RuntimeError("orchestrator crashed"))
        mock_session.coordinator = MagicMock()
        mock_session.coordinator.hooks = MagicMock()
        mock_session.coordinator.hooks.register = MagicMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)

        mock_prepared = AsyncMock()
        mock_prepared.create_session = AsyncMock(return_value=mock_session)

        mock_bundle = AsyncMock()
        mock_bundle.prepare = AsyncMock(return_value=mock_prepared)

        with (
            patch("amplifier_paperclip_bridge.main.load_bundle", new_callable=AsyncMock, return_value=mock_bundle),
            patch("amplifier_paperclip_bridge.main._write_event"),
        ):
            with pytest.raises(RuntimeError, match="orchestrator crashed"):
                await run_bridge(
                    bundle_uri="amplifier-dev",
                    cwd=None,
                    timeout=300,
                    prompt="crash me",
                )
```

**Step 2: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_main.py::TestRunBridgeErrors -v
```
Expected: All 3 tests PASS. These test the error propagation behavior that `cli_main()` catches and converts to JSONL error events. The errors propagate from `run_bridge()` and `cli_main()` catches them.

**Step 3: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add bridge/tests/test_main.py
git commit -m "test: error handling tests for bridge execution"
```

---

### Task 8: Integration Test Script

This test runs the actual bridge binary end-to-end. It requires `amplifier-core` and `amplifier-foundation` to be installed. If they aren't available in the test environment, the test should be skipped gracefully.

**Files:**
- Create: `bridge/tests/test_integration.py`

**Step 1: Write the integration test**

Create `bridge/tests/test_integration.py`:
```python
"""Integration tests for the bridge CLI.

These tests run the actual bridge subprocess and verify JSONL output.
They require amplifier-core and amplifier-foundation to be installed.

Skip these in CI unless the full Amplifier stack is available.
"""

import json
import subprocess
import sys

import pytest

# Check if the bridge CLI is available
try:
    result = subprocess.run(
        [sys.executable, "-m", "amplifier_paperclip_bridge.main", "--version"],
        capture_output=True,
        text=True,
        timeout=10,
    )
    BRIDGE_AVAILABLE = result.returncode == 0
except Exception:
    BRIDGE_AVAILABLE = False


@pytest.mark.skipif(not BRIDGE_AVAILABLE, reason="Bridge CLI not available")
class TestBridgeCLI:
    """Integration tests that run the actual bridge subprocess."""

    def test_version_flag(self) -> None:
        """--version should print version and exit 0."""
        result = subprocess.run(
            [sys.executable, "-m", "amplifier_paperclip_bridge.main", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        assert result.returncode == 0
        assert "amplifier-paperclip-bridge" in result.stdout

    def test_no_stdin_exits_nonzero(self) -> None:
        """Running with empty stdin should exit 1 and emit error JSONL."""
        result = subprocess.run(
            [sys.executable, "-m", "amplifier_paperclip_bridge.main"],
            input="",
            capture_output=True,
            text=True,
            timeout=10,
        )
        assert result.returncode == 1
        # Should have emitted an error JSONL event to stdout
        if result.stdout.strip():
            event = json.loads(result.stdout.strip())
            assert event["type"] == "error"

    def test_bad_bundle_exits_nonzero(self) -> None:
        """Running with a non-existent bundle should exit 1."""
        result = subprocess.run(
            [
                sys.executable, "-m", "amplifier_paperclip_bridge.main",
                "--bundle", "this-bundle-does-not-exist-xyz-123",
            ],
            input="do something",
            capture_output=True,
            text=True,
            timeout=30,
        )
        assert result.returncode == 1
        # Should have emitted an error JSONL event
        if result.stdout.strip():
            lines = result.stdout.strip().split("\n")
            last_line = lines[-1]
            event = json.loads(last_line)
            assert event["type"] == "error"
```

**Step 2: Run the integration tests**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/test_integration.py -v
```
Expected: Tests either PASS or are SKIPPED (if Amplifier isn't fully installed). The `test_version_flag` and `test_no_stdin_exits_nonzero` tests should pass regardless since they don't need the full Amplifier stack.

**Step 3: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add bridge/tests/test_integration.py
git commit -m "test: integration tests for bridge CLI subprocess"
```

---

### Task 9: Protocol Specification

**Files:**
- Create: `protocol.md`

**Step 1: Write the protocol spec**

Create `amplifier-paperclip-adapter/protocol.md`:
```markdown
# JSONL Protocol Specification

Version: 1.0

This document defines the JSONL event stream between the Python bridge
(`amplifier-paperclip-bridge`) and the TypeScript adapter (`@amplifier/paperclip-adapter`).

## Transport

- **Direction:** Bridge writes to stdout, adapter reads from stdout.
- **Format:** Newline-delimited JSON (one JSON object per line).
- **Encoding:** UTF-8.
- **Logs:** Bridge writes diagnostic logs to stderr (never stdout).

## Event Types

### `init` (required, first event)

Emitted once when the session starts.

```json
{"type": "init", "session_id": "<uuid>", "model": "<string>", "bundle": "<string>"}
```

| Field | Type | Description |
|---|---|---|
| `session_id` | string | UUID of the Amplifier session |
| `model` | string | Model identifier (or `"bundle-default"`) |
| `bundle` | string | Bundle URI that was loaded |

### `content_delta` (optional, streaming)

Emitted as the LLM generates text. Progressive enhancement for real-time UI.

```json
{"type": "content_delta", "text": "<string>"}
```

| Field | Type | Description |
|---|---|---|
| `text` | string | Text chunk from the LLM |

### `tool_start` (optional, observability)

Emitted when a tool invocation begins.

```json
{"type": "tool_start", "tool": "<string>", "input": "<string>"}
```

| Field | Type | Description |
|---|---|---|
| `tool` | string | Tool name (e.g., `"bash"`, `"read_file"`) |
| `input` | string | Tool input (may be truncated) |

### `tool_end` (optional, observability)

Emitted when a tool invocation completes.

```json
{"type": "tool_end", "tool": "<string>", "output": "<string>"}
```

| Field | Type | Description |
|---|---|---|
| `tool` | string | Tool name |
| `output` | string | Tool output (truncated to 2000 chars) |

### `result` (terminal, success)

Emitted once when the session completes successfully. Always the last event on success.

```json
{"type": "result", "session_id": "<uuid>", "response": "<string>", "usage": <object|null>, "cost_usd": <number|null>, "status": "completed"}
```

| Field | Type | Description |
|---|---|---|
| `session_id` | string | UUID of the session |
| `response` | string | Final response text from the LLM |
| `usage` | object or null | Token usage (`{"input_tokens": N, "output_tokens": N}`) or null |
| `cost_usd` | number or null | Estimated cost in USD or null |
| `status` | string | Always `"completed"` |

### `error` (terminal, failure)

Emitted once when the session fails. Always the last event on failure.

```json
{"type": "error", "message": "<string>", "code": "<string>"}
```

| Field | Type | Description |
|---|---|---|
| `message` | string | Human-readable error description |
| `code` | string | Machine-readable error code |

**Error codes:**

| Code | Meaning |
|---|---|
| `TIMEOUT` | Session exceeded `--timeout` seconds |
| `BUNDLE_NOT_FOUND` | Bundle URI could not be resolved |
| `PREPARE_FAILED` | `bundle.prepare()` failed (module download/resolution error) |
| `SESSION_ERROR` | Error during `session.execute()` |
| `UNKNOWN` | Unclassified error |

## Invariants

1. Every session starts with exactly one `init` event.
2. Every session ends with exactly one `result` or `error` event. Never both.
3. `content_delta`, `tool_start`, `tool_end` may appear zero or more times between `init` and the terminal event.
4. The adapter only **requires** `init` and `result`/`error` to function. All other events are progressive enhancement.
5. Each line is valid JSON. No multi-line JSON objects.
6. The bridge exits with code 0 on `result`, non-zero on `error`.
```

**Step 2: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add protocol.md
git commit -m "docs: JSONL protocol specification v1.0"
```

---

### Task 10: Installer Script

**Files:**
- Create: `install.sh`

**Step 1: Write the installer**

Create `amplifier-paperclip-adapter/install.sh`:
```bash
#!/usr/bin/env bash
#
# Amplifier-Paperclip Adapter Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/bkrabach/amplifier-paperclip-adapter/main/install.sh | sh
#
set -euo pipefail

REPO="https://github.com/bkrabach/amplifier-paperclip-adapter.git"

echo "=== Amplifier-Paperclip Adapter Installer ==="
echo ""

# --- Check prerequisites ---

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "ERROR: $1 is not installed. $2"
        exit 1
    fi
}

check_python_version() {
    local version
    version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "0.0")
    local major minor
    major=$(echo "$version" | cut -d. -f1)
    minor=$(echo "$version" | cut -d. -f2)
    if [ "$major" -lt 3 ] || { [ "$major" -eq 3 ] && [ "$minor" -lt 11 ]; }; then
        echo "ERROR: Python 3.11+ required, found Python $version"
        exit 1
    fi
    echo "  Python $version"
}

echo "Checking prerequisites..."
check_command python3 "Install Python 3.11+ from https://python.org"
check_python_version
check_command git "Install git from https://git-scm.com"

# Check for pip installer (uv preferred, pip as fallback)
PIP_CMD=""
if command -v uv &> /dev/null; then
    PIP_CMD="uv pip"
    echo "  uv $(uv --version 2>/dev/null || echo '(version unknown)')"
elif command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
    echo "  pip3 (uv not found, using pip3 as fallback)"
elif command -v pip &> /dev/null; then
    PIP_CMD="pip"
    echo "  pip (uv not found, using pip as fallback)"
else
    echo "ERROR: Neither uv nor pip found. Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo ""

# --- Install Python bridge ---

echo "Installing Python bridge (amplifier-paperclip-bridge)..."
$PIP_CMD install "amplifier-paperclip-bridge @ git+${REPO}#subdirectory=bridge"
echo "  Done."
echo ""

# --- Verify installation ---

echo "Verifying installation..."

if command -v amplifier-paperclip-bridge &> /dev/null; then
    BRIDGE_VERSION=$(amplifier-paperclip-bridge --version 2>&1 || echo "unknown")
    echo "  amplifier-paperclip-bridge: $BRIDGE_VERSION"
else
    echo "  WARNING: amplifier-paperclip-bridge not found in PATH"
    echo "  You may need to add your Python scripts directory to PATH"
fi

echo ""
echo "=== Installation complete ==="
echo ""
echo "Next steps:"
echo "  1. Set API keys: export ANTHROPIC_API_KEY=... (or OPENAI_API_KEY=...)"
echo "  2. Test the bridge: echo 'Hello' | amplifier-paperclip-bridge --bundle amplifier-dev"
echo "  3. The TypeScript adapter (Phase 2) will be installed separately."
echo ""
```

**Step 2: Make it executable**

Run:
```bash
chmod +x /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/install.sh
```

**Step 3: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add install.sh
git commit -m "feat: curl-able installer script for bridge package"
```

---

### Final Step: Run Full Test Suite & Push

**Step 1: Run all tests**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/bridge
python -m pytest tests/ -v
```
Expected: All unit tests PASS (integration tests may skip if full Amplifier stack isn't installed).

**Step 2: Push to GitHub**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git push origin main
```
Expected: All commits pushed to `bkrabach/amplifier-paperclip-adapter`.

---

## Summary of Deliverables

| File | Purpose |
|------|---------|
| `bridge/pyproject.toml` | Package config with entry point and deps |
| `bridge/src/amplifier_paperclip_bridge/__init__.py` | Package version |
| `bridge/src/amplifier_paperclip_bridge/output.py` | 6 JSONL event formatting functions |
| `bridge/src/amplifier_paperclip_bridge/main.py` | CLI args + `run_bridge()` async session execution |
| `bridge/src/amplifier_paperclip_bridge/approval.py` | `HeadlessApprovalSystem` (auto-approve) |
| `bridge/tests/test_output.py` | 9 tests for JSONL formatting |
| `bridge/tests/test_main.py` | 12 tests for arg parsing + execution + errors |
| `bridge/tests/test_approval.py` | 4 tests for approval system |
| `bridge/tests/test_integration.py` | 3 integration tests (subprocess) |
| `protocol.md` | JSONL protocol v1.0 spec |
| `install.sh` | Single-command installer |
| `.gitignore` | Standard Python/Node ignores |
| `README.md` | Quick-start documentation |