# Zero-Tolerance Enforcement Prompt

**Version**: 1.0
**Origin**: Post-mortem of PROJ-NNN (6 CI loops, 45 min wasted, $112+ burned)
**Applies to**: Every session, every repo, every agent, no exceptions.

---

## WHAT THIS IS

This prompt exists because an AI agent failed 10 different ways in a single session,
all of which were preventable with 2-second commands. Every failure traced to 3 root causes:

1. **No local CI mirror** -- agent composed lint commands ad-hoc, missed some
2. **No ruff config in pyproject.toml** -- local/CI drift caused 4 of 10 failures
3. **Protocols were documentation, not enforcement** -- triggers never fired

This prompt converts documentation into machine-enforceable gates.

---

## 8 NON-NEGOTIABLE RULES

### RULE 1: CI PARITY -- RUN PREFLIGHT BEFORE EVERY COMMIT

```
BEFORE any `git add` or `git commit`:
  bash scripts/preflight.sh

If it does not exist: HALT. Create it by reading .github/workflows/ci.yml.
If it exits non-zero: DO NOT COMMIT. Fix the issue first.

Verification: `bash scripts/preflight.sh` exits 0.
```

**Why**: CI runs `ruff check` + `ruff format --check` + `pytest`. Agent ran only one.
Preflight runs ALL of them. If preflight passes, CI will pass.

### RULE 2: NEVER MANUALLY EDIT LINT/FORMAT FIXES

```
WHEN a lint/format error is detected:
  1. ruff check --fix .             # autofix lint (including I001 imports)
  2. ruff format .                  # autofix formatting
  3. ruff check . && ruff format --check .  # verify clean
  4. ONLY IF autofix fails: read error, make targeted manual edit

NEVER hand-edit import order.
NEVER guess sort order.
`ruff check --select I --fix .` is the correct command for I001.
```

**Why**: Agent manually sorted imports twice, got it wrong both times.
The autofix command takes 0.5 seconds and is deterministic.

### RULE 3: POST-PUSH OBSERVATION -- CHECK PR COMMENTS WITHIN 120 SECONDS

```
AFTER every `git push`, within 120 seconds:
  1. gh pr checks                    # poll CI status
  2. gh pr view --comments           # read all comments
  3. Address every comment BEFORE any other work
  4. DO NOT wait for user to mention comments
```

**Why**: Copilot PR review posted at T+6 min. Agent didn't look for 45 min.
11 comments sat unaddressed until user explicitly asked.

### RULE 4: MANDATORY PROTOCOL INVOCATION

```
After EVERY file edit:
  1. Self-Healer runs (bash scripts/preflight.sh)
  2. Output written to .ai/agent-exchange/self-healer-output.md

Before EVERY commit:
  1. Reviewer runs (Agent Council: correctness + standards + security)
  2. Output written to .ai/agent-exchange/reviewer-output.md

git commit is BLOCKED if these files are not updated.
```

**Why**: Self-Healer and Reviewer protocols existed on disk. Neither was invoked.
The user had zero visibility into what the agent was doing or planning.

### RULE 5: IMPACT ANALYSIS BEFORE PRODUCTION CODE CHANGES

```
BEFORE modifying any function/method/class:
  1. grep -r "function_name" tests/     # find tests referencing it
  2. grep -r "from module import" tests/ # find tests importing module
  3. Run those specific tests first
  4. If any test depends on old behavior: document impact, get approval
```

**Why**: Agent changed `error_log` from wildcard to doc-scoped.
`test_find_error_log_by_wildcard` immediately broke.
A 2-second grep would have shown the dependency.

### RULE 6: CIRCUIT BREAKER -- MAX 3 THEN HALT

```
Maintain failure_count per lint-rule/test-name:
  failure_count += 1 on each failure
  failure_count = 0 on success

When failure_count >= 3:
  1. HALT all code edits
  2. Write .ai/agent-exchange/escalation.md
  3. Report to user: "Failed 3 times on [issue]. Stopping."
  4. DO NOT attempt a 4th fix
```

**Why**: Agent hit the same I001 error 3 times. Each time it manually edited
import order instead of using `ruff check --select I --fix .`.
After 3 failures it should have stopped. It didn't.

