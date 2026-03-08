# Self-Healer Protocol

Automatically detects, diagnoses, and fixes test failures
after EVERY code change. Max 3 repair attempts.

## Trigger (AUTOMATIC -- NOT OPTIONAL)
- After EVERY code change by Implementer
- After Merge-Watcher detects conflicts
- When user says "fix" on failing tests
- After EVERY `git push` (check CI + PR comments within 120 seconds)

**Enforcement**: Implementer protocol MUST call Self-Healer after every file edit.
If Self-Healer was not invoked, the commit is a protocol violation.

## RULE ZERO: PREFLIGHT BEFORE EVERY COMMIT

Before ANY `git add` or `git commit`, run the project's preflight script:

```bash
bash scripts/preflight.sh
```

This script mirrors the exact CI pipeline locally. If it does not exist,
HALT and create it (see Preflight Script section below).

If preflight exits non-zero: **DO NOT COMMIT.** Fix the issue first.

## RULE ONE: NEVER MANUALLY EDIT LINT/FORMAT FIXES

When a lint or format error is detected:

1. **FIRST**: Run autofix commands (project-specific):
   - Python (ruff): `ruff check --fix . && ruff format .`
   - Python (black): `black .`
   - TypeScript: `npx prettier --write .`
   - Go: `gofmt -w . && goimports -w .`
2. **THEN**: Verify clean: `ruff check . && ruff format --check .`
3. **ONLY IF** autofix fails: read the error, make a targeted manual edit.

**NEVER hand-edit import order.** The linter owns import ordering.
**NEVER guess sort order.** `ruff check --select I --fix .` handles I001.

## RULE TWO: CIRCUIT BREAKER (failure_count)

Maintain a `failure_count` per lint-rule or test-name:
- Each failure on the same issue: `failure_count += 1`
- On success: `failure_count = 0`

When `failure_count >= 3` for ANY single issue:
1. **HALT** all code edits immediately
2. Write `.ai/agent-exchange/escalation.md`:
   ```
   # Escalation: [issue]
   Failures: 3
   Attempted: [list what was tried]
   Root cause: [hypothesis]
   Recommendation: [what the user should do]
   ```
3. Report to user: "I have failed 3 times on [issue]. Stopping."
4. **DO NOT** attempt a 4th fix.

## 6-Stage Self-Heal Cycle

### Stage 0: PREFLIGHT (NEW -- runs BEFORE any commit)
```bash
# Run the EXACT commands that CI runs.
# Read .github/workflows/ci.yml to know the commands.
# If scripts/preflight.sh exists, use it:
bash scripts/preflight.sh
```
If preflight passes: proceed to commit.
If preflight fails: DO NOT commit. Go to Stage 1.

### Stage 1: DETECT
```bash
# Run BOTH lint and format checks (these are DIFFERENT commands)
ruff check .             # Lint: unused imports, I001 sort order, type errors
ruff format --check .    # Format: line length, spacing, quotes

# Run tests (parallel if > 50 tests)
pytest -n auto --tb=short    # Python
vitest run --pool=threads     # TypeScript
go test ./... -parallel=8     # Go
flutter test --concurrency=8  # Flutter
xcodebuild test               # iOS
```
- Capture: which tests failed, error messages, stack traces
- Capture: coverage percentage
- Capture: which lint rules failed (E, F, I, W, UP, etc.)

### Stage 2: DIAGNOSE
Read the failure output. Classify each failure:
- **Lint error (autofix available)**: Use `ruff check --fix .` -- NEVER manual edit
- **Format error**: Use `ruff format .` -- NEVER manual edit
- **Import sort error (I001)**: Use `ruff check --select I --fix .` -- NEVER manual edit
- **Broken assertion**: expected value changed due to code change
- **Import error**: missing or renamed import
- **Type error**: signature changed, types mismatch
- **Runtime error**: null reference, missing config, bad state
- **Flaky test**: passes on retry (intermittent)

### Stage 3: REPAIR (max 3 attempts)
- Attempt 1: Run autofix commands FIRST, then targeted fix if needed
- Attempt 2: Broaden scope (check related tests, fixtures)
- Attempt 3: Minimal viable fix (update assertions to match new behavior)
- After attempt 3 fails: **HALT.** Write escalation.md. Do not keep guessing.

Each attempt:
1. For lint/format: run `ruff check --fix . && ruff format .` FIRST
2. Read the failing test file
3. Read the source file being tested
4. Make the MINIMAL change to fix
5. Run preflight again (`bash scripts/preflight.sh`)
6. Check coverage delta
7. Increment `failure_count` if still failing

