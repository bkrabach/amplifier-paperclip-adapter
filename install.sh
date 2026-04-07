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
#    - uv (preferred), pipx, or pip
# ==============================================================================

REPO="https://github.com/bkrabach/amplifier-paperclip-adapter.git"
PACKAGE="amplifier-paperclip-bridge"
PACKAGE_URL="${PACKAGE} @ git+${REPO}#subdirectory=bridge"

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

# ── Prerequisites ─────────────────────────────────────────────────────────────

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│   Amplifier Paperclip Bridge — Installer        │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "Checking prerequisites..."

check_command python3
check_python_version python3
check_command git

# ── Installer detection ───────────────────────────────────────────────────────

INSTALL_METHOD=""
if command -v uv &>/dev/null; then
    INSTALL_METHOD="uv"
    echo "  installer: uv tool install ✓"
elif command -v pipx &>/dev/null; then
    INSTALL_METHOD="pipx"
    echo "  installer: pipx ✓"
elif command -v pip3 &>/dev/null; then
    INSTALL_METHOD="pip3"
    echo "  installer: pip3 (--user) ✓"
elif command -v pip &>/dev/null; then
    INSTALL_METHOD="pip"
    echo "  installer: pip (--user) ✓"
else
    echo "ERROR: No installer found (tried: uv, pipx, pip3, pip)." >&2
    echo "       Please install uv (https://github.com/astral-sh/uv) and re-run." >&2
    exit 1
fi

# ── Install ───────────────────────────────────────────────────────────────────

echo ""
echo "Installing ${PACKAGE} from GitHub..."
echo "  Source: ${REPO}"
echo ""

case "$INSTALL_METHOD" in
    uv)
        uv tool install "${PACKAGE_URL}"
        ;;
    pipx)
        pipx install "${PACKAGE_URL}"
        ;;
    pip3)
        pip3 install --user "${PACKAGE_URL}"
        ;;
    pip)
        pip install --user "${PACKAGE_URL}"
        ;;
esac

# ── Verification ──────────────────────────────────────────────────────────────

echo ""
echo "Verifying installation..."

# uv tool and pipx put binaries in ~/.local/bin — make sure it's on PATH for this check
export PATH="$HOME/.local/bin:$PATH"

if command -v amplifier-paperclip-bridge &>/dev/null; then
    echo "  amplifier-paperclip-bridge is in PATH ✓"
    echo "  Version: $(amplifier-paperclip-bridge --version 2>&1 || true)"
else
    echo "WARNING: amplifier-paperclip-bridge not found in PATH." >&2
    echo "         You may need to add the Python scripts directory to your PATH." >&2
    echo "         Try: export PATH=\"\$HOME/.local/bin:\$PATH\"" >&2
fi

# ── Next Steps ────────────────────────────────────────────────────────────────

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
echo "3. TypeScript adapter — @amplifier/paperclip-adapter:"
echo ""
echo "     Install the adapter in your Paperclip project:"
echo ""
echo "       npm install @amplifier/paperclip-adapter"
echo ""
echo "     Register the adapter in your adapter-plugins.json:"
echo ""
echo "       {"
echo "         \"plugins\": ["
echo "           {"
echo "             \"name\": \"amplifier_local\","
echo "             \"module\": \"@amplifier/paperclip-adapter\""
echo "           }"
echo "         ]"
echo "       }"
echo ""
echo "     See adapter/README.md for full configuration and setup instructions."
echo ""
echo "Installation complete!"
echo ""
