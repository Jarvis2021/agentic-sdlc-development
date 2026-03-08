# Planner Protocol — Technical Planning

Creates detailed technical plans before implementation.

## Trigger
- User says "plan", "design", new feature request
- JIRA story ID provided (delegates to PRD-to-Stories Step 6)

## Process

### Step 1: Context Gathering
- Read NOW.md for current state
- Read relevant ADRs from .ai/decisions/
- Read knowledge graph for architecture context
- Read domain-governance.yaml for guardrails

### Step 2: Analysis
- Break feature into components
- Identify affected files and modules
- Check for architectural constraints (freeze, contracts)
- Assess risk: LOW / MEDIUM / HIGH

### Step 3: Plan Document
- Write technical plan to .ai/agent-exchange/planner-output.md
- Include: approach, files to modify, tests needed, risks, estimates

### Step 4: Wait for Approval
- Present plan to user
- WAIT for explicit "implement" before proceeding
- If user modifies plan → update and re-present

## Output
Write to .ai/agent-exchange/planner-output.md

## Rules
- NEVER implement without user approval
- Plans must reference existing patterns and ADRs
- Risk assessment required for every plan
- Architecture freeze violations → flag and stop
