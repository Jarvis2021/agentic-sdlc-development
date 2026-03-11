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
INDEX_FILE=".ai/session-state/index.json"
EVENTS_FILE=".ai/session-state/events.jsonl"

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

if [ -f "$INDEX_FILE" ]; then
    python3 - <<'PY' "$INDEX_FILE" "$EVENTS_FILE" "$TIMESTAMP"
import json
import os
import sys

index_path, events_path, timestamp = sys.argv[1:4]

with open(index_path) as fh:
    index = json.load(fh)

execution = index.setdefault("execution", {})
sprint = execution.setdefault("sprint", {})
sprint["status"] = "saved"
sprint["save_count"] = int(sprint.get("save_count", 0)) + 1
sprint["last_evaluated_at"] = timestamp

execution["last_save"] = {
    "reason": "emergency checkpoint",
    "source": "hook",
    "actor": "checkpoint",
    "mode_before_save": execution.get("current_mode", "sprint"),
    "created_at": timestamp,
}
execution["current_mode"] = "resume"
index["updated_at"] = timestamp

with open(index_path, "w") as fh:
    json.dump(index, fh, indent=2)
    fh.write("\n")

if os.path.exists(events_path):
    event = {
        "id": f"evt_save_{timestamp.replace(':', '').replace('-', '')}",
        "type": "execution.save",
        "actor": "checkpoint",
        "source": "hook",
        "severity": "info",
        "session_id": index.get("current_session_id"),
        "plan_id": index.get("current_plan_id"),
        "trace_id": index.get("current_trace_id"),
        "message": "Saved emergency checkpoint before context reset",
        "payload": {
            "reason": "emergency checkpoint",
            "mode_before_save": execution["last_save"]["mode_before_save"],
        },
        "created_at": timestamp,
    }
    with open(events_path, "a") as fh:
        fh.write(json.dumps(event) + "\n")
    index.setdefault("counters", {})
    index["counters"]["events"] = int(index["counters"].get("events", 0)) + 1
    with open(index_path, "w") as fh:
        json.dump(index, fh, indent=2)
        fh.write("\n")
PY
    echo "✓ Runtime checkpoint state saved to session-state/index.json"
fi

echo "[CHECKPOINT] Emergency checkpoint complete. Safe to reset context."
