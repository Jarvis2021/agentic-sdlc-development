---
name: gxp-21cfr11
description: Provides 21 CFR Part 11 and GxP compliance requirements for pharmaceutical software. Use when validating electronic records, electronic signatures, audit trails, or system validation. Contains FDA regulatory requirements, EU Annex 11 guidance, and GxP validation levels (GLP, GCP, GMP). Required for pharmaceutical, domain-specific trial, and medical device software.
argument-hint: Describe the GxP compliance requirement to validate
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## 21 CFR Part 11 Requirements

FDA regulations for electronic records and electronic signatures in pharmaceutical software.

### Core Requirements (21 CFR Part 11.10)

1. **System Validation** - Ensure accuracy, reliability, and intended performance
   - Framework validation: SDLC benchmark scoring (10 categories)
   - Consumer repo validation: Quality-Gate + test coverage >= 95%

2. **Record Integrity** - Generate accurate and complete copies of records
   - Session ledger: append-only, git-committed
   - ADRs: immutable (never deleted, only superseded)

3. **Record Protection** - Protect records throughout retention period
   - Git history + RBAC enforcement
   - GitHub backup + clone retention

4. **Audit Trails** - Computer-generated, time-stamped audit trails (11.10(e))
   - `.ai/session-ledger.md`: system timestamps via git hooks
   - Records: who (agent + user), what (action), when (timestamp), why (rationale)

5. **System Access** - Limit access to authorized individuals
   - RBAC via rbac-factbook.yaml
   - Role-based agent and file access
   - Pre-commit hook enforcement

6. **Authority Checks** - Use authority checks to ensure only authorized actions
   - RBAC protocol checks permissions on every agent invocation
   - Architecture freeze restricts non-architect changes

### Audit Trail Requirements (11.10(e))

Session ledger satisfies 21 CFR Part 11.10(e):

| Requirement | How Session Ledger Satisfies |
|-------------|------------------------------|
| Secure | Git-committed, RBAC-protected |
| Computer-generated | System timestamps via hooks |
| Time-stamped | ISO 8601 UTC timestamps |
| Records who, what, when | Agent, action, timestamp, files |
| Does not obscure previous values | Append-only (never overwrites) |
| Retained as required | Git history, indefinite retention |
| Independent of creator | Git log verifiable by auditors |

### Electronic Signatures (11.50-11.200)

Git commits serve as electronic signatures:

- **Unique identifier**: `git config user.email`
- **Cannot be reused**: Git commit hash unique
- **Linked to record**: Commit ties to file changes
- **Includes printed name, date/time**: Git commit metadata

For additional signature requirements, configure GPG signing:
```bash
git config commit.gpgsign true
```

## GxP Validation Levels

| Level | Domain | Requirements |
|-------|--------|--------------|
| **GLP** | Good Laboratory Practice | Research/non-domain-specific studies, data integrity |
| **GCP** | Good Domain-Specific Practice | Domain-Specific trials, user safety, informed consent |
| **GMP** | Good Manufacturing Practice | Manufacturing/production, quality control |

Platform software falls under **GCP** (domain-specific trials).

### GxP Validation Documentation

Required for GxP-compliant software systems:

1. **Validation Plan** - In ADRs: scope, approach, acceptance criteria
2. **Requirements Specification** - In stories + PRD
3. **Design Specification** - In planner output + ADRs
4. **Test Protocols** - In test suite (IQ, OQ, PQ equivalents)
5. **Traceability Matrix** - In knowledge graph (story→file→test links)
6. **Validation Summary Report** - In release-readiness report

## EU Annex 11 Alignment

European regulations for computerized systems:

- **Risk-based validation**: Quality-Gate thresholds vary by risk (project-config.yaml)
- **Data integrity controls**: Review Council + RBAC + Contract-Guard
- **Electronic signature requirements**: Git commit signatures
- **Business continuity**: Rollback command + history triage
- **Data migration validation**: Contract-Guard checks schema migrations
- **Periodic review**: Release-Gate + SDLC Benchmark (quarterly recommended)

## Release Blocking Authority

Compliance protocol can BLOCK releases if:

- 21 CFR Part 11 audit trail incomplete (session-ledger.md missing entries)
- Electronic signatures not compliant (commits unsigned, no git user.email)
- System validation documentation missing (no ADRs for structural changes)
- Access controls not implemented (rbac-factbook.yaml missing or misconfigured)
- ALCOA+ principles violated (detected by Compliance protocol)

## Usage

When validating GxP compliance:
1. Run: `compliance check` or `release` (triggers Compliance + Release-Gate protocols)
2. Verify session-ledger.md has entries for all sessions
3. Verify rbac-factbook.yaml is configured
4. Verify ADRs exist for architectural decisions
5. Verify git commits have user.email configured
