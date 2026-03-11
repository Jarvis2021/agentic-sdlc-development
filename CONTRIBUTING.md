# Contributing to Agentic SDLC Framework

## Overview

This repository is the MIT-licensed reference implementation for Agentic SDLC v1.0. Teams and individuals can adopt it directly, fork it, or adapt it for their own repositories.

## Prerequisites

- A GitHub account
- Familiarity with the framework (`AGENTS.md` and `README.md`)
- Architect role in `rbac-factbook.yaml` for structural changes

## Contribution principles

Prefer contributions that improve:

- smaller default context surfaces
- structured runtime state and evidence capture
- tool-based retrieval and validation
- thin editor integrations over duplicated workflow engines

Avoid growing the project by default through broad prompt files, inflated agent rosters, or always-loaded context.

## Configuring RBAC for your team

To enable role-based access control in your project:

1. Edit `rbac-factbook.yaml` in your project root.
2. Add your team members to the `annotations.framework_roles` section:

```yaml
metadata:
  annotations:
    framework_roles: |
      alice.smith@your-org.com: architect
      bob.jones@your-org.com: dev_lead
      charlie.kim@your-org.com: dev_engineer
      diana.chen@your-org.com: test_engineer
```

3. Ensure `git config user.email` matches the address in `rbac-factbook.yaml`.
4. Commit and push the change.

### Role Capabilities

- **architect**: All agents, all files, can freeze/unfreeze architecture
- **dev_lead**: Most agents, can modify `src/`, `tests/`, `docs/`
- **dev_engineer**: Implementation agents only, can modify `src/`, `tests/`
- **test_engineer**: Testing agents only, can modify `tests/`

### Testing RBAC

Try modifying `AGENTS.md` as a `dev_engineer` and you should see:
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
| Routing entrypoint in `AGENTS.md` | architect | Yes |
| Governance (`domain-governance.yaml`) | architect | Yes |
| RBAC roles (`rbac-factbook.yaml`) | architect | Yes |
| CI workflows (`.github/workflows/`) | architect, dev_lead | No |
| README / docs | architect, dev_lead | No |
| Runtime schemas and tooling | architect, dev_lead | No |

## Proposing a new workflow capability

1. Describe the problem first.
2. Prefer a tool, runtime artifact, schema, or lookup path before proposing a larger prompt surface.
3. If a protocol is still needed, place it under `.ai/protocols/` and keep it retrieval-oriented.
4. Add an ADR for structural changes.
5. Submit a PR with evidence of testing.

## Proposing a new skill

1. Create `.ai/skills/your-skill/SKILL.md` following AgentSkills.io format
2. Document trigger conditions and what the skill provides
3. Submit a PR. No ADR is required for on-demand skills unless the change is structural.

## Updating governance guardrails

Guardrail changes in `domain-governance.yaml` affect all consuming repos.

1. Create an ADR explaining the change and its impact
2. Update `domain-governance.yaml` with the new guardrail
3. Test against at least one consumer repo (verify agents respect the change)
4. Submit PR with ADR reference

## Updating architecture decisions

Architecture decisions are recorded in `.ai/decisions/architecture-decisions.md`.

- New decisions: append a new `## ADR-NNN` section
- Changed decisions: mark the old ADR as `Status: Superseded by ADR-NNN`, then create the new one
- The architecture freeze lists what cannot be changed without architect approval

## Branch Strategy

We use trunk-based development with feature branches:

- `main` - stable, released framework
- `feature/*` - new features and changes
- PR required for all changes to `main`
- targeted review and validation before PR submission

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

## Testing changes

Before submitting a PR:

1. Run the relevant local tests for the files you changed.
2. Validate the smallest useful workflow path, not the entire repository by default.
3. Confirm no IDE-specific references in shipped framework files unless the file is an editor-specific guide or package.
4. If CI files changed, validate the workflow behavior explicitly.
5. If editor integration changed, package or smoke-test that integration.

## Open Source Use

This project is intended for open-source use under the MIT license declared in `package.json`. You can use it in personal, startup, internal, or commercial projects, subject to your own governance and compliance requirements.