### RULE 7: BOOT SEQUENCE INCLUDES PRE-COMMIT DISCOVERY

```
On EVERY session start:
  1. Read .github/workflows/ci.yml (know what CI runs)
  2. Read pyproject.toml (verify linter config exists)
  3. Read .pre-commit-config.yaml (if exists):
     - Check: ls .git/hooks/pre-commit
     - If not installed: pre-commit install
  4. Verify scripts/preflight.sh exists and is executable
  5. If CI runs a tool with no local config: HALT and flag
```

**Why**: `.pre-commit-config.yaml` existed with ruff hooks.
Agent never checked. If `pre-commit install` had been run, loops 1-4 never happen.

### RULE 8: RUFF CONFIG MUST MATCH CI

```
If CI runs ruff but pyproject.toml has no [tool.ruff] section:
  1. HALT and flag: "CI uses ruff but no local config exists."
  2. Propose adding [tool.ruff] to pyproject.toml
  3. DO NOT proceed until config parity is established
```

**Why**: `pyproject.toml` had `[tool.black]` but no `[tool.ruff]`.
CI ran ruff with defaults. Local dev had no ruff config.
This config drift was the systemic root cause of 4 of 10 failures.

---

## SESSION LEDGER (MANDATORY AFTER EVERY SESSION)

Write to `.ai/session-ledger.md`:

```markdown
# Session: [date] [time]
Story/Task: [identifier]
Model: [which model]
Duration: [minutes]
CI loops: [count] (target: 1)
Token usage: [estimated]
Decisions: [key decisions made]
Failures: [what failed and root cause]
Cost: CI $[X] + tokens $[Y] + engineer time [Z] min
Protocols invoked: [self-healer: Y/N, reviewer: Y/N, council: Y/N]
Preflight runs: [count] (all must be PASS before commit)
```

---

## QUICK REFERENCE: COMMAND CHEATSHEET

| Situation | Command | NEVER do this instead |
|-----------|---------|----------------------|
| Import sort error (I001) | `ruff check --select I --fix .` | Hand-edit import order |
| Lint errors | `ruff check --fix .` | Guess the fix |
| Format errors | `ruff format .` | Manually adjust spacing |
| Before commit | `bash scripts/preflight.sh` | `git commit` without checking |
| After push | `gh pr view --comments` | Wait for user to ask |
| 3rd failure on same issue | HALT + write escalation.md | Try a 4th time |
| Unknown lint config | Read pyproject.toml + ci.yml | Guess which rules CI uses |

---

## FAANG BENCHMARKS

| Practice | Google | Stripe | Us (after this prompt) |
|----------|--------|--------|----------------------|
| Local CI mirror | Submit Queue presubmit | scripts/ci-local.sh | scripts/preflight.sh |
| Pre-commit hooks | Mandatory, enforced by tooling | Under 5s, auto-fix | .pre-commit-config.yaml + install |
| Max CI retries | CL auto-abandoned after failures | 2 rounds max | 3 attempts, then HALT |
| Post-push observation | Critique alerts block submit | Automated check | gh pr checks + comments within 120s |
| Config parity | Same build system local + CI | Devbox mirrors CI | preflight.sh mirrors ci.yml |
| Autofix-first | goimports, automated formatters | Auto-fix in pre-commit | ruff --fix first, manual edit last |
| Audit trail | All actions logged | Session tracking | agent-exchange + session-ledger |

---

## HOW TO USE THIS PROMPT

**Option A**: Paste into a new chat session at the start of every coding task.

**Option B**: Reference it from AGENTS.md:
```
Before ANY implementation, read and apply `.ai/enforcement-prompt.md`.
```

**Option C**: The bootstrap.sh script copies this file to every repo automatically.

---

## COST OF NOT FOLLOWING THIS PROMPT

Based on the PROJ-NNN incident:

| Waste Category | Cost |
|----------------|------|
| Engineer time (45 min at ~$150/hr) | $112.50 |
| CI runs (6 x ~$0.50) | $3.00 |
| Token waste (~15K extra tokens) | $0.90 |
| Trust erosion | Incalculable |
| **Total per incident** | **$116.40+** |

Every rule in this prompt has **instant ROI**. The total implementation cost
is 33 minutes. The first prevented incident saves 45 minutes.
