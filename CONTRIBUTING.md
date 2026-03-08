# Contributing to Agentic SDLC Framework

## Overview

This repository is the MIT-licensed open-source reference implementation for the Agentic SDLC Framework v1.0. Teams and individual builders can adopt it directly, fork it, or adapt it for their own repositories.

## Prerequisites

- A GitHub account
- Familiarity with the framework (read `AGENTS.md` and `README.md` first)
- Architect role in `rbac-factbook.yaml` for structural changes

## Configuring RBAC for Your Team

To enable role-based access control in your project:

1. **Edit `rbac-factbook.yaml`** in your project root
2. **Add your team members** to the `annotations.framework_roles` section:

```yaml
metadata:
  annotations:
    framework_roles: |
      alice.smith@your-org.com: architect
      bob.jones@your-org.com: dev_lead
      charlie.kim@your-org.com: dev_engineer
      diana.chen@your-org.com: test_engineer
```

3. **Agent resolves identity** via `git config user.email` — ensure your git email matches the one in `rbac-factbook.yaml`
4. **Commit and push** — RBAC is now active

### Role Capabilities

- **architect**: All agents, all files, can freeze/unfreeze architecture
- **dev_lead**: Most agents, can modify `src/`, `tests/`, `docs/`
- **dev_engineer**: Implementation agents only, can modify `src/`, `tests/`
- **test_engineer**: Testing agents only, can modify `tests/`

### Testing RBAC

Try modifying `AGENTS.md` as a `dev_engineer` — you should see:
```
❌ RBAC BLOCKED: Your role (dev_engineer) cannot modify AGENTS.md. Required: architect.
```

If RBAC isn't working, verify:
- `git config user.email` matches an email in `rbac-factbook.yaml`
- The role mapping is under `metadata.annotations.framework_roles`

## What Can Be Changed

| Category | Who Can Change | ADR Required |
|----------|---------------|:------------:|
| Protocol content (`.ai/protocols/*.md`) | architect, dev_lead | No (unless structural) |
| Agent roster in `AGENTS.md` | architect | Yes |
| Governance (`domain-governance.yaml`) | architect | Yes |
| RBAC roles (`rbac-factbook.yaml`) | architect | Yes |
| CI workflows (`.github/workflows/`) | architect, dev_lead | No |
| README / docs | architect, dev_lead | No |
| Benchmark / release reports | architect | No |

## Proposing a New Agent

1. Write the protocol in `.ai/protocols/your-agent.md` following existing format:
   - Title, trigger conditions, process steps, output location, rules
2. Add the agent to the appropriate table in `AGENTS.md` (Core or Extended)
3. Create an ADR in `.ai/decisions/architecture-decisions.md` explaining why
4. Update the agent count in `AGENTS.md`, `CONTEXT_COMPRESSED.md`, and `README.md`
5. Submit PR with evidence of testing in at least one consumer repo

## Proposing a New Skill

1. Create `.ai/skills/your-skill/SKILL.md` following AgentSkills.io format
2. Document trigger conditions and what the skill provides
3. Submit PR — no ADR required for skills (they're on-demand)

## Updating Governance Guardrails

Guardrail changes in `domain-governance.yaml` affect ALL consuming repos.

1. Create an ADR explaining the change and its impact
2. Update `domain-governance.yaml` with the new guardrail
3. Test against at least one consumer repo (verify agents respect the change)
4. Submit PR with ADR reference

## Updating Architecture Decisions

Architecture decisions are recorded in `.ai/decisions/architecture-decisions.md`.

- New decisions: append a new `## ADR-NNN` section (never edit existing ADRs)
- Changed decisions: mark the old ADR as `Status: Superseded by ADR-NNN`, then create the new one
- The architecture freeze (`.ai/decisions/ARCHITECTURE-FREEZE-v1.0.md`) lists what cannot be changed without architect approval

## Branch Strategy

We use trunk-based development with feature branches:

- `main` — stable, released framework
- `feature/*` — new features and changes
- PR required for all changes to `main`
- Review Council review before PR submission (run `review` command)

## Commit Convention

All commits follow conventional commit format:

```
feat(agents): add dependency-auditor to core roster
fix(protocols): correct coverage threshold in quality-gates
docs(readme): update adoption guide steps
chore(ci): add cocoapods detection to audit workflow
```

Include story ID when applicable: `feat(PROJ-NNN): description`

**Never** add `Co-authored-by`, `Signed-off-by`, or any tool attribution.

## Testing Changes

Before submitting a PR:

1. Copy your changes to a consumer repo (e.g., your-backend-app)
2. Run `init` to verify the framework loads correctly
3. Verify agent triggers fire as expected
4. Confirm no IDE-specific references in any file
5. Run the dependency audit workflow manually if CI files changed

## Open Source Use

This project is intended for open-source use under the MIT license declared in `package.json`. You can use it in personal, startup, internal, or commercial projects, subject to your own governance and compliance requirements.
