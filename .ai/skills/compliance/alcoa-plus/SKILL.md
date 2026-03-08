---
name: alcoa-plus
description: Applies ALCOA+ pharmaceutical compliance principles when creating audit trails, session ledger entries, documentation, or any records requiring regulatory compliance. Use for 21 CFR Part 11 adherence, GxP documentation, validation protocols, and audit-ready artifacts. Ensures data integrity through Attributable, Legible, Contemporaneous, Original, Accurate, Complete, Consistent, Enduring, and Available principles.
argument-hint: Describe the audit record or compliance check to perform
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## ALCOA+ Compliance Principles

When creating pharmaceutical documentation or audit records, ensure compliance with these 9 principles:

### Core ALCOA Principles

#### Attributable
- Every entry identifies WHO made it (agent name, user email from rbac-factbook.yaml, system identifier)
- Never create anonymous entries
- Include timestamp of attribution

#### Legible
- Clear, unambiguous language
- ISO 8601 for all timestamps (e.g., `2026-01-14T10:30:00Z`)
- No undefined abbreviations
- Machine-readable and human-readable

#### Contemporaneous
- Record events AT THE TIME they occur
- Use CURRENT timestamp from system clock (via git hooks or system call)
- NEVER copy timestamps from examples or previous entries
- NEVER use placeholder dates

#### Original
- Create primary records, not copies
- Append-only modification (preserve history in .ai/session-ledger.md)
- Never overwrite historical data
- First capture is the original record

#### Accurate
- Verify facts before recording
- Include correction audit trail if errors found
- No estimation without labeling as such
- Cross-reference source data

### Extended ALCOA+ Principles

#### Complete
- All required fields populated (timestamp, agent, phase, story, decision, rationale, files, cost, tokens, model)
- No missing critical data
- Full context provided
- Traceability maintained

#### Consistent
- Same format across all entries (session ledger follows standard format)
- Terminology standardized (use agent names from AGENTS.md)
- Units clearly specified (USD for cost, tokens for input/output)
- Cross-document alignment

#### Enduring
- Records persist for required retention period
- Format remains accessible over time (markdown, git-committed)
- Storage medium reliable (git repository)
- Backup procedures in place (GitHub backup, clone retention)

#### Available
- Authorized users can access records (git repo access)
- Retrieval time acceptable (grep, search session-ledger.md)
- Search/filter capabilities exist (keyword search by agent, story, date)
- Access audit trail maintained (git log)

## Session Ledger ALCOA+ Compliance

Our `.ai/session-ledger.md` is ALCOA+ compliant by design:

| Principle | How Session Ledger Satisfies It |
|-----------|--------------------------------|
| Attributable | Logs agent name + user email (from rbac-factbook.yaml) |
| Legible | Markdown, human-readable |
| Contemporaneous | System timestamps via git hooks (not LLM-generated) |
| Original | Append-only (never edited) |
| Accurate | Review Council + E2E verification ensures accuracy |
| Complete | All fields populated (agent, phase, story, decision, files, cost) |
| Consistent | Standard format enforced by protocol |
| Enduring | Git-committed, persists forever |
| Available | In-repo, searchable via grep |

## Usage

When creating audit records:
1. Use current timestamp: `$(date -u +"%Y-%m-%dT%H:%M:%SZ")`
2. Include actor (agent + user email)
3. Describe action, target, previous/new values
4. Append to session-ledger.md (never overwrite)
5. Commit with message referencing the audit entry
