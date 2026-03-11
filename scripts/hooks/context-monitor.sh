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

OFFSET_REASON=""
if [ "$EVENT_COUNT" -gt 100 ]; then
    echo "[CONTEXT WARNING] Event history is growing. Consider '/compact' and 'agentic-sdlc resume'."
    OFFSET_REASON="event-pressure"
fi

if [ "$DIAG_COUNT" -gt 10 ]; then
    echo "[CONTEXT WARNING] Debug diagnostics are piling up. Create a trace summary and checkpoint."
    OFFSET_REASON="${OFFSET_REASON:-diagnostic-pressure}"
fi

if [ "$OPEN_APPROVALS" -gt 0 ]; then
    echo "[CONTEXT WARNING] There are pending approvals blocking progress."
fi

if [ -n "$OFFSET_REASON" ]; then
    python3 - <<'PY' "$INDEX" "$EVENTS" "$OFFSET_REASON" "$EVENT_COUNT" "$DIAG_COUNT"
import json
import os
import sys
from datetime import datetime, timezone

index_path, events_path, reason, event_count, diag_count = sys.argv[1:6]
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

with open(index_path) as fh:
    index = json.load(fh)

execution = index.setdefault("execution", {})
sprint = execution.setdefault("sprint", {})
sprint["status"] = "offset-recommended"
sprint["offset_count"] = int(sprint.get("offset_count", 0)) + 1
sprint["last_evaluated_at"] = now
execution["current_mode"] = "resume"
execution["offset_cursor"] = {
    "event_id": None,
    "trace_id": index.get("current_trace_id"),
    "plan_id": index.get("current_plan_id"),
    "session_id": index.get("current_session_id"),
    "reason": reason,
    "council_verdict": "recommended",
    "created_at": now,
}
index["updated_at"] = now

with open(index_path, "w") as fh:
    json.dump(index, fh, indent=2)
    fh.write("\n")

event = {
    "id": f"evt_offset_{int(datetime.now(timezone.utc).timestamp())}",
    "type": "execution.offset.recommended",
    "actor": "context-monitor",
    "source": "hook",
    "severity": "warning",
    "session_id": index.get("current_session_id"),
    "plan_id": index.get("current_plan_id"),
    "trace_id": index.get("current_trace_id"),
    "message": f"Offset recommended due to {reason}",
    "payload": {
        "reason": reason,
        "event_count": int(event_count),
        "diagnostic_count": int(diag_count),
    },
    "created_at": now,
}

with open(events_path, "a") as fh:
    fh.write(json.dumps(event) + "\n")

index.setdefault("counters", {})
index["counters"]["events"] = int(index["counters"].get("events", 0)) + 1

with open(index_path, "w") as fh:
    json.dump(index, fh, indent=2)
    fh.write("\n")
PY
    echo "[CONTEXT ACTION] Offset recommendation persisted. Review with council, then resume from structured state."
fi

exit 0
