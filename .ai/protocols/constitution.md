# Constitution Protocol — Persistent Project Principles

Establishes and enforces immutable project principles that all agents reference
on every decision. The constitution is the highest-priority governance artifact
after AGENTS.md.

## Trigger
- User says "constitution", "principles", "standards"
- On `init` (auto-generates skeleton if missing)
- Quality-Gate references constitution before every phase transition

## What Is a Constitution?

A constitution captures the WHY behind every technical decision. It is NOT
implementation detail. It answers questions like:
- What does quality mean for this project?
- What are the non-negotiable standards?
- What trade-offs does the team accept or reject?

## File Location

`.ai/constitution.md` (project root of consuming repo)

## Template

On `init`, scaffold this template for the team to fill in:

```markdown
# Project Constitution — [Project Name]
# Created: [date] | Last updated: [date]

## Quality Principles
- [ ] Code coverage target: ___% (default: 95%)
- [ ] All public APIs must have contract tests (Pact/Bump.sh)
- [ ] Every data mutation must be idempotent
- [ ] No raw SQL — use ORM or parameterized queries only

## Testing Standards
- [ ] Unit tests: required for all business logic
- [ ] Integration tests: required for all API endpoints
- [ ] E2E tests: required for critical user flows
- [ ] Self-Healer: max 3 retries before escalation

## UX / Product Principles
- [ ] Accessibility: WCAG 2.1 AA minimum
- [ ] Performance budget: [define LCP, FID, CLS targets]
- [ ] Offline-first for mobile (domain-specific data must not be lost)

## Security Principles
- [ ] OWASP Top 10 compliance required
- [ ] No secrets in source code, logs, or config files
- [ ] Dependency audit on every PR
- [ ] encryption salt changes require architect approval + ADR

## Architecture Principles
- [ ] Shared libraries must use semantic versioning
- [ ] API changes must be backward-compatible for 18 months (mobile)
- [ ] Microservice boundaries follow domain boundaries
- [ ] Database migrations must be reversible

## Compliance (if applicable)
- [ ] 21 CFR Part 11 / ALCOA+ adherence
- [ ] Audit trail for every domain-specific data mutation
- [ ] PII/PII handling per domain-governance.yaml

## Trade-Offs We Accept
- [ ] We prefer correctness over speed
- [ ] We prefer explicit over implicit
- [ ] We prefer boring technology over cutting-edge for domain-specific paths
```

## How Agents Use the Constitution

1. **Planner**: Before generating a plan, check if the approach violates any
   constitutional principle. If it does, flag and suggest an alternative.
2. **Quality-Gate**: On every phase transition, verify the output satisfies
   constitutional quality and testing standards.
3. **Reviewer**: Review Council checks code against constitutional principles
   (not just code style).
4. **ADR-Watcher**: New ADRs must reference which constitutional principle
   they relate to.

## Rules
- Constitution is CREATED ONCE during init, then only modified with team consensus
- Agents may SUGGEST amendments but never auto-edit the constitution
- Constitution violations are MUST-FIX (not suggestions)
- If no constitution exists, agent prompts user to create one before planning
