"""CLI entry point for amplifier-paperclip-bridge."""

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Any

from amplifier_app_cli.lib.settings import AppSettings
from amplifier_app_cli.runtime.config import expand_env_vars
from amplifier_foundation import Bundle
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

_MAX_TOOL_OUTPUT_CHARS = 2000


def _write_event(line: str) -> None:
    """Print a JSONL event line to stdout."""
    print(line, flush=True)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments for amplifier-paperclip-bridge.

    Args:
        argv: Argument list (defaults to sys.argv if None).

    Returns:
        Parsed arguments namespace.
    """
    parser = argparse.ArgumentParser(
        prog="amplifier-paperclip-bridge",
        description="Run an Amplifier session and emit JSONL events for Paperclip.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    parser.add_argument(
        "--bundle",
        default="amplifier-dev",
        help="Bundle name, local path, or git+https URL to load.",
    )
    parser.add_argument(
        "--cwd",
        default=None,
        help="Working directory for the Amplifier session.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=0,
        help="Maximum seconds to wait for the session to complete (0 = no limit).",
    )
    parser.add_argument(
        "--prompt",
        default=None,
        help=(
            "Prompt to execute. When provided, stdin is not read. "
            "Useful for debugging or when stdin piping is unreliable."
        ),
    )
    return parser.parse_args(argv)


def _make_hook_handler(event_name: str) -> Any:
    """Factory returning a sync handler for the given event type.

    Args:
        event_name: The event constant (e.g., "content_block:delta").

    Returns:
        A callable that handles the event and emits the appropriate JSONL.
    """

    def handler(event: str, data: dict[str, Any]) -> None:
        if event_name == "content_block:delta":
            text = data.get("text", "")
            _write_event(emit_content_delta(text=text))
        elif event_name == "tool:pre":
            tool = data.get("tool", "")
            input_data = data.get("input", "")
            _write_event(emit_tool_start(tool=str(tool), input_data=str(input_data)))
        elif event_name == "tool:post":
            tool = data.get("tool", "")
            output = str(data.get("output", ""))
            output = output[:_MAX_TOOL_OUTPUT_CHARS]
            _write_event(emit_tool_end(tool=str(tool), output=output))
        else:
            raise RuntimeError(f"Unhandled event type in hook handler: {event_name}")

    return handler


async def run_bridge(
    *,
    bundle_uri: str,
    cwd: str | None,
    timeout: int,
    prompt: str,
) -> None:
    """Run an Amplifier session and emit JSONL events.

    Args:
        bundle_uri: Bundle name, local path, or git+https URL.
        cwd: Working directory for the session (uses current dir if None).
        timeout: Maximum seconds to wait for session execution.
        prompt: The user prompt to execute.
    """
    # Deferred to avoid module-level import side effects during test patching
    import amplifier_core.events as events

    session_cwd = Path(cwd) if cwd else Path.cwd()

    # Load the bundle and inject user-configured providers from ~/.amplifier/settings.yaml.
    # We use the raw foundation API (no CLI behavior hooks) to keep stdout clean for
    # the JSONL protocol, then manually inject provider settings with env-var expansion.
    bundle = await load_bundle(bundle_uri)
    prepared = await bundle.prepare()

    app_settings = AppSettings()
    provider_overrides = app_settings.get_provider_overrides()
    if provider_overrides and not prepared.mount_plan.get("providers"):
        expanded = expand_env_vars({"providers": provider_overrides})
        prepared.mount_plan["providers"] = expanded["providers"]

    # Disable stdout-writing UI hooks to keep the JSONL protocol clean.
    # The amplifier-dev bundle includes hook modules (hooks-streaming-ui,
    # hooks-todo-display) that write directly to sys.stdout via print().
    # We suppress their output here so only our own emit_* lines appear on
    # stdout. The bridge's own hooks (content_block:delta, tool:pre, tool:post)
    # already capture and relay the relevant events as JSONL.
    _SILENT_UI_HOOKS: dict[str, dict] = {
        "hooks-streaming-ui": {
            "ui": {
                "show_token_usage": False,
                "show_tool_lines": 0,
                "show_thinking_stream": False,
            }
        },
        "hooks-todo-display": {
            "show_progress_bar": False,
            "show_border": False,
        },
    }
    hooks = prepared.mount_plan.get("hooks", [])
    for hook in hooks:
        if isinstance(hook, dict) and hook.get("module") in _SILENT_UI_HOOKS:
            silence = _SILENT_UI_HOOKS[hook["module"]]
            cfg = hook.setdefault("config", {})
            for key, val in silence.items():
                if isinstance(val, dict):
                    cfg.setdefault(key, {}).update(val)
                else:
                    cfg[key] = val

    approval = HeadlessApprovalSystem()
    session = await prepared.create_session(
        approval_system=approval,
        session_cwd=session_cwd,
    )

    # Register session.spawn capability for agent delegation.
    # The tool-delegate module (which powers the `delegate` tool) calls
    # coordinator.get_capability("session.spawn") to create sub-sessions.
    # Without this registration, delegation fails with "Session spawning not
    # available. App layer must register 'session.spawn' capability."
    async def _spawn_session(
        agent_name: str,
        instruction: str,
        parent_session: Any,
        agent_configs: dict[str, Any],
        sub_session_id: str | None = None,
        orchestrator_config: dict[str, Any] | None = None,
        parent_messages: list[dict[str, Any]] | None = None,
        tool_inheritance: dict[str, list[str]] | None = None,
        hook_inheritance: dict[str, list[str]] | None = None,
        provider_preferences: list[Any] | None = None,
        self_delegation_depth: int = 0,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Spawn a sub-session for agent delegation via the bundle's spawn mechanism."""
        agents = prepared.bundle.agents
        if agent_name in agent_configs:
            config = agent_configs[agent_name]
        elif agent_name in agents:
            config = agents[agent_name]
        else:
            available = list(agent_configs.keys()) + list(agents.keys())
            raise ValueError(
                f"Agent '{agent_name}' not found. Available agents: {available}"
            )

        child_providers = config.get("providers", []) or prepared.mount_plan.get(
            "providers", []
        )
        child_bundle = Bundle(
            name=agent_name,
            version="1.0.0",
            session=config.get("session", {}),
            providers=child_providers,
            tools=config.get("tools", []),
            hooks=config.get("hooks", []),
            instruction=(
                config.get("instruction") or config.get("system", {}).get("instruction")
            ),
        )

        return await prepared.spawn(
            child_bundle=child_bundle,
            instruction=instruction,
            session_id=sub_session_id,
            parent_session=parent_session,
            orchestrator_config=orchestrator_config,
            parent_messages=parent_messages,
            provider_preferences=provider_preferences,
            self_delegation_depth=self_delegation_depth,
        )

    session.coordinator.register_capability("session.spawn", _spawn_session)

    _write_event(
        emit_init(
            session_id=session.session_id,
            model="bundle-default",
            bundle=bundle_uri,
        )
    )

    session.coordinator.hooks.register(
        events.CONTENT_BLOCK_DELTA,
        _make_hook_handler(events.CONTENT_BLOCK_DELTA),
    )
    session.coordinator.hooks.register(
        events.TOOL_PRE,
        _make_hook_handler(events.TOOL_PRE),
    )
    session.coordinator.hooks.register(
        events.TOOL_POST,
        _make_hook_handler(events.TOOL_POST),
    )

    async with session:
        if timeout > 0:
            result = await asyncio.wait_for(session.execute(prompt), timeout=timeout)
        else:
            result = await session.execute(prompt)

    _write_event(
        emit_result(
            session_id=session.session_id,
            response=result,
            usage=None,
            cost_usd=None,
        )
    )


