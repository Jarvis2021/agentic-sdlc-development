# Determinism in the Agentic SDLC Framework

## What Is Deterministic

The following produce identical structural output regardless of which LLM model is used:

### File Structure
- Bootstrap creates the same directory tree every time
- Protocol files have fixed names and locations
- Template files (spec, plan, task, trace) have fixed structure

### Classification Rules
- TRIVIAL/LOW/MEDIUM/HIGH criteria are defined in context-index.yaml
- Retrieval guardrails and token budgets are fixed numbers (5K/20K/80K/200K)
- Gate requirements per classification are explicit

### Quality Gates
- Preflight script runs the same commands as CI
- Coverage thresholds are numeric (95%)
- EXIT criteria are binary (PASS/FAIL)

### Agent Handoffs
- Handoff chain is defined in context-index.yaml (specifier -> planner -> implementer -> reviewer)
- Agent-exchange file format is fixed
- Each agent has defined inputs and outputs

### Protocol Rules
- Circuit breaker fires at exactly 3 failures
- Post-push observation has 120-second SLA
- Autofix-first rule applies to all lint/format errors

## What Varies by Model

### Prose Quality
- Spec descriptions, plan narratives, review comments vary in quality
- Stronger models produce more nuanced analysis
- This is expected and acceptable

### Reasoning Depth
- Opus-class models catch more edge cases in review
- Sonnet-class models are faster but may miss subtle issues
- config.yaml maps roles to model classes to optimize this tradeoff

### Speed
- Faster models complete tasks in fewer seconds
- Token usage varies by model efficiency
- Retrieval guardrails normalize cost regardless of model

## How to Verify Determinism

1. Run bootstrap on a test repo with Model A and Model B
2. Compare directory trees: `diff <(find .ai/ -type f | sort) <(find .ai-modelB/ -type f | sort)`
3. Compare context-index.yaml content (should be identical)
4. Compare template files (should be identical)
5. Compare protocol files (should be identical)
6. Only prose content (specs, plans, reviews) should differ

## Design Principle

Determinism is achieved by separating structure from content:
- Structure (files, directories, templates, retrieval rules, runtime schema, gates) is deterministic
- Content (prose, analysis, recommendations) varies by model quality
- The framework controls retrieval and structure; the model provides content
