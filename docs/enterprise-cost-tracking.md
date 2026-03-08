# Enterprise Cost Tracking Guide

**Version**: 1.0.0
**Scope**: Manual session ledger cost tracking for Agentic SDLC Framework
**Status**: Production (v1.0)
**Last Updated**: March 3, 2026

---

## Overview

The Agentic SDLC Framework tracks agent costs, tokens, and model usage through the **Session Ledger** (`.ai/session-ledger.md`). This approach is IDE-agnostic and works across any development environment.

Unlike automated telemetry systems, our framework uses **manual logging** — agents and users append cost data to the session ledger after each significant phase or task completion.

---

## Session Ledger Cost Format

Each session ledger entry follows this format:

```markdown
## [TIMESTAMP] | Agent: [AGENT_NAME] | Phase: [PHASE] | Story: [STORY_ID]
Decision: [WHAT_WAS_DONE]
Rationale: [WHY_IT_WAS_DONE]
Files affected: [LIST_OF_FILES]
Cost: ~[USD] | Tokens: [INPUT] in / [OUTPUT] out | Model: [MODEL_NAME]
```

### Cost Fields

| Field | Description | Example |
|-------|-------------|---------|
| `Cost` | Estimated cost in USD (manual entry) | `~0.12 USD` |
| `Tokens` | Token breakdown (input/output) | `4,200 in / 1,800 out` |
| `Model` | Model used for this session | `strongest`, `fast` |

### Why Manual?

- **IDE-agnostic**: Works on any AGENTS.md-compatible IDE
- **No infrastructure**: No OTel collector, no API keys, no cloud dependencies
- **ALCOA+ compliant**: Manual entries are "Attributable" (user email), "Contemporaneous" (timestamped), "Accurate" (user-verified)
- **Audit-ready**: Session ledger is git-committed, providing immutable history

---

## Per-Agent Cost Attribution

Cost data is attributed to specific agents (Planner, Implementer, Reviewer, etc.) via the `Agent:` field in session ledger entries.

### Example: Planner Phase

```markdown
## [2026-03-03T10:30:00Z] | Agent: Planner | Phase: plan | Story: PROJ-NNN
Decision: Created technical plan for authentication module
Rationale: ADR-011 specifies JWT-based auth with refresh tokens
Files affected: .ai/agent-exchange/planner-output.md, .ai/decisions/architecture-decisions.md
Cost: ~0.08 USD | Tokens: 2500 in / 1200 out | Model: fast
```

### Example: Implementer Phase

```markdown
## [2026-03-03T11:15:00Z] | Agent: Implementer | Phase: implement | Story: PROJ-NNN
Decision: Implemented JWT authentication module
Rationale: Planner output, ADR-011, test-first approach
Files affected: src/auth/jwt.ts, src/auth/refresh.ts, tests/auth/jwt.test.ts
Cost: ~0.25 USD | Tokens: 8500 in / 3200 out | Model: strongest
```

---

## Per-Story Cost Aggregation

To calculate total cost per story, sum all session ledger entries for that story:

```bash
# Extract all cost entries for story PROJ-NNN
rg "Story: PROJ-NNN" .ai/session-ledger.md -A 4 | rg "Cost:" | awk -F'~' '{print $2}' | awk '{print $1}' | paste -sd+ | bc

# Output: 0.33
```

### Manual Cost Tracking Spreadsheet

For teams preferring spreadsheets, export session ledger data to CSV:

```bash
# Extract story, agent, cost, tokens, model
rg "^## \[" .ai/session-ledger.md -A 4 | \
  rg "(Story:|Cost:|Model:)" | \
  paste -d '|' - - - | \
  sed 's/^## \[\(.*\)\] | Agent: \(.*\) | Phase: \(.*\) | Story: \(.*\)|\(.*\)Cost: \(.*\)|\(.*\)Model: \(.*\)/\1,\2,\3,\4,\6,\8/' \
  > session-costs.csv
```

CSV columns: `Timestamp,Agent,Phase,Story,Cost,Model`

---

## Pricing Reference (Manual Estimation)

For manual cost entry, refer to your model provider's pricing (as of March 2026):

### Model Pricing Table

| Model Tier | Input (per 1M tokens) | Output (per 1M tokens) |
|-----------|--------------------|---------------------|
| Strongest | $5.00 | $25.00 |
| Fast | $3.00 | $15.00 |
| Fastest | $1.00 | $5.00 |

### Cost Calculation Example

For a session with:
- **Input**: 8,500 tokens
- **Output**: 3,200 tokens
- **Model**: strongest

Cost = (8.5 × $5.00 / 1000) + (3.2 × $25.00 / 1000) = **$0.0425 + $0.0800 = $0.1225 ≈ $0.12 USD**

---

## RBAC and Cost Visibility

Session ledger entries include the agent name and user email (from git config), providing **role-based cost attribution**:

```markdown
## [2026-03-03T10:30:00Z] | Agent: Planner | Phase: plan | Story: PROJ-NNN
Decision: Created technical plan for authentication module
Rationale: User: engineer@your-org.com
...
```

RBAC roles (from `rbac-factbook.yaml`) determine which agents a user can invoke, indirectly controlling cost exposure.

---

## Session Ledger ALCOA+ Compliance

Session ledger cost entries satisfy ALCOA+ principles:

| Principle | How Session Ledger Satisfies |
|-----------|------------------------------|
| **Attributable** | User email (from git config) + agent name |
| **Legible** | Markdown format, human-readable |
| **Contemporaneous** | System-generated timestamps (not LLM) |
| **Original** | Append-only (never edited) |
| **Accurate** | User-verified cost estimates or API-reported |
| **Complete** | All fields populated (agent, phase, story, cost) |
| **Consistent** | Standard format enforced by protocol |
| **Enduring** | Git-committed, persists forever |
| **Available** | In-repo, searchable via grep/rg |

---

## Future Enhancements (v1.1+)

Planned for future releases:

1. **Automated Telemetry** (v1.1):
   - Git hooks auto-append session ledger entries on command completion
   - Cost calculation via API usage reports

2. **OpenTelemetry Integration** (v1.2):
   - OTel metrics export for enterprise dashboards
   - Per-agent cost attribution via `OTEL_RESOURCE_ATTRIBUTES`

3. **Dashboard UI** (v1.3):
   - Web dashboard for session ledger visualization
   - Per-story cost graphs, per-agent breakdown

---

## References

- [Session Ledger Format](.ai/session-ledger.md) — Template and examples
- [ALCOA+ Compliance Skill](.ai/skills/compliance/alcoa-plus/SKILL.md) — ALCOA+ principles
- [Audit Trail Skill](.ai/skills/compliance/audit-trail/SKILL.md) — Audit trail requirements
- Model provider pricing documentation — refer to your IDE's cost calculator
