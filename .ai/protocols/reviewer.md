# Reviewer Protocol

Validates every change before commit/PR. Blocks architectural changes
from non-architects. Runs Agent Council before PR to eliminate
GitHub reviewer comments entirely.

## Review Categories

| Category | What Is Checked |
|----------|-----------------|
| Architecture | Follows established patterns? No unauthorized structural changes |
| Security | Input validation, no secrets in code/logs, OWASP baseline |
| Correctness | Correct APIs, status codes, error handling. Evidence-based |
| Regression | All tests pass, coverage maintained or improved |
| Style | Project conventions (naming, imports, formatting) |
| Scope | Only touches files needed for the task. No drive-by refactoring |

## Architecture Protection (Auto-Flag)

If the change includes ANY of these, flag as ARCHITECTURE CHANGE:
- New dependency in package.json / pyproject.toml / go.mod
- New API endpoint or route
- Database schema migration
- New design pattern not in existing codebase
- Changes to CI/CD pipeline
- Changes to infrastructure files (Docker, K8s, Terraform)
- Changes to auth/security configuration

When flagged:
1. Block PR from merge
2. Add label: `needs-architect-review`
3. Require approval from user with `architect` role in factbook.yaml
4. ADR-Watcher drafts an ADR for the change
5. Only after architect approval: PR can merge
6. On merge: Merge-Watcher propagates to all team members' local setups

## Agent Council (Pre-PR Review)

BEFORE raising any PR, run the Agent Council — 3 virtual reviewers
that catch issues before they reach GitHub:

### Council Members
1. **Correctness Reviewer**: Logic errors, edge cases, null handling, race conditions
2. **Standards Reviewer**: Naming, imports, patterns, DRY, SOLID, project conventions
3. **Security Reviewer**: Input validation, secrets, injection, auth, OWASP Top 10

### Council Process
1. Collect the full diff (`git diff --cached` or `git diff main...HEAD`)
2. Each council member reviews independently
3. Findings are merged and deduplicated
4. Findings classified: MUST-FIX (blocks PR) vs SHOULD-FIX (suggestion)
5. MUST-FIX items: auto-fix where possible, report remainder to user
6. SHOULD-FIX items: apply if trivial, note if opinionated

### Council Output
```markdown
# Agent Council Review: [branch]
Timestamp: YYYY-MM-DD HH:MM

## MUST-FIX (0 = ready for PR)
- [ ] [finding] — [which reviewer] — [auto-fixed / needs human]

## SHOULD-FIX (nice-to-have)
- [ ] [finding] — [which reviewer]

## Verdict: [READY-FOR-PR / FIX-REQUIRED]
```

### Why This Eliminates GitHub PR Comments
- GitHub Copilot reviewer has no project context — it flags generic issues
- Our council runs WITH full project context (ADRs, architecture, patterns)
- Issues caught before PR = zero surprise comments after PR
- If council says READY-FOR-PR, the code has already passed 3 expert reviews

## PR Checklist Template

Every PR created by Releaser must include this checklist:

```markdown
## PR Checklist

### Code Quality
- [ ] All tests pass (0 failures)
- [ ] Coverage >= [target]% (actual: [X]%)
- [ ] Linting passes (0 errors, 0 warnings)
- [ ] No new dependencies without ADR
- [ ] No hardcoded secrets or credentials

### Architecture
- [ ] Follows established patterns (verified by council)
- [ ] No unauthorized architectural changes
- [ ] ADR created if architecture changed
- [ ] Cross-repo impact assessed (if multi-repo)

### Testing
- [ ] Unit tests added for new code
- [ ] Integration tests updated if API changed
- [ ] Edge cases covered
- [ ] Self-Healer validated (0 regressions)

### Review
- [ ] Agent Council: READY-FOR-PR
- [ ] Correctness review: PASS
- [ ] Standards review: PASS
- [ ] Security review: PASS

### Context
- Story: [JIRA link or description]
- ADRs referenced: [list]
- Files changed: [N]
- Coverage delta: [before]% → [after]%
```

## Pre-Review Gate (BLOCKING -- runs BEFORE council)

Before running the Agent Council, verify:

1. `bash scripts/preflight.sh` exits 0 (CI parity)
2. `.ai/agent-exchange/self-healer-output.md` exists and is current
3. `.ai/agent-exchange/implementer-output.md` exists and is current
4. All tests pass with coverage >= target

If ANY of these fail: **BLOCK review. Send back to Implementer.**

## Post-Push Observation (MANDATORY after every push)

Within 120 seconds of `git push`:

1. `gh pr checks` -- poll CI status (retry every 30s, max 10 min)
2. `gh pr view --comments` -- read ALL reviewer comments
3. `gh api repos/{owner}/{repo}/pulls/{number}/reviews` -- check reviews
4. If ANY comments or failing checks: address BEFORE any other work
5. Do NOT wait for user to point out comments -- check proactively

## Config Drift Detection

Before reviewing, check for local/CI configuration parity:

1. Read `.github/workflows/ci.yml` -- identify all lint/test commands
2. Read `pyproject.toml` -- verify `[tool.ruff]` section exists
3. Read `.pre-commit-config.yaml` -- verify hooks match CI tools
4. If CI runs a tool with no local config: FLAG as P0

## Output Format

Write to `.ai/agent-exchange/reviewer-output.md`:

```markdown
# Review: [title]
Timestamp: YYYY-MM-DD HH:MM
Model: [which model]

## Preflight
- scripts/preflight.sh: [PASS/FAIL]
- CI parity verified: [YES/NO]
- Config drift detected: [YES/NO] -- [details]

## Architecture Change Detected: [YES/NO]
[If YES: what changed, why it needs architect approval]

## Agent Council
- Correctness: [PASS/FAIL] -- [N] findings
- Standards: [PASS/FAIL] -- [N] findings
- Security: [PASS/FAIL] -- [N] findings
- Auto-fixed: [N] items
- Needs human: [N] items

## Findings
- Architecture: [PASS/WARN/FAIL]
- Security: [PASS/WARN/FAIL]
- Correctness: [PASS/WARN/FAIL]
- Regression: Coverage before% -> after%
- Scope: Files changed: N

## Post-Push Observation
- CI status: [pending/pass/fail]
- PR comments: [N] total, [M] unaddressed
- All comments addressed: [YES/NO]

## Verdict: [APPROVE / NEEDS-ARCHITECT-REVIEW / FIX-REQUIRED / BLOCK]
```
