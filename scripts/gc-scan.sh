#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# GARBAGE COLLECTION SCAN — Entropy Management
# Harness Engineering Principle H5: "Entropy management is garbage collection"
#
# Usage: scripts/gc-scan.sh [--fix]
#   Default: scan only (report deviations)
#   --fix:   auto-fix simple violations
#
# Run on a regular cadence (weekly recommended).
# Each golden principle here should ideally also be a lint rule.
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

FIX=false
[ "${1:-}" = "--fix" ] && FIX=true
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ISSUES=0

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "═══ Garbage Collection Scan — $TIMESTAMP ═══"
echo ""

# ── GP: No TODO/FIXME/HACK without issue link ────────────────────────────
echo "Scanning for unlinked TODOs..."
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.py" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . 2>/dev/null | grep -v "node_modules" | grep -v ".ai/" | grep -v "#.*http" || true)
TODO_COUNT=$(echo "$TODOS" | grep -c "." 2>/dev/null || echo "0")
if [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "  ${YELLOW}WARN${NC}: $TODO_COUNT unlinked TODO/FIXME/HACK markers"
    ISSUES=$((ISSUES + TODO_COUNT))
fi

# ── GP: No console.log / print() in production code ──────────────────────
echo "Scanning for debug statements..."
DEBUG=$(grep -rn "console\.log\|print(" --include="*.py" --include="*.js" --include="*.ts" . 2>/dev/null | grep -v "node_modules" | grep -v "test" | grep -v ".ai/" | grep -v "scripts/" || true)
DEBUG_COUNT=$(echo "$DEBUG" | grep -c "." 2>/dev/null || echo "0")
if [ "$DEBUG_COUNT" -gt 0 ]; then
    echo -e "  ${YELLOW}WARN${NC}: $DEBUG_COUNT debug statements in production code"
    ISSUES=$((ISSUES + DEBUG_COUNT))
fi

# ── GP: No files over 500 lines (complexity signal) ──────────────────────
echo "Scanning for oversized files..."
LARGE=$(find . -name "*.py" -o -name "*.js" -o -name "*.ts" | grep -v "node_modules" | grep -v ".ai/" | while read f; do
    lines=$(wc -l < "$f" 2>/dev/null || echo "0")
    [ "$lines" -gt 500 ] && echo "$f ($lines lines)"
done || true)
LARGE_COUNT=$(echo "$LARGE" | grep -c "." 2>/dev/null || echo "0")
if [ "$LARGE_COUNT" -gt 0 ]; then
    echo -e "  ${YELLOW}WARN${NC}: $LARGE_COUNT files over 500 lines"
    ISSUES=$((ISSUES + LARGE_COUNT))
fi

# ── GP: Stale agent artifacts ────────────────────────────────────────────
echo "Scanning for stale artifacts..."
STALE_EXCHANGE=$(find .ai/agent-exchange -name "*.md" -mtime +7 2>/dev/null | wc -l | tr -d ' ')
STALE_TRACES=$(find .ai/traces -name "*.md" -mtime +30 -not -path "*/archive/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$STALE_EXCHANGE" -gt 0 ] || [ "$STALE_TRACES" -gt 0 ]; then
    echo -e "  ${YELLOW}WARN${NC}: $STALE_EXCHANGE stale exchanges, $STALE_TRACES old traces"
    ISSUES=$((ISSUES + STALE_EXCHANGE + STALE_TRACES))
    if [ "$FIX" = true ]; then
        find .ai/agent-exchange -name "*.md" -mtime +7 -delete 2>/dev/null || true
        mkdir -p .ai/traces/archive
        find .ai/traces -name "*.md" -mtime +30 -not -path "*/archive/*" -exec mv {} .ai/traces/archive/ \; 2>/dev/null || true
        echo -e "  ${GREEN}FIXED${NC}: Cleaned stale artifacts"
    fi
fi

# ── Report ────────────────────────────────────────────────────────────────
echo ""
if [ "$ISSUES" -eq 0 ]; then
    echo -e "${GREEN}GC SCAN: Clean — 0 issues found${NC}"
else
    echo -e "${YELLOW}GC SCAN: $ISSUES issues found${NC}"
    [ "$FIX" = false ] && echo "Run with --fix to auto-fix applicable issues"
fi

# Update quality grade
GRADE="A"
[ "$ISSUES" -gt 5 ] && GRADE="B"
[ "$ISSUES" -gt 15 ] && GRADE="C"
[ "$ISSUES" -gt 30 ] && GRADE="D"
echo ""
echo "Quality Grade: $GRADE ($ISSUES issues)"
