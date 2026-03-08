# SDLC Benchmark Protocol — Self-Assessment Against Industry Standards

Auto-generates a benchmark report scoring the project against industry standards.

## Trigger
- User says "benchmark", "score", "assess"
- On release (part of Release-Gate)

## Assessment Categories (10)

| # | Category | What It Measures | Max Score |
|---|----------|------------------|-----------|
| 1 | ADR Documentation | Decision records per structural change | 10 |
| 2 | Story Breakdown | Acceptance criteria, Gherkin, risk rating | 10 |
| 3 | Commit Quality | Conventional commits, story ID reference | 10 |
| 4 | Test Discipline | Coverage %, parallel execution, E2E verification | 10 |
| 5 | Planning Discipline | Phase boundaries, architecture freeze | 10 |
| 6 | Error Correction | Supersession trail, ADR updates | 10 |
| 7 | Security Posture | CVE scanning, secrets detection, SBOM | 10 |
| 8 | Documentation Completeness | README, architecture docs, API docs | 10 |
| 9 | Role-Based Design | rbac-factbook.yaml, RBAC enforcement | 10 |
| 10 | AI-Assisted Quality | Review Council, deterministic handoffs, cost tracking | 10 |

## Industry Standard Mapping
Score against: IEEE 12207, OWASP Secure SDLC, NIST SSDF, DORA Metrics, ISO 25010, ALCOA+

## Output
Write to .ai/benchmarks/sdlc-benchmark-[date].md

## Rules
- Honest scoring — never inflate
- Evidence required for every score
- Compare against previous benchmark if exists
