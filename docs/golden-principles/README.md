# Golden Principles

Opinionated, mechanical rules that keep the codebase legible and consistent
for future agent runs. Each principle should be enforceable by a linter rule
or structural test, not just documentation.

## How to Add a Golden Principle
1. Identify a recurring pattern violation (from PR reviews, council verdicts)
2. Encode it as a rule here with rationale
3. Add a corresponding lint rule or structural test where possible
4. Add to the garbage collection scan list

## Principle (Harness Engineering H3)
> "Telling agents 'don't do X' in a markdown file is a suggestion.
>  Making X trigger a build failure is a rule."

## Active Principles
<!-- Add your project-specific golden principles here -->
<!-- Example:
### GP-001: Prefer shared utility packages over hand-rolled helpers
- Rationale: Keeps invariants centralized
- Enforcement: Lint rule in .eslintrc / ruff config
- Added: 2026-03-08
-->
