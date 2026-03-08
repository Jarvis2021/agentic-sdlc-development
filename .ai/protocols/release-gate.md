# Release-Gate Protocol — Release Readiness Verification

Ensures every release meets quality, security, and compliance thresholds.

## Trigger
- User says "release", "tag", "deploy"
- Before git tag or GitHub release creation

## EXIT Criteria (all must PASS)

| # | Criterion | Check |
|---|-----------|-------|
| 1 | All tests pass | Test suite exit 0 |
| 2 | Coverage >= 95% | Coverage report threshold |
| 3 | Zero critical/high CVEs | Dependency-Auditor output |
| 4 | Review Council passed | No MUST-FIX items remaining |
| 5 | E2E verification evidence | At least one runtime proof per feature |
| 6 | Contract-Guard passed | Pact + Bump.sh + Spectral |
| 7 | Architecture freeze respected | No frozen decisions violated |
| 8 | ADRs documented | All structural decisions have ADR |
| 9 | Session ledger current | All sessions logged |
| 10 | Version bump consistent | AGENTS.md, project-config.yaml aligned |

## Output
Write to .ai/releases/release-readiness-[version]-[date].md

## ALCOA+ Attestation
Included in every release readiness report.

## Rules
- ALL 10 criteria must PASS for release
- Any FAIL → block with specific remediation steps
