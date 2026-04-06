"""CLI entry point for amplifier-paperclip-bridge."""

import argparse
import sys

from amplifier_paperclip_bridge import __version__


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
        default=300,
        help="Maximum seconds to wait for the session to complete.",
    )
    return parser.parse_args(argv)


def cli_main() -> None:
    """Main entry point for the amplifier-paperclip-bridge CLI."""
    args = parse_args()

    prompt = sys.stdin.read()
    if not prompt.strip():
        print("Error: prompt cannot be empty", file=sys.stderr)
        sys.exit(1)

    # Placeholder for session execution (Task 6)
    _ = args  # bundle, cwd, timeout will be used in Task 6


if __name__ == "__main__":
    cli_main()
