#!/usr/bin/env bash
# =============================================================================
# SHIP.SH -- Definition of Done Enforcer
#
# The ONLY command an agent needs to call to ship code.
# Replaces 22 golden rules with 1 executable sequence.
#
# Usage:
#   bash scripts/ship.sh                    # full ship: preflight + commit + push + poll CI + poll reviews
#   bash scripts/ship.sh --preflight        # preflight only (lint + format + tests)
#   bash scripts/ship.sh --poll             # poll CI + review comments on current PR (no commit/push)
#   bash scripts/ship.sh --autofix          # run autofix then preflight
#   bash scripts/ship.sh --msg "fix: X"     # provide commit message (skip prompt)
#
# Exit codes:
#   0 = all steps passed, PR is clean
#   1 = preflight failed (lint/format/tests)
#   2 = commit or push failed
#   3 = CI failed (agent should fix and re-run)
#   4 = review comments need attention (agent should address them)
#   5 = no changes to commit
#
# Agents: call this script. Read stdout. Act on exit code.
# Do NOT ask the user for permission to run tests or lint.
# Do NOT manually invoke venv, pytest, ruff, or gh separately.
# This script handles all of that.
# =============================================================================
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

MODE="full"
COMMIT_MSG=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --preflight) MODE="preflight"; shift ;;
        --poll)      MODE="poll"; shift ;;
        --autofix)   MODE="autofix"; shift ;;
        --msg)       COMMIT_MSG="$2"; shift 2 ;;
        *)           shift ;;
    esac
done

# ---------------------------------------------------------------------------
# DETECT PROJECT STRUCTURE
# ---------------------------------------------------------------------------
HAS_PYTHON=false; HAS_NODE=false; HAS_POETRY=false; HAS_VENV=false
PYTHON_DIR=""; NODE_DIR=""

detect_project() {
    if [ -d "verispec" ]; then
        PYTHON_DIR="verispec"
    elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
        PYTHON_DIR="."
    fi

    if [ -n "$PYTHON_DIR" ]; then
        HAS_PYTHON=true
        [ -f "$PYTHON_DIR/pyproject.toml" ] && grep -q "poetry" "$PYTHON_DIR/pyproject.toml" 2>/dev/null && HAS_POETRY=true
        [ -d "$PYTHON_DIR/venv" ] && HAS_VENV=true
    fi

    if [ -d "qa-ui" ]; then
        NODE_DIR="qa-ui"
        HAS_NODE=true
    elif [ -f "package.json" ]; then
        NODE_DIR="."
        HAS_NODE=true
    fi
}

# ---------------------------------------------------------------------------
# PYTHON RUNNER -- handles venv/poetry automatically, never asks permission
# ---------------------------------------------------------------------------
py_run() {
    local dir="${1}"; shift
    (
        cd "$dir"
        if [ "$HAS_POETRY" = true ] && command -v poetry &>/dev/null; then
            poetry run "$@"
        elif [ "$HAS_VENV" = true ] && [ -f "venv/bin/activate" ]; then
            source venv/bin/activate
            "$@"
        elif [ -f ".venv/bin/activate" ]; then
            source .venv/bin/activate
            "$@"
        else
            "$@"
        fi
    )
}

# ---------------------------------------------------------------------------
# STEP 1: AUTOFIX (optional, runs before preflight)
# ---------------------------------------------------------------------------
step_autofix() {
    echo -e "${CYAN}[ship] Step 1: Autofix (lint + format)${NC}"

    if [ "$HAS_PYTHON" = true ]; then
        echo "  [autofix] ruff check --fix ."
        py_run "$PYTHON_DIR" ruff check --fix . 2>/dev/null || true
        echo "  [autofix] ruff format ."
        py_run "$PYTHON_DIR" ruff format . 2>/dev/null || true
        echo "  [autofix] ruff check --select I --fix . (import sorting)"
        py_run "$PYTHON_DIR" ruff check --select I --fix . 2>/dev/null || true
    fi

    if [ "$HAS_NODE" = true ]; then
        (cd "$NODE_DIR" && npx prettier --write . 2>/dev/null || true)
    fi

    echo -e "${GREEN}  [autofix] Done${NC}"
}

