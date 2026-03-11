# AGENTS.md - Agentic SDLC Router
# Keep default context small. Retrieve only what the task needs.

## Startup Policy

1. Read this file first.
2. Classify the task as TRIVIAL, LOW, MEDIUM, or HIGH.
3. Read `.ai/NOW.md` only for active task state.
4. Read `rbac-factbook.yaml`, `.ai/project-config.yaml`, or `.ai/domain-governance.yaml` only if the task touches permissions, quality gates, or domain rules.
5. Load protocols, skills, history, or decisions only when the task requires them.

## Prime Directive

Plan first. Implement only on explicit requests such as "Implement", "Execute", "Fix", or "Create".
If the request is ambiguous, ask whether the user wants a plan or implementation.
For ticket-driven work such as `PROJ-NNN`, fetch the ticket context, produce a plan, and wait for approval before code changes.

## Context Rules

- Prefer tool-based retrieval over large prompt context.
- Do not preload protocol files by default.
- Pull only non-obvious operational details into the active context.
- Prefer structured runtime data in `.ai/session-state/` over narrative summaries.
- Treat markdown reports as human-facing outputs, not default model context.

## Task Patterns

| Task | Retrieve |
|------|----------|
| Planning or design | Relevant source files, current runtime state, related ADRs |
| Bug fix or debugging | Failing command, relevant tests, diagnostics, recent traces |
| Review | Diff, impacted files, relevant contracts, recent evidence |
| Release or ship | Current branch state, test results, CI status, review status |
| Cross-repo analysis | Explicit repo map or graph artifacts only when needed |

Common task roles in this repository include Planner, Implementer, Reviewer, Self-Healer, and Quality-Gate. Treat them as retrieval patterns and workflow roles, not as large default prompt blocks.

## Preferred Tools

| Need | Preferred path |
|------|----------------|
| Runtime state | `resume`, `events`, `.ai/session-state/` |
| Debug evidence | `trace`, diagnostics artifacts, browser verification |
| Code navigation | semantic tools, targeted file reads, repo search |
| Delivery checks | `scripts/ship.sh`, git status, CI status |
| Project rules | `rbac-factbook.yaml`, `.ai/project-config.yaml`, `.ai/domain-governance.yaml` |

## Delivery Policy

Use `bash scripts/ship.sh` as the preferred delivery helper when the repository supports it.
Treat skipped checks, missing `gh`, or missing PR state as manual follow-up, not automatic success.
Do not claim a change is complete without showing the commands run and the observed results.

## Guardrails

1. Keep the default context surface small.
2. Prefer retrieval pointers over broad repository summaries.
3. Escalate after repeated failed fix attempts.
4. Use evidence for claims about correctness, tests, CI, or runtime behavior.
5. Keep secrets out of prompts, logs, and code.

## Commands

| Command | Action |
|---------|--------|
| `init` | Scaffold or analyze a project |
| `plan X` | Create a structured plan |
| `implement` | Execute an approved plan |
| `fix X` | Fix a bug and capture evidence |
| `review` | Review changes with evidence |
| `ship` | Run the delivery helper |
| `resume` | Show current session state |
| `trace` | Capture runtime or debug evidence |
| `events` | Show recent runtime events |
| `plugins` | Inspect plugin packs |
| `/compact` | Compress current task context |

## Evidence

Use `proof: E:<source>:<ref>#<anchor>` when reporting findings.
Prefer file, test, command, API, or runtime evidence over inference.

## Lookup Pointers

- `.ai/context-index.yaml` for classification hints and retrieval paths
- `.ai/project-config.yaml` for quality expectations
- `.ai/domain-governance.yaml` for task-specific guardrails
- `.ai/protocols/` for optional deeper workflows
- `.ai/skills/` for specialized capabilities
