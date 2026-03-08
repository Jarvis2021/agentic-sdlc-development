# Codebase-Reader Protocol — Project Analysis & Init

Analyzes existing projects to populate the knowledge graph and context.

## Trigger
- User says "init" on existing project
- User says "init --repos path1 path2" for multi-repo

## Process

### Step 1: Structure Analysis
- Map directory structure
- Identify language/framework (package.json, pyproject.toml, Gemfile, etc.)
- Count files by type

### Step 2: Dependency Mapping
- Parse dependency files
- Build dependency graph
- Flag outdated/vulnerable packages (trigger Dependency-Auditor)

### Step 3: Architecture Extraction
- Identify entry points (main files, API routes)
- Map service boundaries
- Detect patterns (MVC, repository, event-driven)

### Step 4: Knowledge Graph Population
- Create nodes for each module/service
- Create edges for dependencies and calls
- Write to .ai/knowledge-graph.json

### Step 5: Multi-Repo (if --repos)
- Repeat steps 1-4 for each repo
- Create cross-repo edges
- Build unified knowledge graph

## Output
Write to .ai/knowledge-graph.json and .ai/agent-exchange/codebase-reader-output.md

## Rules
- Never modify existing code during init
- Report findings, don't fix them
- Flag security concerns for later review