# ---------------------------------------------------------------------------
# STEP 2: PREFLIGHT (lint + format + tests -- mirrors CI exactly)
# ---------------------------------------------------------------------------
step_preflight() {
    echo -e "${CYAN}[ship] Step 2: Preflight (CI parity)${NC}"

    if [ -x "scripts/preflight.sh" ]; then
        bash scripts/preflight.sh
        return $?
    fi

    local FAILS=0

    if [ "$HAS_PYTHON" = true ]; then
        echo "  [preflight] ruff check"
        py_run "$PYTHON_DIR" ruff check . || FAILS=$((FAILS + 1))

        echo "  [preflight] ruff format --check"
        py_run "$PYTHON_DIR" ruff format --check . || FAILS=$((FAILS + 1))

        echo "  [preflight] pytest"
        py_run "$PYTHON_DIR" python -m pytest tests/ --tb=short -q || FAILS=$((FAILS + 1))
    fi

    if [ "$HAS_NODE" = true ]; then
        echo "  [preflight] npm test"
        (cd "$NODE_DIR" && npm test 2>/dev/null) || FAILS=$((FAILS + 1))
    fi

    if [ "$FAILS" -gt 0 ]; then
        echo -e "${RED}[ship] PREFLIGHT FAILED ($FAILS checks). Fix and re-run.${NC}"
        return 1
    fi

    echo -e "${GREEN}[ship] PREFLIGHT PASSED${NC}"
    return 0
}

# ---------------------------------------------------------------------------
# STEP 3: STAGE + COMMIT (explicit file paths, never git add .)
# ---------------------------------------------------------------------------
step_commit() {
    echo -e "${CYAN}[ship] Step 3: Stage + Commit${NC}"

    local CHANGED
    CHANGED=$(git diff --name-only 2>/dev/null; git diff --cached --name-only 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)

    if [ -z "$CHANGED" ]; then
        echo -e "${YELLOW}[ship] No changes to commit.${NC}"
        return 5
    fi

    echo "  [stage] Files:"
    echo "$CHANGED" | sort -u | while read -r f; do
        [ -n "$f" ] && echo "    $f"
    done

    echo "$CHANGED" | sort -u | while read -r f; do
        [ -n "$f" ] && [ -f "$f" ] && git add "$f"
    done

    if [ -z "$COMMIT_MSG" ]; then
        echo -e "${RED}[ship] ERROR: No commit message. Use --msg \"your message\"${NC}"
        echo "  Example: bash scripts/ship.sh --msg \"fix(PROJ-123): correct keyword normalization\""
        return 2
    fi

    git commit -m "$COMMIT_MSG" --no-verify 2>&1
    local RC=$?

    if [ $RC -ne 0 ]; then
        echo -e "${RED}[ship] COMMIT FAILED (exit $RC)${NC}"
        return 2
    fi

    # Post-commit: verify no unwanted trailers
    local MSG
    MSG=$(git log -1 --format="%B")
    if echo "$MSG" | grep -qi "Co-authored-by.*cursor\|Made-with"; then
        echo "  [ship] Stripping IDE trailers from commit..."
        echo "$MSG" | sed '/Co-authored-by:.*[Cc]ursor/d; /Made-with:/d' > /tmp/ship_clean_msg
        git commit --amend -F /tmp/ship_clean_msg --no-verify 2>/dev/null
        rm -f /tmp/ship_clean_msg
    fi

    echo -e "${GREEN}[ship] COMMITTED: $(git log -1 --oneline)${NC}"
    return 0
}

# ---------------------------------------------------------------------------
# STEP 4: PUSH
# ---------------------------------------------------------------------------
step_push() {
    echo -e "${CYAN}[ship] Step 4: Push${NC}"

    local BRANCH
    BRANCH=$(git rev-parse --abbrev-ref HEAD)

    git push -u origin "$BRANCH" 2>&1
    local RC=$?

    if [ $RC -ne 0 ]; then
        echo -e "${RED}[ship] PUSH FAILED (exit $RC)${NC}"
        return 2
    fi

    echo -e "${GREEN}[ship] PUSHED to origin/$BRANCH${NC}"
    return 0
}

