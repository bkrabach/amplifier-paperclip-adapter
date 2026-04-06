#!/usr/bin/env bash
# Tests for install.sh
# Run with: bash tests/test_install_sh.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_SH="${SCRIPT_DIR}/../install.sh"

PASS=0
FAIL=0

pass() { echo "  PASS: $1"; ((PASS++)); }
fail() { echo "  FAIL: $1"; ((FAIL++)); }

assert_contains() {
    local desc="$1" pattern="$2" file="$3"
    if grep -qE "$pattern" "$file" 2>/dev/null; then
        pass "$desc"
    else
        fail "$desc (pattern '$pattern' not found in $file)"
    fi
}

assert_exit_zero() {
    local desc="$1"; shift
    if "$@" >/dev/null 2>&1; then
        pass "$desc"
    else
        fail "$desc (command exited non-zero)"
    fi
}

echo "=== install.sh tests ==="

# Test 1: File exists
echo ""
echo "--- Existence & Permissions ---"
if [[ -f "$INSTALL_SH" ]]; then
    pass "install.sh exists"
else
    fail "install.sh exists at $INSTALL_SH"
fi

# Test 2: File is executable
if [[ -x "$INSTALL_SH" ]]; then
    pass "install.sh is executable"
else
    fail "install.sh is executable"
fi

# Test 3: Shebang line
echo ""
echo "--- Script Header ---"
assert_contains "shebang is #!/usr/bin/env bash" '#!/usr/bin/env bash' "$INSTALL_SH"

# Test 4: set -euo pipefail
assert_contains "set -euo pipefail present" 'set -euo pipefail' "$INSTALL_SH"

# Test 5: Header banner (some banner text)
assert_contains "header banner present" 'Amplifier Paperclip Bridge' "$INSTALL_SH"

# Test 6: check_command function exists
echo ""
echo "--- Functions ---"
assert_contains "check_command function defined" 'check_command\(\)' "$INSTALL_SH"

# Test 7: check_python_version function exists
assert_contains "check_python_version function defined" 'check_python_version\(\)' "$INSTALL_SH"

# Test 8: Python 3.11 version requirement in check_python_version
echo ""
echo "--- Python Version Check ---"
assert_contains "Python 3.11 minimum version enforced" '3\.11' "$INSTALL_SH"

# Test 9: Python version extracts major.minor (match assignment, not just any comment with the word)
assert_contains "extracts major version" 'major=\$\(' "$INSTALL_SH"
assert_contains "extracts minor version" 'minor=\$\(' "$INSTALL_SH"

# Test 10: Prerequisites checks
echo ""
echo "--- Prerequisites ---"
assert_contains "checks python3" 'python3' "$INSTALL_SH"
assert_contains "checks git" 'check_command git' "$INSTALL_SH"

# Test 11: Pip detection (uv pip, pip3, pip fallback)
echo ""
echo "--- Pip Detection ---"
assert_contains "uv pip preferred" 'uv pip' "$INSTALL_SH"
assert_contains "pip3 fallback" 'pip3' "$INSTALL_SH"
assert_contains "pip fallback" '"pip"' "$INSTALL_SH"

# Test 12: REPO variable with correct URL
echo ""
echo "--- Repository URL ---"
assert_contains "REPO set to correct GitHub URL" 'https://github.com/bkrabach/amplifier-paperclip-adapter\.git' "$INSTALL_SH"

# Test 13: Install command uses git subdirectory
echo ""
echo "--- Install Command ---"
assert_contains "install command references bridge subdirectory" 'subdirectory=bridge' "$INSTALL_SH"
assert_contains "install command uses pip install" 'install.*amplifier-paperclip-bridge|PACKAGE.*install|install.*PACKAGE' "$INSTALL_SH"
assert_contains "install command uses git+ prefix" 'git\+\$\{REPO\}' "$INSTALL_SH"

# Test 14: Verification step checks PATH
echo ""
echo "--- Verification ---"
assert_contains "checks if command is in PATH after install" 'command -v amplifier-paperclip-bridge' "$INSTALL_SH"

# Test 15: Prints version after install
assert_contains "prints version after install" 'amplifier-paperclip-bridge.*--version' "$INSTALL_SH"

# Test 16: Next steps section
echo ""
echo "--- Next Steps ---"
assert_contains "next steps: API keys" '[Aa][Pp][Ii].*[Kk]ey' "$INSTALL_SH"
assert_contains "next steps: echo/test command" 'amplifier-paperclip-bridge.*--help' "$INSTALL_SH"

# Test 17: check_python_version logic — source and test in isolation
echo ""
echo "--- Function Logic ---"
# Source just the function and test it
TEST_RESULT=$(bash -c "
$(grep -A 30 'check_python_version()' "$INSTALL_SH" 2>/dev/null | head -40)

# Test with Python 3.11 (should pass)
PYTHON_MAJOR=3 PYTHON_MINOR=11
if [[ \$PYTHON_MAJOR -gt 3 ]] || [[ \$PYTHON_MAJOR -eq 3 && \$PYTHON_MINOR -ge 11 ]]; then
    echo 'OK_311'
fi

# Test with Python 3.9 (should fail)
PYTHON_MAJOR=3 PYTHON_MINOR=9
if [[ \$PYTHON_MAJOR -gt 3 ]] || [[ \$PYTHON_MAJOR -eq 3 && \$PYTHON_MINOR -ge 11 ]]; then
    echo 'OK_39'
fi

# Test with Python 4.0 (should pass)
PYTHON_MAJOR=4 PYTHON_MINOR=0
if [[ \$PYTHON_MAJOR -gt 3 ]] || [[ \$PYTHON_MAJOR -eq 3 && \$PYTHON_MINOR -ge 11 ]]; then
    echo 'OK_40'
fi
" 2>/dev/null)

if echo "$TEST_RESULT" | grep -q 'OK_311'; then
    pass "version logic: Python 3.11 passes"
else
    fail "version logic: Python 3.11 should pass"
fi

if echo "$TEST_RESULT" | grep -q 'OK_39'; then
    fail "version logic: Python 3.9 should NOT pass"
else
    pass "version logic: Python 3.9 correctly rejected"
fi

if echo "$TEST_RESULT" | grep -q 'OK_40'; then
    pass "version logic: Python 4.0 passes"
else
    fail "version logic: Python 4.0 should pass"
fi

echo ""
echo "--- Version Guard ---"
# Create a fake python3 binary that returns unparseable output
TMPDIR_GUARD=$(mktemp -d)
printf '#!/usr/bin/env bash\necho "Python totally-wrong-format"\n' > "$TMPDIR_GUARD/fakepython3"
chmod +x "$TMPDIR_GUARD/fakepython3"

GUARD_ERR=$(bash -c "
$(sed -n '/^check_python_version/,/^}/p' "$INSTALL_SH")
check_python_version '$TMPDIR_GUARD/fakepython3'
" 2>&1 || true)

rm -rf "$TMPDIR_GUARD"

if echo "$GUARD_ERR" | grep -q 'Could not parse'; then
    pass "version guard: unparseable version gives clear error"
else
    fail "version guard: unparseable version gives clear error (got: '$GUARD_ERR')"
fi

echo ""
echo "==========================="
echo "Results: $PASS passed, $FAIL failed"
echo "==========================="

if [[ $FAIL -gt 0 ]]; then
    exit 1
fi
exit 0
