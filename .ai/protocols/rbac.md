# RBAC Protocol — Role-Based Agent Access Control

Enforces team role boundaries so agents refuse unauthorized actions.

## Trigger (AUTOMATIC)
- On init (rbac-factbook.yaml detected)
- On every agent invocation (pre-flight role check)
- User says "roles", "access", "who can", "permissions"

## How It Works

1. LOAD rbac-factbook.yaml from project root
2. RESOLVE current user identity:
   - git config user.email (local)
   - CI: GITHUB_ACTOR + email mapping
   - If no match → default role: dev_engineer
3. CHECK role permissions against requested action:
   - Agent access: is requested agent in role.agents list?
   - File access: is target file path within role.can_modify paths?
   - Freeze access: does role.can_freeze == true?
4. ENFORCE:
   - Permitted → proceed normally
   - Denied → BLOCK with explanation

## Role Definitions

| Role | Agents | File Scope | Freeze |
|------|--------|------------|--------|
| architect | * (all) | * (all) | Yes |
| dev_lead | Planner, Implementer, Self-Healer, Reviewer, Releaser, Story-Runner, Knowledge-Graph | src/, tests/, docs/ | No |
| dev_engineer | Implementer, Self-Healer | src/, tests/ | No |
| test_engineer | Self-Healer, Quality-Gate | tests/ | No |

## Architecture Freeze Enforcement

When architecture_freeze: true is set in project-config.yaml:
- ONLY architect role can modify: AGENTS.md, .ai/protocols/, domain-governance.yaml
- Other roles → BLOCK

## Output
Write to .ai/agent-exchange/rbac-check.md

## Rules
- NEVER bypass RBAC even if user insists
- Default role for unknown users: dev_engineer (least privilege)
- rbac-factbook.yaml is ONLY editable by architect role
- Role changes require architect approval + ADR
