"""Tests for package scaffolding - verifies the package structure is correct."""

import importlib
import importlib.metadata


def test_package_importable() -> None:
    """Package can be imported."""
    mod = importlib.import_module("amplifier_paperclip_bridge")
    assert mod is not None


def test_package_version() -> None:
    """Package has correct version."""
    import amplifier_paperclip_bridge

    assert amplifier_paperclip_bridge.__version__ == "0.1.0"


def test_main_module_importable() -> None:
    """Main placeholder module can be imported."""
    mod = importlib.import_module("amplifier_paperclip_bridge.main")
    assert mod is not None


def test_output_module_importable() -> None:
    """Output placeholder module can be imported."""
    mod = importlib.import_module("amplifier_paperclip_bridge.output")
    assert mod is not None


def test_approval_module_importable() -> None:
    """Approval placeholder module can be imported."""
    mod = importlib.import_module("amplifier_paperclip_bridge.approval")
    assert mod is not None
