#!/bin/bash
# Context Monitor - Session runtime telemetry
# Purpose: Warn when session/event/diagnostic pressure is high and prompt for checkpointing
# Usage: Run periodically during long sessions, or wire into host IDE automation

set -euo pipefail

ROOT_DIR="${1:-.}"
INDEX="$ROOT_DIR/.ai/session-state/index.json"
EVENTS="$ROOT_DIR/.ai/session-state/events.jsonl"
DIAG_DIR="$ROOT_DIR/.ai/session-state/diagnostics"
APPROVAL_DIR="$ROOT_DIR/.ai/session-state/approvals"

if [ ! -f "$INDEX" ]; then
    echo "[CONTEXT] Structured runtime not initialized yet."
    echo "Run: agentic-sdlc status $ROOT_DIR"
    exit 0
fi

CURRENT_SESSION=$(python3 - <<'PY' "$INDEX"
import json, sys
with open(sys.argv[1]) as fh:
    data = json.load(fh)
print(data.get("current_session_id") or "")
PY
)

EVENT_COUNT=0
if [ -f "$EVENTS" ]; then
    EVENT_COUNT=$(wc -l < "$EVENTS" | tr -d ' ')
fi

DIAG_COUNT=0
if [ -d "$DIAG_DIR" ]; then
    DIAG_COUNT=$(find "$DIAG_DIR" -name '*.json' | wc -l | tr -d ' ')
fi

OPEN_APPROVALS=0
if [ -d "$APPROVAL_DIR" ]; then
    OPEN_APPROVALS=$(python3 - <<'PY' "$APPROVAL_DIR"
import json, os, sys
count = 0
for name in os.listdir(sys.argv[1]):
    if not name.endswith(".json"):
        continue
    with open(os.path.join(sys.argv[1], name)) as fh:
        data = json.load(fh)
    if data.get("status") == "pending":
        count += 1
print(count)
PY
)
fi

echo "[CONTEXT] Current session: ${CURRENT_SESSION:-none}"
echo "[CONTEXT] Events: $EVENT_COUNT | Diagnostics: $DIAG_COUNT | Open approvals: $OPEN_APPROVALS"

if [ "$EVENT_COUNT" -gt 100 ]; then
    echo "[CONTEXT WARNING] Event history is growing. Consider '/compact' and 'agentic-sdlc resume'."
fi

if [ "$DIAG_COUNT" -gt 10 ]; then
    echo "[CONTEXT WARNING] Debug diagnostics are piling up. Create a trace summary and checkpoint."
fi

if [ "$OPEN_APPROVALS" -gt 0 ]; then
    echo "[CONTEXT WARNING] There are pending approvals blocking progress."
fi

exit 0
