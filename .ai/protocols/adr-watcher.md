# ADR-Watcher Protocol — Architecture Decision Records

Creates and monitors Architecture Decision Records.

## Trigger (AUTOMATIC)
- Structural changes detected (new module, pattern change, dependency addition)
- After merge with structural changes
- User says "decisions", "adr"

## ADR Format

```
# ADR-NNN: [Title]

## Status: [Proposed | Accepted | Deprecated | Superseded by ADR-NNN]

## Context
[Why this decision is needed]

## Decision
[What we decided]

## Consequences
[What happens because of this decision]

## Date: [YYYY-MM-DD]
## Author: [from rbac-factbook.yaml]
```

## Process

### Step 1: Detect
- Compare current changes against existing architecture
- Identify structural deviations

### Step 2: Create ADR
- Auto-number (ADR-001, ADR-002, ...)
- Write to .ai/decisions/ADR-NNN-title.md
- Link to affected files in knowledge graph

### Step 3: Validate
- Check against architecture freeze
- If frozen: BLOCK and require architect unfreeze

## Output
Write to .ai/decisions/ADR-NNN-*.md

## Rules
- ADRs are permanent (never deleted, only superseded)
- Every structural decision needs an ADR
- Architecture freeze violations → BLOCK
- Number ADRs sequentially