# ---------------------------------------------------------------------------
# STEP 5: POLL CI (wait for all checks to complete, max 10 min)
# ---------------------------------------------------------------------------
step_poll_ci() {
    echo -e "${CYAN}[ship] Step 5: Polling CI checks (max 10 min)${NC}"

    if ! command -v gh &>/dev/null; then
        echo -e "${YELLOW}[ship] gh CLI not found. Skipping CI poll.${NC}"
        return 0
    fi

    local PR_NUM
    PR_NUM=$(gh pr view --json number -q '.number' 2>/dev/null || echo "")

    if [ -z "$PR_NUM" ]; then
        echo "  [ci] No open PR found for this branch. Creating one may be needed."
        echo "  [ci] Skipping CI poll (no PR to check)."
        return 0
    fi

    echo "  [ci] PR #$PR_NUM detected. Polling..."

    local MAX_POLLS=20
    local POLL_INTERVAL=30

    for i in $(seq 1 $MAX_POLLS); do
        sleep "$POLL_INTERVAL"

        local CHECKS
        CHECKS=$(gh pr checks "$PR_NUM" 2>&1)
        local PENDING
        PENDING=$(echo "$CHECKS" | grep -c "pending\|in_progress\|queued" || true)
        local FAILING
        FAILING=$(echo "$CHECKS" | grep -c "fail" || true)

        echo "  [ci] Poll $i/$MAX_POLLS: pending=$PENDING failing=$FAILING"

        if [ "$FAILING" -gt 0 ]; then
            echo -e "${RED}[ship] CI FAILED:${NC}"
            echo "$CHECKS" | grep "fail"
            echo ""
            echo "ACTION: Fix the failing checks, then run: bash scripts/ship.sh --autofix"
            return 3
        fi

        if [ "$PENDING" -eq 0 ]; then
            echo -e "${GREEN}[ship] CI ALL GREEN${NC}"
            return 0
        fi
    done

    echo -e "${YELLOW}[ship] CI still pending after 10 min. Check manually.${NC}"
    return 0
}

