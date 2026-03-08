#!/bin/bash
# Emergency Checkpoint - Pre-context-reset checkpoint creation
# Purpose: Create emergency checkpoint before context window reset
# Usage: Run manually before closing IDE or when context is near limit

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
USER_EMAIL=$(git config user.email 2>/dev/null || echo "unknown@local")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Files to update
LEDGER=".ai/session-ledger.md"
NOW_FILE=".ai/NOW.md"

echo "[EMERGENCY CHECKPOINT] Creating checkpoint before context reset..."

# Step 1: Write checkpoint entry to session ledger
if [ -f "$LEDGER" ]; then
    {
        echo "## [$TIMESTAMP] | Agent: Checkpoint | Phase: emergency | Story: N/A"
        echo "Decision: Emergency checkpoint created before context reset"
        echo "Rationale: Preserving session state for recovery after context compaction"
        echo "Files affected: .ai/NOW.md, .ai/session-ledger.md"
        echo "Cost: ~0.00 USD | Tokens: 0 in / 0 out | Model: N/A"
        echo "Context: User: $USER_EMAIL | Branch: $BRANCH"
        echo ""
    } >> "$LEDGER"
    echo "✓ Checkpoint logged to session ledger"
fi

# Step 2: Update NOW.md with current state
if [ -f "$NOW_FILE" ]; then
    # Read last 5 session ledger entries for context
    RECENT_WORK=$(grep -A 5 "^## \[" "$LEDGER" 2>/dev/null | tail -30 || echo "No recent work")
    
    # Append emergency note to NOW.md
    {
        echo ""
        echo "---"
        echo "## Emergency Checkpoint: $TIMESTAMP"
        echo ""
        echo "**Reason**: Context reset imminent"
        echo "**Branch**: $BRANCH"
        echo "**User**: $USER_EMAIL"
        echo ""
        echo "**Recent Work** (last 5 entries):"
        echo "\`\`\`"
        echo "$RECENT_WORK"
        echo "\`\`\`"
        echo ""
        echo "**Recovery Instructions**:"
        echo "1. Read this NOW.md file"
        echo "2. Read last 10 entries in .ai/session-ledger.md"
        echo "3. Review recent ADRs in .ai/decisions/architecture-decisions.md"
        echo "4. Continue from last checkpoint"
    } >> "$NOW_FILE"
    echo "✓ Emergency checkpoint saved to NOW.md"
else
    echo "⚠ NOW.md not found, checkpoint incomplete"
fi

echo "[CHECKPOINT] Emergency checkpoint complete. Safe to reset context."
