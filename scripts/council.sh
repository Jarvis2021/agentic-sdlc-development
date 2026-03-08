#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# REVIEW COUNCIL — 3-reviewer verification gate
# Usage: scripts/council.sh <slug> [--external <comment>]
#
# Reviewers:
#   1. Correctness — is the change functionally correct?
#   2. Standards — does it match project patterns?
#   3. Security — does it expose PII/PII, break idempotency, alter data paths?
#
# Verdicts:
#   COUNCIL-VALIDATES — implement
#   COUNCIL-REJECTS — decline with explanation
#   COUNCIL-MODIFIES — implement council's version instead
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

SLUG="${1:-}"
EXTERNAL="${3:-}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

[ -z "$SLUG" ] && { echo "Usage: council.sh <slug> [--external <comment>]"; exit 1; }

OUTPUT=".ai/agent-exchange/reviewer-output.md"
mkdir -p .ai/agent-exchange

{
    echo "# Council Review: $SLUG"
    echo "- Timestamp: $TIMESTAMP"
    echo "- Type: $([ -n "$EXTERNAL" ] && echo 'External Review Challenge' || echo 'Post-Implementation Review')"
    [ -n "$EXTERNAL" ] && echo "- External Comment: $EXTERNAL"
    echo ""
    echo "## Verdicts"
    echo ""
    echo "### 1. Correctness Reviewer"
    echo "- Verdict: PENDING"
    echo "- Evidence: "
    echo ""
    echo "### 2. Standards Reviewer"
    echo "- Verdict: PENDING"
    echo "- Evidence: "
    echo ""
    echo "### 3. Security Reviewer"
    echo "- Verdict: PENDING"
    echo "- Evidence: "
    echo ""
    echo "## Final Verdict: PENDING"
    echo ""
    echo "## MUST-FIX Items"
    echo "- (none yet)"
} > "$OUTPUT"

echo "[council] Review template created: $OUTPUT"
echo "[council] Fill in verdicts, then update Final Verdict to VALIDATES/REJECTS/MODIFIES"