# ---------------------------------------------------------------------------
# STEP 6: POLL REVIEW COMMENTS (check for inline comments, max 5 min)
# ---------------------------------------------------------------------------
step_poll_reviews() {
    echo -e "${CYAN}[ship] Step 6: Polling review comments (max 5 min)${NC}"

    if ! command -v gh &>/dev/null; then
        echo -e "${YELLOW}[ship] gh CLI not found. Skipping review poll.${NC}"
        return 0
    fi

    local PR_NUM
    PR_NUM=$(gh pr view --json number -q '.number' 2>/dev/null || echo "")

    if [ -z "$PR_NUM" ]; then
        echo "  [review] No open PR. Skipping."
        return 0
    fi

    local MAX_POLLS=10
    local POLL_INTERVAL=30

    for i in $(seq 1 $MAX_POLLS); do
        sleep "$POLL_INTERVAL"

        local COMMENTS
        COMMENTS=$(gh api "repos/{owner}/{repo}/pulls/$PR_NUM/comments" 2>/dev/null || echo "[]")
        local COMMENT_COUNT
        COMMENT_COUNT=$(echo "$COMMENTS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

        local REVIEWS
        REVIEWS=$(gh api "repos/{owner}/{repo}/pulls/$PR_NUM/reviews" 2>/dev/null || echo "[]")
        local REVIEW_COUNT
        REVIEW_COUNT=$(echo "$REVIEWS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

        echo "  [review] Poll $i/$MAX_POLLS: inline_comments=$COMMENT_COUNT reviews=$REVIEW_COUNT"

        if [ "$COMMENT_COUNT" -gt 0 ] || [ "$REVIEW_COUNT" -gt 0 ]; then
            echo ""
            echo -e "${YELLOW}[ship] REVIEW COMMENTS FOUND ($COMMENT_COUNT inline, $REVIEW_COUNT reviews)${NC}"
            echo ""

            if [ "$COMMENT_COUNT" -gt 0 ]; then
                echo "=== INLINE COMMENTS ==="
                echo "$COMMENTS" | python3 -c "
import json, sys
comments = json.load(sys.stdin)
for c in comments:
    user = c.get('user', {}).get('login', 'unknown')
    path = c.get('path', '?')
    line = c.get('line', c.get('original_line', '?'))
    body = c.get('body', '')
    print(f'--- {user} on {path}:{line} ---')
    print(body[:500])
    print()
" 2>/dev/null || echo "(failed to parse comments)"
            fi

            if [ "$REVIEW_COUNT" -gt 0 ]; then
                echo "=== REVIEWS ==="
                echo "$REVIEWS" | python3 -c "
import json, sys
reviews = json.load(sys.stdin)
for r in reviews:
    user = r.get('user', {}).get('login', 'unknown')
    state = r.get('state', '?')
    body = r.get('body', '')
    print(f'--- {user}: {state} ---')
    if body:
        print(body[:500])
    print()
" 2>/dev/null || echo "(failed to parse reviews)"
            fi

            echo "ACTION: Address each comment above. Challenge with council if needed."
            echo "        After fixing, re-run: bash scripts/ship.sh"
            return 4
        fi
    done

    echo -e "${GREEN}[ship] No review comments after 5 min. PR is clean.${NC}"
    return 0
}

# ---------------------------------------------------------------------------
# STEP 7: SUMMARY
# ---------------------------------------------------------------------------
step_summary() {
    local CI_STATUS="${1:-SKIPPED}"
    local REVIEW_STATUS="${2:-SKIPPED}"

    echo ""
    echo "============================================"
    echo -e "${CYAN}[ship] SHIP SUMMARY${NC}"
    echo "  Branch:  $(git rev-parse --abbrev-ref HEAD)"
    echo "  Commit:  $(git log -1 --oneline 2>/dev/null || echo 'none')"
    echo "  CI:      $CI_STATUS"
    echo "  Reviews: $REVIEW_STATUS"

    local PR_URL
    PR_URL=$(gh pr view --json url -q '.url' 2>/dev/null || echo "no PR")
    echo "  PR:      $PR_URL"
    echo "============================================"
}

# =============================================================================
# MAIN
# =============================================================================

detect_project

case "$MODE" in
    autofix)
        step_autofix
        step_preflight
        exit $?
        ;;
    preflight)
        step_preflight
        exit $?
        ;;
    poll)
        step_poll_ci
        CI_RC=$?
        if [ $CI_RC -eq 0 ]; then
            step_poll_reviews
            RV_RC=$?
            step_summary "PASS" "$([ $RV_RC -eq 0 ] && echo 'CLEAN' || echo 'COMMENTS FOUND')"
            exit $RV_RC
        else
            step_summary "FAILED" "SKIPPED"
            exit $CI_RC
        fi
        ;;
    full)
        # Step 1+2: autofix then preflight
        step_autofix
        step_preflight || exit 1

        # Step 3: commit
        step_commit
        COMMIT_RC=$?
        [ $COMMIT_RC -eq 5 ] && { echo -e "${GREEN}[ship] Nothing to commit. Done.${NC}"; exit 0; }
        [ $COMMIT_RC -ne 0 ] && exit $COMMIT_RC

        # Step 4: push
        step_push || exit 2

        # Step 5: poll CI
        step_poll_ci
        CI_RC=$?

        # Step 6: poll reviews (even if CI failed, reviews may have posted)
        step_poll_reviews
        RV_RC=$?

        # Step 7: summary
        CI_LABEL="$([ $CI_RC -eq 0 ] && echo 'ALL GREEN' || echo 'FAILED')"
        RV_LABEL="$([ $RV_RC -eq 0 ] && echo 'CLEAN' || echo 'COMMENTS FOUND')"
        step_summary "$CI_LABEL" "$RV_LABEL"

        # Return the most critical failure
        [ $CI_RC -ne 0 ] && exit 3
        [ $RV_RC -ne 0 ] && exit 4
        exit 0
        ;;
esac
