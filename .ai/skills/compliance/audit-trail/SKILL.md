---
name: audit-trail
description: Provides audit trail format and documentation requirements for regulatory compliance. Use when creating audit logs, recording system changes, documenting decisions, or maintaining traceability. Ensures ALCOA+ compliant records with proper attribution, timestamps, and change history. Required for pharmaceutical and regulated industry documentation.
argument-hint: Describe the audit entry to document
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## Audit Trail Format

Standard format for regulatory-compliant audit records in `.ai/session-ledger.md`.

### Required Fields

Every audit trail entry MUST include:

| Field | Description | Example |
|-------|-------------|---------|
| `timestamp` | ISO 8601 format, UTC, system-generated | `2026-01-15T14:30:00Z` |
| `actor` | Who performed the action | Agent: Planner \| User: architect@your-org.com |
| `action` | What was done | `created`, `modified`, `approved`, `deployed` |
| `target` | What was affected | `ADR-011`, `src/api/handler.ts` |
| `previous_value` | Before state (if modified) | Original content or `null` |
| `new_value` | After state | New content or summary |
| `reason` | Why the change was made | Business/technical justification |

### Session Ledger Format

For session ledger entries in `.ai/session-ledger.md`:

```markdown
## [2026-01-15T14:30:00Z] | Agent: Planner | Phase: plan | Story: PROJ-NNN
Decision: Use repository pattern for data access layer
Rationale: Decouples business logic from persistence (ADR-007)
Files affected: src/repos/, src/services/
Cost: ~0.12 USD | Tokens: 4,200 in / 1,800 out | Model: strongest
```

### Change Documentation Rules

1. **Never Overwrite** - Append new entries, preserve history
2. **Always Attribute** - Every entry must identify the actor (agent + user)
3. **Always Timestamp** - Use system-generated time, never LLM-generated dates
4. **Always Justify** - Include reason for significant changes
5. **Always Link** - Reference related ADRs, stories, or previous sessions

### Traceability Requirements

Audit trails must maintain traceability:

- **Requirement → Design** - Link design decisions to JIRA stories or PRD
- **Design → Implementation** - Link code changes to plan (agent-exchange/planner-output.md)
- **Implementation → Test** - Link test cases to implementation (coverage report)
- **Test → Validation** - Link E2E verification to feature completion
- **Decision → ADR** - Link architectural decisions to ADR files

### Retention Requirements

- Retain session-ledger.md indefinitely (git-committed, never deleted)
- Ensure records remain accessible and readable (markdown format)
- Protect against unauthorized modification (git history + RBAC)
- Maintain backup copies (GitHub remote)

## Usage

When creating audit entries:
1. Get current timestamp: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
2. Identify actor: agent name + `git config user.email`
3. Append to `.ai/session-ledger.md` (never overwrite existing entries)
4. Commit with conventional format: `chore(audit): add session entry for STORY-123`
