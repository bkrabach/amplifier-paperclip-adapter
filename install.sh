#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
#  Amplifier Paperclip Bridge — Installer
# ==============================================================================
#  Installs the amplifier-paperclip-bridge Python CLI directly from GitHub.
#
#  Usage:
#    curl -sSL https://raw.githubusercontent.com/bkrabach/amplifier-paperclip-adapter/main/install.sh | bash
#
#  Requirements:
#    - Python 3.11+
#    - git
#    - uv (preferred), pip3, or pip
# ==============================================================================

REPO="https://github.com/bkrabach/amplifier-paperclip-adapter.git"
PACKAGE="amplifier-paperclip-bridge"

# ── Helpers ───────────────────────────────────────────────────────────────────

check_command() {
    local cmd="$1"
    if ! command -v "$cmd" &>/dev/null; then
        echo "ERROR: Required command '$cmd' not found." >&2
        echo "       Please install '$cmd' and re-run this installer." >&2
        exit 1
    fi
}

check_python_version() {
    local python_bin="${1:-python3}"
    local version
    version=$("$python_bin" --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)

    if [[ -z "$version" ]]; then
        echo "ERROR: Could not parse Python version from '${python_bin} --version'." >&2
        echo "       Ensure Python outputs a version like 'Python X.Y.Z' and re-run." >&2
        exit 1
    fi

    local major minor
    major=$(echo "$version" | cut -d. -f1)
    minor=$(echo "$version" | cut -d. -f2)

    if [[ "$major" -gt 3 ]] || [[ "$major" -eq 3 && "$minor" -ge 11 ]]; then
        echo "  Python ${version} ✓"
    else
        echo "ERROR: Python 3.11+ is required (found ${version})." >&2
        echo "       Please upgrade Python and re-run this installer." >&2
        exit 1
    fi
}

# ── Prerequisites ──────────────────────────────────────────────────────────────

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│   Amplifier Paperclip Bridge — Installer        │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "Checking prerequisites..."

check_command python3
check_python_version python3
check_command git

# ── Pip detection ──────────────────────────────────────────────────────────────

PIP_CMD=""
if command -v uv &>/dev/null; then
    PIP_CMD="uv pip"
    echo "  pip installer: uv pip ✓"
elif command -v pip3 &>/dev/null; then
    PIP_CMD="pip3"
    echo "  pip installer: pip3 ✓"
elif command -v pip &>/dev/null; then
    PIP_CMD="pip"
    echo "  pip installer: pip ✓"
else
    echo "ERROR: No pip installer found (tried: uv pip, pip3, pip)." >&2
    echo "       Please install uv (https://github.com/astral-sh/uv) or pip and re-run." >&2
    exit 1
fi

# ── Install ────────────────────────────────────────────────────────────────────

echo ""
echo "Installing ${PACKAGE} from GitHub..."
echo "  Source: ${REPO}"
echo ""

# Word-splitting $PIP_CMD is intentional: "uv pip" must become two separate words.
# shellcheck disable=SC2086
$PIP_CMD install "${PACKAGE} @ git+${REPO}#subdirectory=bridge"

# ── Verification ───────────────────────────────────────────────────────────────

echo ""
echo "Verifying installation..."

if command -v amplifier-paperclip-bridge &>/dev/null; then
    echo "  amplifier-paperclip-bridge is in PATH ✓"
    echo "  Version: $(amplifier-paperclip-bridge --version 2>&1 || true)"
else
    echo "WARNING: amplifier-paperclip-bridge not found in PATH." >&2
    echo "         You may need to add the Python scripts directory to your PATH." >&2
    echo "         Try: export PATH=\"\$HOME/.local/bin:\$PATH\"" >&2
fi

# ── Next Steps ─────────────────────────────────────────────────────────────────

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│   Next Steps                                    │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "1. Set your API keys:"
echo ""
echo "     export ANTHROPIC_API_KEY=\"your-api-key-here\""
echo "     # or OPENAI_API_KEY / AZURE_OPENAI_API_KEY as appropriate"
echo ""
echo "2. Test the bridge with an echo command:"
echo ""
echo "     amplifier-paperclip-bridge --help"
echo "     echo '{\"type\":\"ping\"}' | amplifier-paperclip-bridge"
echo ""
echo "3. Phase 2 — TypeScript adapter (coming soon):"
echo ""
echo "     The adapter/ package will connect Paperclip's control plane"
echo "     to this bridge via HTTP/stdio."
echo ""
echo "Installation complete!"
echo ""
