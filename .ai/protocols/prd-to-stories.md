# PRD-to-Stories Protocol — Requirements Decomposition

Breaks down Product Requirements Documents into implementable stories.

## Trigger
- User says "create stories", "break down PRD"
- PRD document provided

## Process

### Step 1: Parse PRD
- Extract features, user stories, acceptance criteria
- Identify technical requirements
- Flag ambiguities for clarification

### Step 2: Create Stories
- Each story: title, description, acceptance criteria (Gherkin), risk rating
- Story size: 1-3 day implementation max
- Dependencies mapped between stories

### Step 3: Technical Enrichment
- Add implementation notes per story
- Reference existing code/patterns
- Identify required architectural decisions (→ ADR)

### Step 4: Priority & Ordering
- Must-have → Should-have → Nice-to-have
- Dependency order
- Risk-based ordering (highest risk first)

### Step 5: JIRA Integration
- Format stories for JIRA import
- Include: summary, description, acceptance criteria, labels, epic link

### Step 6: Story Runner
- On JIRA story ID, Story-Runner delegates here

## JIRA Story Trigger

When user provides a JIRA story ID (pattern: PROJECT-NNN, e.g. PROJ-NNN):

1. FETCH: Read story from JIRA via MCP/REST
2. CONTEXT: Load NOW.md, relevant ADRs, cross-repo map, domain-governance.yaml
3. PLAN: Produce technical plan. Write to agent-exchange/planner-output.md. WAIT.
4. IMPLEMENT: On "implement" — execute plan per implementer.md
5. VERIFY: Self-healer Stage 6 E2E verification required
6. COUNCIL: Review Council reviews before commit
7. SHIP: Commit, push, create PR with story ID in branch name
8. UPDATE JIRA: Move story to "In Review" if MCP supports it

Branch: feature/PROJ-NNN-short-description
Commit: feat(PROJ-NNN): description

## Output
Write to .ai/agent-exchange/prd-stories-output.md
