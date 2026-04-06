"""Tests for headless auto-approve approval system."""

import pytest

from amplifier_paperclip_bridge.approval import HeadlessApprovalSystem


class TestHeadlessApprovalSystem:
    @pytest.mark.asyncio
    async def test_always_approves(self) -> None:
        """request_approval with options=["allow", "deny"] returns "allow"."""
        system = HeadlessApprovalSystem()
        result = await system.request_approval(
            prompt="Allow this action?",
            options=["allow", "deny"],
            _timeout=30.0,
            _default="allow",
        )
        assert result == "allow"

    @pytest.mark.asyncio
    async def test_returns_first_option(self) -> None:
        """request_approval with options=["proceed", "skip", "abort"] returns "proceed"."""
        system = HeadlessApprovalSystem()
        result = await system.request_approval(
            prompt="What should we do?",
            options=["proceed", "skip", "abort"],
            _timeout=30.0,
            _default="allow",
        )
        assert result == "proceed"

    @pytest.mark.asyncio
    async def test_empty_options_returns_allow(self) -> None:
        """request_approval with options=[] returns "allow"."""
        system = HeadlessApprovalSystem()
        result = await system.request_approval(
            prompt="No options provided",
            options=[],
            _timeout=30.0,
            _default="allow",
        )
        assert result == "allow"

    @pytest.mark.asyncio
    async def test_logs_decisions(self) -> None:
        """After one call, system.decisions has length 1 with correct prompt and decision."""
        system = HeadlessApprovalSystem()
        prompt = "Should we proceed?"
        await system.request_approval(
            prompt=prompt,
            options=["allow", "deny"],
            _timeout=30.0,
            _default="allow",
        )
        assert len(system.decisions) == 1
        assert system.decisions[0]["prompt"] == prompt
        assert system.decisions[0]["decision"] == "allow"
