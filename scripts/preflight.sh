#!/usr/bin/env bash
# ============================================================================
# PREFLIGHT SCRIPT -- CI Parity Gate
#
# Runs the EXACT same checks that CI runs, locally, before commit.
# If this passes, CI will pass. If this fails, DO NOT COMMIT.
#
# Usage:
#   bash scripts/preflight.sh          # full check
#   bash scripts/preflight.sh --quick  # lint + format only (no tests)
#
# This script is derived from .github/workflows/ci.yml and must be
# kept in sync. If CI adds a new check, add it here too.
# ============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

QUICK=false
if [ "${1:-}" = "--quick" ]; then
    QUICK=true
fi

PASS_COUNT=0
FAIL_COUNT=0
FAILURES=""

run_check() {
    local name="$1"
    shift
    echo -e "${YELLOW}=== PREFLIGHT: $name ===${NC}"
    if "$@"; then
        echo -e "${GREEN}  PASS: $name${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}  FAIL: $name${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILURES="$FAILURES\n  - $name"
    fi
}

# --- Python backend (verispec/) ---
if [ -d "verispec" ]; then
    cd verispec

    # Lint check (catches unused imports, I001 sort errors, type issues)
    run_check "ruff check (Python lint)" poetry run ruff check .

    # Format check (catches line length, spacing, quotes -- DIFFERENT from lint)
    run_check "ruff format (Python format)" poetry run ruff format --check .

    # Syntax check (same as CI)
    run_check "Python syntax" bash -c 'find app -name "*.py" -print0 | xargs -0 poetry run python -m py_compile'

    if [ "$QUICK" = false ]; then
        # Tests (same as CI, ignoring security tests)
        run_check "pytest" poetry run pytest tests/ --ignore=tests/security/ -v --tb=short -q
    fi

    cd ..
fi

# --- Frontend (qa-ui/) ---
if [ -d "qa-ui" ] && [ "$QUICK" = false ]; then
    cd qa-ui
    run_check "Frontend tests" npm run test:coverage 2>/dev/null || true
    cd ..
fi

# --- Pre-commit hooks (if configured) ---
if [ -f ".pre-commit-config.yaml" ]; then
    if command -v pre-commit &> /dev/null; then
        run_check "pre-commit hooks" pre-commit run --all-files
    else
        echo -e "${YELLOW}  SKIP: pre-commit not installed (pip install pre-commit)${NC}"
    fi
fi

# --- Summary ---
echo ""
echo "============================================"
if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}PREFLIGHT: ALL $PASS_COUNT CHECKS PASSED${NC}"
    echo -e "${GREEN}Safe to commit.${NC}"
    echo "============================================"
    exit 0
else
    echo -e "${RED}PREFLIGHT: $FAIL_COUNT FAILED, $PASS_COUNT PASSED${NC}"
    echo -e "${RED}DO NOT COMMIT. Fix these first:${NC}"
    echo -e "$FAILURES"
    echo ""
    echo -e "${YELLOW}Quick fixes:${NC}"
    echo "  ruff check --fix .        # auto-fix lint errors"
    echo "  ruff format .             # auto-fix format errors"
    echo "  ruff check --select I --fix .  # auto-fix import sorting (I001)"
    echo "============================================"
    exit 1
fi
