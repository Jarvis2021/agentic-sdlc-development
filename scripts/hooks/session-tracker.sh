#!/bin/bash
# Session Tracker - Manual session start/end logging
# Purpose: Log session starts to .ai/session-ledger.md for ALCOA+ compliance
# Usage: Run manually at session start, or integrate into IDE startup scripts

# Get current timestamp (system-generated, not LLM)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get user email from git config
USER_EMAIL=$(git config user.email 2>/dev/null || echo "unknown@local")

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Session ledger file
LEDGER=".ai/session-ledger.md"

# Create ledger if it doesn't exist
if [ ! -f "$LEDGER" ]; then
    echo "# Session Ledger" > "$LEDGER"
    echo "" >> "$LEDGER"
    echo "ALCOA+ compliant audit trail of all agent sessions." >> "$LEDGER"
    echo "" >> "$LEDGER"
fi

# Append session start entry
{
    echo "## [$TIMESTAMP] | Agent: SessionStart | Phase: init | Story: N/A"
    echo "Decision: Session started by $USER_EMAIL on branch $BRANCH"
    echo "Rationale: Manual session tracking for ALCOA+ compliance"
    echo "Files affected: [none yet]"
    echo "Cost: ~0.00 USD | Tokens: 0 in / 0 out | Model: N/A"
    echo ""
} >> "$LEDGER"

echo "[SESSION] Session start logged to $LEDGER"
