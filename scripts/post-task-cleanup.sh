#!/usr/bin/env bash
# Post-task cleanup — called by Claude Code Stop hook
set -euo pipefail
SLUG="${1:-}"; TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[cleanup] Post-task cleanup — $TS"

# Clear build caches
for d in node_modules/.cache .next/cache .nuxt/.cache .turbo .parcel-cache .vite dist/.cache; do
    [ -d "$d" ] && rm -rf "$d" && echo "  ✓ $d"
done

# Clear Python caches
find . -maxdepth 4 -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -maxdepth 4 -name "*.pyc" -delete 2>/dev/null || true
rm -rf .pytest_cache .mypy_cache .ruff_cache 2>/dev/null || true

# Clear stale agent exchange (>7 days)
find .ai/agent-exchange -name "*.md" -mtime +7 -delete 2>/dev/null || true
find .ai/token-logs -name "*.jsonl" -empty -delete 2>/dev/null || true

# Archive old completed traces
mkdir -p .ai/traces/archive
for t in .ai/traces/*.md; do
    [ -f "$t" ] || continue
    grep -q "Status: COMPLETE" "$t" 2>/dev/null && [ "$(find "$t" -mtime +30 2>/dev/null)" ] && mv "$t" .ai/traces/archive/
done

# Clean /tmp claude leftovers
find /tmp -maxdepth 1 -name "claude-*" -mmin +60 -exec rm -rf {} + 2>/dev/null || true

# Finalize trace
[ -n "$SLUG" ] && [ -f ".ai/traces/${SLUG}-trace.md" ] && {
    echo -e "\n## Completion\n- Completed: $TS\n- Cleanup: post-task-cleanup.sh" >> ".ai/traces/${SLUG}-trace.md"
}

echo "[cleanup] Done"
