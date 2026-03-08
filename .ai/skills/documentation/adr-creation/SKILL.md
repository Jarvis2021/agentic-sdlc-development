---
name: adr-creation
description: Provides Architecture Decision Record format and creation guidelines following the Nygard format. Use when documenting architecture decisions, recording technical choices, or creating decision records. Contains ADR template with Context, Decision, Consequences, and Alternatives sections. Required for technical planning and architecture documentation.
argument-hint: Describe the architectural decision to document
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## ADR Format (Nygard Style)

Architecture Decision Records document significant technical decisions.

### ADR Template

```markdown
## ADR-[NUMBER]: [Title]

**Date**: [ISO 8601 timestamp]
**Decision Maker**: [email from rbac-factbook.yaml]
**Phase**: [plan | implement | review | test | release]
**Status**: [Proposed | Accepted | Rejected | Superseded]

### Context

[What is the issue that we're seeing that is motivating this decision?]

### Decision

[What is the change that we're proposing and/or doing?]

### Consequences

[What becomes easier or more difficult to do because of this change?]

### Alternatives Considered

[What other options were evaluated? Why were they rejected?]
```

### ADR Numbering Convention

- Format: `ADR-001`, `ADR-002`, etc.
- Sequential numbering (find highest number in `architecture-decisions.md`, increment by 1)
- Never reuse numbers (even if ADR is rejected)
- Superseded ADRs retain their number

### ADR Status Flow

```
Proposed → Accepted → [Superseded by ADR-XXX]
         ↘ Rejected
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion, not yet decided |
| **Accepted** | Decision made, to be implemented |
| **Rejected** | Considered but not adopted |
| **Superseded** | Replaced by newer decision (reference new ADR number) |

### Architecture Freeze Rules

From `.ai/protocols/architecture-freeze.md`:

1. **ADRs become immutable after acceptance** - No modifications without architect approval
2. **New decisions require new ADRs** - Cannot modify accepted ADRs inline
3. **Supersession required for changes** - Create new ADR that supersedes old one

### Required Sections

Every ADR MUST include:

- ✅ **Context** - Why is this decision needed? What problem are we solving?
- ✅ **Decision** - What is the decision? Be specific and unambiguous.
- ✅ **Consequences** - What are the impacts? (positive and negative)
- ✅ **Alternatives** - What else was considered? Why were they rejected?

### Where ADRs Are Stored

All ADRs are appended to a single file:
```
.ai/decisions/architecture-decisions.md
```

Never create separate ADR files. Append to the single markdown file for easy grep and review.

### When to Create an ADR

Create an ADR for:
- ✅ Technology stack decisions (framework, database, language)
- ✅ Architectural patterns (REST vs GraphQL, monolith vs microservices)
- ✅ Data model changes (schema, relationships)
- ✅ Security/compliance decisions (auth mechanism, encryption)
- ✅ Significant refactorings (breaking changes, API redesign)

Do NOT create ADRs for:
- ❌ Trivial implementation details (variable names, formatting)
- ❌ Bug fixes (unless they require architectural change)
- ❌ Documentation updates

### Session Ledger Entry for ADR Creation

When creating an ADR, log to `.ai/session-ledger.md`:

```markdown
## [2026-01-15T09:00:00Z] | Agent: Planner | Phase: plan | Story: PROJ-NNN
Decision: Created ADR-011 for database selection
Rationale: Chose PostgreSQL over MongoDB for structured domain-specific data and ACID compliance
Files affected: .ai/decisions/architecture-decisions.md
Cost: ~0.05 USD | Tokens: 1500 in / 800 out | Model: strongest
```

### Official References

- [Michael Nygard - Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original ADR format
- [ADR GitHub Organization](https://adr.github.io/) - Templates and tools
- [AWS Architecture Decision Records](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/) - AWS guidance
