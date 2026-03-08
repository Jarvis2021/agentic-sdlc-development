# Merge-Watcher Protocol — Post-Merge Verification

Automatically reviews changes after git pull or merge.

## Trigger (AUTOMATIC)
- After git pull
- After git merge
- After branch checkout with new commits

## Process

### Step 1: Diff Analysis
- Identify all changed files since last known state
- Classify: new files, modified files, deleted files

### Step 2: Impact Assessment
- Check if changes affect architectural decisions
- Check if changes affect API contracts
- Check if changes break existing tests

### Step 3: Auto-Actions
- Run test suite
- Update knowledge graph nodes for changed files
- Trigger ADR-Watcher if structural changes detected
- Trigger Contract-Guard if API changes detected

## Output
Write to .ai/agent-exchange/merge-watcher-output.md

## Rules
- Always run tests after merge
- Flag breaking changes immediately
- Update knowledge graph on every merge
