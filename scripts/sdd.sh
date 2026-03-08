#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# SDD CLI — Spec-Driven Development helper
# Usage: scripts/sdd.sh <command> <slug> [options]
#
# Commands:
#   new <slug>        Create new spec from template
#   plan <slug>       Create plan from approved spec
#   status [slug]     Show pipeline status
#   trace <slug>      Show task trace
#   budget [slug]     Show token usage for task
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

CMD="${1:-help}"
SLUG="${2:-}"

case "$CMD" in
    new)
        [ -z "$SLUG" ] && { echo "Usage: sdd.sh new <slug>"; exit 1; }
        SPEC=".ai/specs/${SLUG}-spec.md"
        if [ -f "$SPEC" ]; then
            echo "Spec already exists: $SPEC"
            exit 1
        fi
        mkdir -p .ai/specs
        sed -e "s/{{SLUG}}/$SLUG/g" \
            -e "s/{{DATE}}/$(date -u +%Y-%m-%d)/g" \
            -e "s/{{AUTHOR}}/$(git config user.name 2>/dev/null || echo 'unknown')/g" \
            -e "s/{{CLASSIFICATION}}/MEDIUM/g" \
            -e "s/{{ISSUE_URL}}/TODO/g" \
            .ai/templates/spec-template.md > "$SPEC"
        echo "Created: $SPEC"
        ;;
    plan)
        [ -z "$SLUG" ] && { echo "Usage: sdd.sh plan <slug>"; exit 1; }
        SPEC=".ai/specs/${SLUG}-spec.md"
        PLAN=".ai/plans/${SLUG}-plan.md"
        if [ ! -f "$SPEC" ]; then
            echo "Spec not found: $SPEC — run 'sdd.sh new $SLUG' first"
            exit 1
        fi
        if [ -f "$PLAN" ]; then
            echo "Plan already exists: $PLAN"
            exit 1
        fi
        mkdir -p .ai/plans
        sed -e "s/{{SLUG}}/$SLUG/g" \
            -e "s/{{DATE}}/$(date -u +%Y-%m-%d)/g" \
            -e "s/{{CLASSIFICATION}}/MEDIUM/g" \
            -e "s/{{TOKEN_BUDGET}}/80000/g" \
            .ai/templates/plan-template.md > "$PLAN"
        echo "Created: $PLAN"
        ;;
    status)
        echo "═══ SDD Pipeline Status ═══"
        echo ""
        echo "Specs:"
        ls -1 .ai/specs/*.md 2>/dev/null || echo "  (none)"
        echo ""
        echo "Plans:"
        ls -1 .ai/plans/*.md 2>/dev/null || echo "  (none)"
        echo ""
        echo "Tasks:"
        ls -1 .ai/tasks/*.md 2>/dev/null || echo "  (none)"
        echo ""
        echo "Active Traces:"
        grep -l "IN_PROGRESS" .ai/traces/*.md 2>/dev/null || echo "  (none)"
        ;;
    trace)
        [ -z "$SLUG" ] && { echo "Usage: sdd.sh trace <slug>"; exit 1; }
        cat ".ai/traces/${SLUG}-trace.md" 2>/dev/null || echo "No trace found for: $SLUG"
        ;;
    budget)
        echo "═══ Token Usage ═══"
        if [ -n "$SLUG" ]; then
            grep "$SLUG" .ai/token-logs/*.jsonl 2>/dev/null || echo "No usage data for: $SLUG"
        else
            echo "Today:"
            cat ".ai/token-logs/$(date -u +%Y-%m-%d).jsonl" 2>/dev/null || echo "  No usage today"
        fi
        ;;
    help|*)
        echo "SDD CLI — Spec-Driven Development"
        echo ""
        echo "Usage: scripts/sdd.sh <command> <slug>"
        echo ""
        echo "Commands:"
        echo "  new <slug>     Create spec from template"
        echo "  plan <slug>    Create plan from spec"
        echo "  status         Show pipeline status"
        echo "  trace <slug>   Show task trace"
        echo "  budget [slug]  Show token usage"
        ;;
esac
