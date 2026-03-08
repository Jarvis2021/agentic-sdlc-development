#!/usr/bin/env bash
# Log token usage for a task
# Usage: log-tokens.sh <slug> <input_tokens> <output_tokens> <model>
set -euo pipefail

SLUG="${1:-unknown}"
INPUT="${2:-0}"
OUTPUT="${3:-0}"
MODEL="${4:-unknown}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TOTAL=$((INPUT + OUTPUT))
# Output tokens cost ~4x input (industry standard)
EFFECTIVE_COST=$((INPUT + OUTPUT * 4))

LOG_DIR=".ai/token-logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/$(date -u +%Y-%m-%d).jsonl"
echo "{\"ts\":\"$TIMESTAMP\",\"slug\":\"$SLUG\",\"input\":$INPUT,\"output\":$OUTPUT,\"total\":$TOTAL,\"effective_cost\":$EFFECTIVE_COST,\"model\":\"$MODEL\"}" >> "$LOG_FILE"

# Alert if over threshold
THRESHOLD=150000
if [ "$TOTAL" -gt "$THRESHOLD" ]; then
    echo "[token-alert] Task $SLUG exceeded threshold: $TOTAL > $THRESHOLD tokens"
fi
