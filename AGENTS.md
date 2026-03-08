# AGENTS.md — Agentic SDLC Framework V1.0
# Token budget: ~800 tokens. Protocols lazy-load from .ai/protocols/

## Boot Sequence

1. Read this file (always loaded, under 100 lines)
2. Read `.ai/NOW.md` (~150 tokens, current task only)
3. Read `rbac-factbook.yaml` if exists (role check)
4. Load protocol files ONLY when trigger matches

## Memory Architecture

ALWAYS LOADED: AGENTS.md + NOW.md (under 1000 tokens combined)
ON-DEMAND: .ai/protocols/, .ai/skills/, .ai/history/, .ai/decisions/

NOW.md holds CURRENT task only. On completion, rotates to .ai/history/.

## Prime Directive

Plan first. Code only on "Implement", "Execute", "Fix", or "Create".
Ambiguous request: ask "Should I implement or plan?"
JIRA ID (e.g. PROJ-NNN): fetch via MCP, plan, wait for approval.

## Core Agents

| Agent | Trigger | Protocol |
|-------|---------|----------|
| Planner | "plan", "design", new feature, JIRA ID | planner.md |
| Implementer | "implement", "build", "fix" | implementer.md |
| Self-Healer | After EVERY code change (auto) | self-healer.md |
| Reviewer | "review", before commit/PR | reviewer.md |
| Releaser | "commit", "push", "ship" | releaser.md |
| Context-Keeper | "/compact", 60% context | context-keeper.md |
| Merge-Watcher | After git pull/merge (auto) | merge-watcher.md |
| Codebase-Reader | "init" on existing project | codebase-reader.md |
| ADR-Watcher | Structural changes, merges | adr-watcher.md |
| Quality-Gate | Phase transitions | quality-gates.md |
| Security-Scanner | New dependency, before PR | security-scanner.md |
| Dependency-Auditor | "deps", "outdated", CI scheduled | dependency-auditor.md |
| Knowledge-Graph | On init, story completion, arch changes | knowledge-graph.md |
| Contract-Guard | API/schema changes, before PR | contract-guard.md |
| PRD-to-Stories | "create stories", PRD provided | prd-to-stories.md |
| Orchestrator | Compound tasks (multi-agent) | agent-orchestration.md |

Extended: RBAC (rbac.md), Compliance (compliance.md), Observability (observability.md), Release-Gate (release-gate.md), Benchmark (sdlc-benchmark.md)

All protocols in `.ai/protocols/`. Skills in `.ai/skills/`.

## Definition of Done (machine-enforced)

A task is DONE when `bash scripts/ship.sh` exits 0. No exceptions.

```
bash scripts/ship.sh --msg "fix(PROJ-123): description"
```

The script enforces this sequence automatically:
1. Autofix (ruff/prettier) then preflight (lint + format + tests)
2. Stage explicit files, commit, strip IDE trailers, push
3. Poll CI checks (max 10 min). If fail: fix and re-run ship.sh
4. Poll review comments (max 5 min). If found: address each, re-run ship.sh

Exit codes: 0=done, 1=preflight fail, 2=commit fail, 3=CI fail, 4=review comments

When ship.sh reports review comments (exit 4):
- Challenge each comment with council reasoning before implementing
- Use `bash scripts/council.sh <slug> --external "<comment>"` to record verdict
- Only implement COUNCIL-VALIDATES items. Reject COUNCIL-REJECTS with explanation.
- After addressing, re-run: `bash scripts/ship.sh`

DO NOT manually run pytest, ruff, gh pr checks, or gh api. ship.sh handles all of it.
DO NOT ask the user for permission to run tests, activate venv, or push. Just run ship.sh.
DO NOT declare "done" until ship.sh exits 0 with CI=GREEN and Reviews=CLEAN.

## Guardrails

1. Architecture changes BLOCKED without architect approval (RBAC).
2. NOW.md bounded (~150 tokens). Rotates to .ai/history/ on completion.
3. After git pull: Merge-Watcher + ADR-Watcher auto-review.
4. Self-Healer max 3 attempts per issue, then escalate to user.
5. Contract-Guard on EVERY API/schema change.
6. Session ledger: EVERY decision logged (.ai/session-ledger.md, append-only).

## Commands

| Command | Action |
|---------|--------|
| init | New: scaffold. Existing: analyze + populate |
| init --repos p1 p2 | Multi-repo with dependency mapping |
| PROJ-NNN | Fetch JIRA story, plan, implement, ship |
| plan X | Create technical plan + structured runtime plan |
| implement | Execute approved plan |
| fix X | Fix bug + self-heal + E2E verify |
| review | Review Council + architecture check |
| ship | `bash scripts/ship.sh --msg "msg"` (full DoD) |
| resume | Show current session, plan, approvals, tasks, events |
| trace | Capture runtime/debug/browser evidence bundle |
| events | Show structured runtime event timeline |
| plugins | List, enable, disable, and validate plugin packs |
| /compact | Compress context, update NOW.md |
| audit | Security + Dependency + Contract scan |
| benchmark | SDLC benchmark scoring |
| release | Release-Gate verification |

## Routing

| Task Type | Model Tier |
|-----------|-----------|
| Planning, architecture, review | Strongest available |
| Implementation, self-healing | Fast available |

## Evidence & Confidence

Findings include: `proof: E:<source>:<ref>#<anchor>` (file, test, api, db, cmd).
Confidence = MIN(4 dimensions). Any < 60%: human review required.
Ledger: `.ai/session-ledger.md` (append-only, ALCOA+).

## Config

See `.ai/project-config.yaml` for quality, RBAC, compliance, contract testing settings.
See `.ai/context-index.yaml` for task classification and token budgets.
See `.ai/domain-governance.yaml` for domain-specific guardrails (PII, encryption, idempotency).
