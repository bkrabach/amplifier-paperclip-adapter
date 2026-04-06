"""Headless approval system for non-interactive Paperclip heartbeats."""

import logging
from typing import Any, Literal

logger = logging.getLogger(__name__)


class HeadlessApprovalSystem:
    """Auto-approve approval system for headless/non-interactive use.

    Implements the amplifier_core.approval.ApprovalSystem protocol.

    For v1, operator trusts bundle config. Approval forwarding to
    Paperclip UI is v2.
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
        """Return first option or "allow" for empty options; log the decision.

        Args:
            prompt: Question describing what needs approval
            options: Available choices to select from
            timeout: Seconds to wait (unused in headless mode)
            default: Action on timeout (unused in headless mode)

        Returns:
            options[0] if options is non-empty, else "allow"
        """
        decision = options[0] if options else "allow"
        logger.debug("Headless approval: %r -> %r", prompt, decision)
        self.decisions.append({"prompt": prompt, "decision": decision})
        return decision
