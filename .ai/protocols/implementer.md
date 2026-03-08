# Implementer Protocol

Activates on "implement", "build", "create", "fix" -- only after plan approval.

## Boot Sequence (MANDATORY on every session start)

Before writing any code, complete this checklist:

1. Read `.ai/agent-exchange/planner-output.md` (the approved plan)
2. Read `.ai/NOW.md` (current state)
3. Read `.github/workflows/ci.yml` (know what CI runs)
4. Read `.pre-commit-config.yaml` (if exists):
   - Check if hooks are installed: `ls .git/hooks/pre-commit`
   - If not installed: run `pre-commit install`
5. Verify `scripts/preflight.sh` exists. If not, create it (see self-healer.md).
6. Read `pyproject.toml` / `package.json` -- verify linter configs exist locally

If CI runs a tool (ruff, black, eslint) that has no local config: HALT and flag.

## Steps

1. Read the plan and current state (boot sequence above)
2. Read each file before modifying it (verify imports, signatures, patterns)
3. **IMPACT ANALYSIS** before modifying any function:
   - `grep -r "function_name" tests/` -- find all tests referencing it
   - `grep -r "from module import" tests/` -- find tests importing the module
   - Run those specific tests: `pytest tests/path/to/affected_test.py -v`
   - If any test depends on old behavior: document the impact and get approval
4. Make surgical, minimal changes -- only what the plan calls for
5. After EVERY file edit: invoke Self-Healer (run `bash scripts/preflight.sh`)
6. Update `.ai/NOW.md` after each file change
7. Write `.ai/agent-exchange/implementer-output.md`
8. Write `.ai/agent-exchange/self-healer-output.md` (Self-Healer fills this)

## Pre-Commit Gate (BLOCKING)

Before ANY `git add` or `git commit`:

```bash
# 1. Run preflight (mirrors CI exactly)
bash scripts/preflight.sh

# 2. Verify agent-exchange files are current
ls -la .ai/agent-exchange/self-healer-output.md
ls -la .ai/agent-exchange/implementer-output.md

# 3. If preflight fails: FIX, do NOT commit
# 4. If agent-exchange files are missing: WRITE THEM, do NOT commit
```

**Commit is PROHIBITED if preflight exits non-zero.**

## Post-Push Gate (BLOCKING)

After EVERY `git push`, within 120 seconds:

1. `gh pr checks` -- poll CI (retry every 30s, max 10 min)
2. `gh pr view --comments` -- read all reviewer comments
3. Address every comment before doing anything else
4. Do NOT wait for the user to ask about comments

## Lint Fix Protocol

When a lint/format error occurs:

1. **ALWAYS** run autofix first: `ruff check --fix . && ruff format .`
2. **NEVER** hand-edit import order -- ruff owns I001
3. **NEVER** guess sort order -- `ruff check --select I --fix .` is deterministic
4. **ONLY** manual edit after autofix has been tried and failed
5. After fix: re-run `ruff check . && ruff format --check .` to verify

## Output Format

```markdown
# Implementation: [title]
Timestamp: YYYY-MM-DD HH:MM
Story: STORY-N
Model: [which model]

## Impact Analysis
- Functions modified: [list]
- Tests affected: [list from grep]
- Tests run before edit: [PASS/FAIL]

## Files Modified
- path/to/file.py -- [what changed]

## Preflight Result
- ruff check: [PASS/FAIL]
- ruff format: [PASS/FAIL]
- pytest: [PASS/FAIL] -- [N] passed, [M] failed
- Coverage: [X]%

## Approach
[Brief description of implementation approach taken]

## Handoff Notes
[What Self-Healer and Reviewer need to know]
```

## Rules
- Modify ONLY files needed for the task
- Do NOT refactor unrelated code
- Do NOT import packages without verifying they exist in dependencies
- Do NOT write placeholder code (TODO, implement later)
- Do NOT add comments that narrate what the code does
- ALWAYS read a file before modifying it
- ALWAYS run impact analysis (grep tests) before modifying production code
- ALWAYS run preflight before committing
- ALWAYS invoke Self-Healer after every file edit
- ALWAYS check PR comments within 120 seconds of push
- NEVER manually edit what ruff --fix can handle
- NEVER commit without preflight passing
- NEVER ignore CI failures or PR comments
