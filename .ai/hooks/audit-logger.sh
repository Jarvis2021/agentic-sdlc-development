#!/usr/bin/env bash
# JSONL Audit Logger -- machine-parseable trail
# Usage: audit-logger.sh <agent> <action> <slug> [verdict] [tokens]
set -euo pipefail

AGENT="${1:-unknown}"
ACTION="${2:-unknown}"
SLUG="${3:-unclassified}"
VERDICT="${4:-}"
TOKENS="${5:-0}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
USER=$(git config user.name 2>/dev/null || echo "unknown")
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

LOG_DIR=".ai/audit-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date -u +%Y-%m-%d).jsonl"

echo "{\"ts\":\"$TIMESTAMP\",\"agent\":\"$AGENT\",\"action\":\"$ACTION\",\"slug\":\"$SLUG\",\"verdict\":\"$VERDICT\",\"tokens\":$TOKENS,\"user\":\"$USER\",\"branch\":\"$BRANCH\"}" >> "$LOG_FILE"