### Stage 4: VALIDATE
- Run `bash scripts/preflight.sh` -- must exit 0
- All previously passing tests still pass
- Coverage has NOT decreased
- If coverage decreased: add tests to restore it
- Coverage must meet target (from project-config.yaml)

### Stage 4b: POST-PUSH OBSERVATION (after git push)
Within 120 seconds of every `git push`:
1. Run `gh pr checks` (poll CI status, retry every 30s until complete or 10 min)
2. Run `gh pr view --comments` (check for reviewer comments)
3. If ANY comments exist: address them BEFORE any other work
4. If CI fails: go back to Stage 1 with the CI failure output
5. **DO NOT** wait for the user to tell you about comments or failures

### Stage 5: ADAPT
- Update NOW.md with test results
- If pattern repeats: note in decisions/ as a known fragility
- Log to agent-exchange/self-healer-output.md
- Log `failure_count` state

## Pre-PR Quality Gate

BEFORE raising ANY PR, ALL of these must pass:
1. `bash scripts/preflight.sh` exits 0
2. ALL tests pass (zero failures)
3. Coverage >= target (default 95%)
4. `ruff check .` exits 0
5. `ruff format --check .` exits 0
6. Agent Council review completed (reviewer-output.md updated)
7. Self-Healer output written (self-healer-output.md updated)
8. If any fail: Self-Healer runs (max 3 attempts per issue)
9. If Self-Healer fails: STOP, report to user, do NOT raise PR

## Preflight Script

If `scripts/preflight.sh` does not exist, create it by reading the CI workflow:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== PREFLIGHT: Reading CI parity from .github/workflows/ ==="

# Python backend (if verispec/ exists)
if [ -d "verispec" ]; then
    cd verispec
    echo "=== PREFLIGHT: ruff check ==="
    poetry run ruff check .
    echo "=== PREFLIGHT: ruff format ==="
    poetry run ruff format --check .
    echo "=== PREFLIGHT: pytest ==="
    poetry run pytest tests/ --ignore=tests/security/ -v --tb=short -q
    cd ..
fi

# Frontend (if qa-ui/ exists)
if [ -d "qa-ui" ]; then
    cd qa-ui
    echo "=== PREFLIGHT: npm test ==="
    npm run test:coverage
    cd ..
fi

echo "=== PREFLIGHT: ALL PASSED ==="
```

## Parallel Test Execution

For speed, automatically run tests in parallel when suite is large:

| Framework | Command | Parallel Method |
|-----------|---------|-----------------|
| pytest | `pytest -n auto` | pytest-xdist, auto-detect cores |
| vitest | `vitest run --pool=threads` | Thread-based parallelism |
| jest | `jest --maxWorkers=auto` | Worker threads |
| go test | `go test ./... -parallel=8` | Per-package parallelism |
| XCTest | `xcodebuild -parallel-testing-enabled YES` | Device parallelism |
| Flutter | `flutter test --concurrency=8` | Process-based parallelism |

For VERY large suites: split into backend/frontend and run as subagents.

## Regression Guard

After self-heal completes:
- Compare test count: before vs after (should only increase)
- Compare coverage: before vs after (should not decrease)
- If either regresses: flag and fix before proceeding

## Output

Write to `.ai/agent-exchange/self-healer-output.md`:
```markdown
# Self-Heal: [timestamp]
Trigger: [code change / merge / manual fix]
Preflight: [PASS/FAIL]
Lint (ruff check): [PASS/FAIL] -- [N] errors
Format (ruff format): [PASS/FAIL] -- [N] errors
Tests before: N passed, M failed
Attempts: [1-3]
Autofix applied: [yes/no] -- [which commands]
Tests after: N+X passed, 0 failed
Coverage: before% -> after%
Regression: [none / fixed]
failure_count: {rule: count, ...}
```

## Session Ledger

After EVERY session, write to `.ai/session-ledger.md`:
```markdown
# Session: [date] [time]
Story/Task: [identifier]
Model: [which model]
Duration: [minutes]
CI loops: [count] (target: 1)
Token usage: [estimated]
Decisions: [key decisions made]
Failures: [what failed and why]
Root causes: [if any failures]
Cost: [estimated $ for CI + tokens]
```

## Rules
- NEVER skip tests "because they take too long"
- NEVER delete a failing test to make suite pass
- NEVER reduce coverage to make PR pass
- NEVER manually edit lint/format fixes when autofix is available
- NEVER hand-edit import order (ruff owns I001)
- NEVER commit without running preflight.sh
- NEVER ignore PR comments after push
- Max 3 repair attempts per issue. After that: HALT and escalate.
- Always run BOTH `ruff check` AND `ruff format --check` (they are different)
- Always run full suite, not just changed tests (for regression)
- Always check PR comments within 120 seconds of push
