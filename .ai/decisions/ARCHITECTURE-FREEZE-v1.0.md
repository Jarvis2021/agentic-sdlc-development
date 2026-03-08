# Architecture Freeze — Agentic SDLC Framework v1.0

**Frozen Date**: 2026-03-04
**Frozen By**: Platform Architecture Team
**Status**: ACTIVE

## Frozen Decisions

The following architectural decisions are FROZEN for v1.0. Changes require architect approval + ADR.

| # | Decision | ADR | What Is Frozen |
|---|----------|-----|---------------|
| 1 | AGENTS.md format | ADR-001 | File format, boot sequence, memory architecture |
| 2 | Bounded memory | ADR-002 | Token budgets, lazy-load strategy |
| 3 | Protocol structure | ADR-003 | .ai/protocols/ directory, trigger table |
| 4 | CI dependency audit | ADR-004 | GitHub Actions workflow, severity levels |
| 5 | RBAC separation | ADR-005 | rbac-factbook.yaml separate from factbook.yaml |
| 6 | Sensitive-data policy | ADR-006 | Configurable handling, WARN not BLOCK |
| 7 | Review Council | ADR-007 | 3-perspective review before PR |
| 8 | Session ledger | ADR-008 | Append-only, single file |
| 9 | E2E Stage 6 | ADR-009 | Runtime proof required |
| 10 | Vulnerability overlay | ADR-010 | Integrated into knowledge graph |

## What Is NOT Frozen

- Agent protocol content (protocols can be refined)
- domain-governance.yaml guardrail values (thresholds adjustable)
- project-config.yaml settings (team-configurable)
- README content (evolves with framework)
- CONTRIBUTING.md (process documentation)

## Unfreeze Process

1. Architect submits unfreeze request with justification
2. New ADR created documenting the change and rationale
3. Architecture freeze updated (this file)
4. Review Council approves the change
