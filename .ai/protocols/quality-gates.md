# Quality-Gate Protocol

Configurable quality enforcement at every phase transition.
Prevents low-quality work from advancing.

**Zero-tolerance enforcement.** Gates are BLOCKING, not advisory.

## Rigor Levels

Set in `.ai/project-config.yaml`:

| Level | Coverage | Tests Required | ADR Required | Architect Review |
|-------|----------|----------------|-------------|-----------------|
| standard | >= 70% | Before PR | On arch changes | No |
| professional | >= 85% | Before commit | On arch changes | On arch changes |
| enterprise | >= 95% | Before EVERY push | On all design changes | On arch changes |
| regulated | >= 98% | After EVERY change | On all changes | On all changes |

Default: **professional** (85%, tests before commit, ADR on arch changes).

## Phase Transitions

| From | To | Gate | Verification Command |
|------|----|------|---------------------|
| Plan | Implement | Plan approved by user | User says "implement" |
| Implement | Commit | `bash scripts/preflight.sh` exits 0 | `bash scripts/preflight.sh` |
| Commit | Push | Agent-exchange files updated | `ls .ai/agent-exchange/*.md` |
| Push | PR Comments | PR comments read within 120s | `gh pr view --comments` |
| PR | Merge | CI green, architect approved (if flagged) | `gh pr checks` |

**Every gate is BLOCKING.** The agent CANNOT proceed to the next phase
until the verification command passes.

## Coverage Enforcement

Before raising a PR:
1. Run test suite (parallel if 100+ tests)
2. Check coverage against target
3. If below target: SOFT DENY — explain what's missing, suggest tests
4. If Self-Healer running: allow up to 3 fix attempts
5. If still below after 3 attempts: BLOCK, report to user

## Soft Denial

Never hard-block silently. Always explain:
```
QUALITY GATE: Coverage at 82%, target is 95%.
Missing coverage in:
  - src/services/auth.ts (3 untested functions)
  - src/utils/parser.ts (1 untested branch)
Self-Healer attempting to add tests (attempt 1/3)...
```

## Enterprise Governance (What We Adopted)

From our analysis of enterprise frameworks:

### What we adopted (adds value without complexity):
- Architecture protection (auto-flag, block, require approval)
- ADR automation (decisions tracked, immutable once approved)
- Role-based access via factbook.yaml
- Quality levels that scale with team size
- Soft denial (explain, don't just block)
- Deterministic replay via agent-exchange files

### What we deliberately omitted (adds complexity without proportional value):
- Pre-loaded framework ADRs (58 decisions about NPM packaging irrelevant to your project)
- Phase-number obsession (9 rigid phases vs flexible flow)
- Mandatory compliance (opt-in only if you need it)
- Hook-based telemetry (optional, not required)
- TOON files (our NOW.md is simpler and sufficient)
- God Mode bypass (unnecessary with proper quality levels)

## Parallel Test Execution

Triggered automatically when test count exceeds threshold:

```yaml
quality:
  parallel_test_threshold: 50  # run in parallel if > 50 tests
```

Commands by framework:
- Python: `pytest -n auto --dist loadgroup`
- TypeScript: `vitest run --pool=threads`
- Go: `go test ./... -parallel=8`
- Swift: `xcodebuild test -parallel-testing-enabled YES`
- Flutter: `flutter test --concurrency=8`

## Output

Write to `.ai/agent-exchange/quality-gate-output.md`:
```markdown
# Quality Gate: [phase transition]
Coverage: X% (target: Y%)
Tests: N passed, M failed
Parallel: [yes/no]
Verdict: [PASS / SOFT-DENY / BLOCK]
```
