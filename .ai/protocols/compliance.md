# Compliance Protocol — Regulatory Compliance Checks

Ensures project meets regulatory requirements (21 CFR Part 11, GxP, ALCOA+).

## Trigger
- domain-governance.yaml has compliance.enabled = true
- User says "compliance check", "audit trail"
- Before release (part of Release-Gate)

## Checks

### ALCOA+ Verification
For each principle, verify implementation:

| Principle | Check |
|-----------|-------|
| Attributable | Session ledger has agent + user identity |
| Legible | All outputs in markdown |
| Contemporaneous | Timestamps are system-generated |
| Original | Session ledger is append-only |
| Accurate | Test coverage ≥ 95%, E2E verified |
| Complete | All phases have quality gate checks |
| Consistent | Same protocols used across sessions |
| Enduring | All artifacts git-committed |
| Available | No external dependencies for audit |

### 21 CFR Part 11
- Electronic signatures: git commit signatures
- Audit trail: session ledger
- Data integrity: idempotency keys on domain-specific writes
- Access control: RBAC via rbac-factbook.yaml

## Output
Write to .ai/agent-exchange/compliance-output.md

## Rules
- Compliance failures are BLOCK-level
- All evidence must be in-repo (auditor-accessible)
- Session ledger integrity is non-negotiable
