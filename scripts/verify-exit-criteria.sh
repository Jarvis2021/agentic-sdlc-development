#!/usr/bin/env bash
set -euo pipefail
# EXIT Criteria Verification -- run before every release
PASS=0; FAIL=0

check() {
    local name="$1"; shift
    if "$@" 2>/dev/null; then
        echo "  PASS: $name"; PASS=$((PASS + 1))
    else
        echo "  FAIL: $name"; FAIL=$((FAIL + 1))
    fi
}

echo "=== EXIT CRITERIA VERIFICATION ==="
check "All tests pass" npm test
check "Coverage >= 95%" bash -c 'npm run test:coverage 2>&1 | grep -q "All files" || exit 1'
check "AGENTS.md exists" test -f AGENTS.md
check "Context index valid" test -f .ai/context-index.yaml
check "Preflight script executable" test -x scripts/preflight.sh
check "No stale agent-exchange (>7 days)" bash -c '[ $(find .ai/agent-exchange -name "*.md" -mtime +7 2>/dev/null | wc -l) -eq 0 ]'
check "CHANGELOG updated" bash -c 'head -5 CHANGELOG.md | grep -q "$(date +%Y)" 2>/dev/null'
check "ADRs documented" bash -c '[ $(grep -c "^## ADR-" docs/decisions/architecture-decisions.md 2>/dev/null) -ge 10 ]'

echo ""
if [ "$FAIL" -eq 0 ]; then
    echo "EXIT CRITERIA: ALL $PASS PASSED -- release ready"
    exit 0
else
    echo "EXIT CRITERIA: $FAIL FAILED, $PASS PASSED -- NOT ready for release"
    exit 1
fi
