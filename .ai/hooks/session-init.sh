#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# SESSION INIT — Load context based on task classification
# Called by agent hooks at session start
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

CLASSIFICATION="${1:-MEDIUM}"
SLUG="${2:-unclassified}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create trace file for this task
TRACE_FILE=".ai/traces/${SLUG}-trace.md"
mkdir -p .ai/traces
{
    echo "# Task Trace: $SLUG"
    echo "- Classification: $CLASSIFICATION"
    echo "- Started: $TIMESTAMP"
    echo "- Status: IN_PROGRESS"
    echo ""
    echo "## Actions"
} > "$TRACE_FILE"

# Log token budget
case "$CLASSIFICATION" in
    TRIVIAL) BUDGET=5000 ;;
    LOW)     BUDGET=20000 ;;
    MEDIUM)  BUDGET=80000 ;;
    HIGH)    BUDGET=200000 ;;
    *)       BUDGET=20000 ;;
esac

echo "- Token Budget: $BUDGET" >> "$TRACE_FILE"

# Report loaded context
echo "[session-init] Classification: $CLASSIFICATION | Budget: $BUDGET tokens | Slug: $SLUG"
