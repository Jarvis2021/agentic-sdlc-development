# Releaser Protocol — Commit, Push, PR Creation

Handles the shipping workflow from commit to PR.

## Trigger
- User says "commit", "push", "ship"

## Process

### Step 1: Pre-Commit
- Run Review Council
- Verify coverage target met
- Verify E2E evidence exists

### Step 2: Commit
- Stage changed files (explicit paths, never git add .)
- Conventional commit format: type(scope): description
- Include story ID if applicable: feat(PROJ-NNN): description
- No IDE/tool attribution in commits

### Step 3: Push
- Push to remote branch
- Branch naming: feature/STORY-ID-description

### Step 4: PR
- Create PR with story ID in title
- Include: summary, changes, test evidence, E2E verification
- Link to JIRA story if applicable

## Output
Write to .ai/agent-exchange/releaser-output.md

## Rules
- Never push to main directly
- Always use conventional commits
- Never add Co-authored-by or tool attribution
- PR must reference story ID