def cli_main() -> None:
    """Main entry point for the amplifier-paperclip-bridge CLI."""
    # Paperclip sets AMPLIFIER_HOME to a temp skills dir -- save it for skills, then restore real home
    amplifier_home = os.environ.get("AMPLIFIER_HOME", "")
    if amplifier_home.startswith("/tmp/paperclip-skills-"):
        # Save for skills injection
        os.environ["AMPLIFIER_SKILLS_DIR"] = amplifier_home
        # Restore real Amplifier home
        del os.environ["AMPLIFIER_HOME"]

    logging.basicConfig(
        level=logging.WARNING,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stderr,
    )

    args = parse_args()

    if args.prompt is not None:
        prompt = args.prompt
    else:
        prompt = sys.stdin.read()

    if not prompt.strip():
        _write_event(emit_error("No prompt provided", code="SESSION_ERROR"))
        sys.exit(1)

    try:
        asyncio.run(
            run_bridge(
                bundle_uri=args.bundle,
                cwd=args.cwd,
                timeout=args.timeout,
                prompt=prompt,
            )
        )
    except asyncio.TimeoutError:
        _write_event(emit_error("Session timed out", code="TIMEOUT"))
        sys.exit(1)
    except Exception as e:
        _write_event(emit_error(str(e), code="SESSION_ERROR"))
        sys.exit(1)


if __name__ == "__main__":
    cli_main()
