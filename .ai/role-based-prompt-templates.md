# Role-Based Prompt Templates — Getting the Best from Your AI Agent

A practical guide for every team role. Use these templates to communicate intent clearly and get accurate, first-time results from the framework.

## Why Templates Matter

The single biggest factor in agent effectiveness is prompt clarity. Vague prompts produce vague results. These templates encode the structure that consistently yields high-quality output across hundreds of real sessions.

## Universal Structure

Every prompt should follow this pattern:

```
ROLE: [Your role — helps the agent calibrate depth and language]
TASK: [What you want — start with a verb]
SCOPE: [Boundaries — what NOT to touch]
OUTPUT: [Expected format — table, code, document, JIRA stories]
CONSTRAINTS: [Timeline, repos, branches, specific files]
AUTONOMY: [full | review-first | plan-only]
```

**AUTONOMY levels explained:**
- `full` — Agent executes end-to-end without stopping. Best for well-defined, low-risk tasks.
- `review-first` — Agent completes analysis, shows you the plan/output, waits for approval before acting. Best for medium-risk tasks.
- `plan-only` — Agent produces a plan or analysis only. No code changes, no commits, no external actions. Best for exploration, architecture decisions, and learning.

If you omit AUTONOMY, the agent defaults to `review-first` for safety.

---

## Product Owner

### Create Stories from a PRD
```
ROLE: Product Owner
TASK: Break down the User Consent Flow PRD into JIRA-ready stories
SCOPE: Backend API and database changes only — mobile UI stories will be separate
OUTPUT: Stories in Gherkin format (Given/When/Then) with acceptance criteria, story points (Fibonacci), and JIRA labels
CONSTRAINTS: Must fit in Sprint 24 (2 weeks, 3 developers). Reference architecture at .ai/decisions/
AUTONOMY: plan-only — show me the stories before creating tickets
```

### Prioritize a Backlog
```
ROLE: Product Owner
TASK: Rank these 12 backlog items by business value and technical risk
SCOPE: Consider only items tagged "Q2-2026" in JIRA
OUTPUT: Ranked table with columns: Rank, Story, Business Value (H/M/L), Technical Risk (H/M/L), Recommended Sprint, Rationale
CONSTRAINTS: Assume 2 sprints remaining in Q2. Team velocity: 34 points/sprint.
AUTONOMY: plan-only
```

### Write Acceptance Criteria
```
ROLE: Product Owner
TASK: Write acceptance criteria for JIRA-4567 (Multi-language form rendering)
SCOPE: Cover happy path, error states, and edge cases. Include accessibility (WCAG 2.1 AA).
OUTPUT: Gherkin scenarios (Given/When/Then), minimum 5 scenarios covering: success, validation error, timeout, missing translation, screen reader compatibility
CONSTRAINTS: Must align with existing API contract at docs/api/forms-v2.yaml
AUTONOMY: plan-only
```

---

## Program Manager / PMO

### Sprint Health Check
```
ROLE: PMO
TASK: Analyze Sprint 23 completion rate and identify risks for Sprint 24
SCOPE: All JIRA stories in PROJECT board, Sprint 23
OUTPUT: Summary with: completion %, carryover stories, velocity trend (last 3 sprints), top 3 risks for Sprint 24 with mitigations
CONSTRAINTS: Pull data from JIRA MCP. Reference team capacity calendar.
AUTONOMY: plan-only — analysis only, no JIRA modifications
```

### Release Readiness Assessment
```
ROLE: PMO
TASK: Generate release readiness report for v2.4.0
SCOPE: All repos in the sample portfolio (mobile-ios-app, companion-ios-app, mobile-android-app, shared-mobile-sdk, api-gateway, design-service)
OUTPUT: Release readiness matrix with 10 EXIT criteria status per repo, overall GO/NO-GO recommendation
CONSTRAINTS: Release target: March 15, 2026. Must include CVE scan results and backward compatibility status.
AUTONOMY: plan-only
```

### Cross-Team Dependency Map
```
ROLE: PMO
TASK: Map all cross-repo dependencies for the User Consent feature
SCOPE: Mobile (mobile-ios-app, companion-ios-app, mobile-android-app), Backend (api-gateway, design-service), Shared (shared-mobile-sdk)
OUTPUT: Dependency graph showing: which repo changes block which, suggested merge order, risk areas where parallel development may cause conflicts
CONSTRAINTS: Reference .ai/domain-governance.yaml for repo relationships
AUTONOMY: plan-only
```

---

## Engineering Manager

### PR Review (Comprehensive)
```
ROLE: Engineering Manager
TASK: Review PR #2106 for code quality, test coverage, architecture alignment, and risk
SCOPE: Review only — do not modify code, do not post comments to GitHub
OUTPUT: Structured findings categorized as CRITICAL / HIGH / MEDIUM / LOW, with file:line references and suggested fixes
CONSTRAINTS: shared-lib repo, branch fix/update-labels. Compare against existing patterns in the codebase.
AUTONOMY: full analysis, but do NOT post to GitHub. Return findings to me first.
```

### Team Velocity Analysis
```
ROLE: Engineering Manager
TASK: Analyze why Sprint 22 velocity dropped 20% compared to Sprint 21
SCOPE: JIRA data + git commit frequency + PR review turnaround times
OUTPUT: Root cause analysis with: contributing factors, data evidence, 3 actionable recommendations
CONSTRAINTS: JIRA MCP for sprint data, git log for commit patterns
AUTONOMY: plan-only
```

### Architecture Review
```
ROLE: Engineering Manager
TASK: Review the proposed encryption key rotation changes across iOS and Android
SCOPE: All files touching AppEnvironment.swift, Environment.kt, and any encryption-related endpoints
OUTPUT: Risk assessment with: backward compatibility impact, rollback plan, testing requirements, recommended rollout strategy (phased vs big-bang)
CONSTRAINTS: Must comply with .ai/decisions/ARCHITECTURE-FREEZE-v1.0.md. Requires architect approval per RBAC.
AUTONOMY: plan-only — this is an architecture-level decision
```

---

## Developer

### Implement a Story
```
ROLE: Developer
TASK: Implement JIRA-1234 — add isInlineLabels property to ScaleComponentLegendsPayload
SCOPE: Modify ScaleComponentPayload.swift and ALL test files that reference the initializer. Do not modify any view files.
OUTPUT: Working code + updated tests + all tests passing + commit ready for PR
CONSTRAINTS: Branch: fix/update-labels. Must pass existing test suite. Follow project naming conventions.
AUTONOMY: full — implement, test, self-heal, commit. Do NOT push or create PR.
```

### Fix a Bug
```
ROLE: Developer
TASK: Fix the race condition in WorkflowViewModel.submitForm() causing duplicate submissions on Samsung devices
SCOPE: WorkflowViewModel.kt, AppRepo.kt — do not modify NetworkClient.kt without approval
OUTPUT: Fix + unit test reproducing the race condition + E2E verification proof (show the idempotency key preventing duplicate writes)
CONSTRAINTS: Branch: fix/duplicate-submission. Must maintain backward compatibility with API v2.3.
AUTONOMY: review-first — show me the fix before committing
```

### Refactor with Confidence
```
ROLE: Developer
TASK: Extract shared validation logic from FormSubmissionService and ClinicalDataService into a ValidationUtils module
SCOPE: Only the validation functions — do not restructure service classes. Create ADR for this extraction.
OUTPUT: New ValidationUtils module + updated imports in both services + all existing tests passing + new unit tests for ValidationUtils
CONSTRAINTS: Follow DRY pattern per project rules. Coverage must remain >= 95%.
AUTONOMY: review-first — show me the extraction plan before implementing
```

### Suggest Tests (Without Writing Them)
```
ROLE: Developer
TASK: Identify all test files that need updating after adding the isInlineLabels parameter
SCOPE: Suggest only — do NOT write or modify any test files
OUTPUT: Table with columns: File | Line | Current Code | Required Change | Reason
CONSTRAINTS: shared-lib repo, Tests/ directory only
AUTONOMY: plan-only
```

---

## Tester / QA Engineer

### Generate Test Plan
```
ROLE: Tester
TASK: Create a comprehensive test plan for the User Consent multi-language feature
SCOPE: API integration tests + UI automation tests. Exclude unit tests (developer responsibility).
OUTPUT: Test plan document with: test categories, test cases (ID, description, precondition, steps, expected result), priority (P0-P3), automation feasibility
CONSTRAINTS: Must cover 5 languages (EN, FR, DE, JA, ZH). Must include accessibility testing. Reference API spec at docs/api/consent-v1.yaml
AUTONOMY: plan-only
```

### Regression Risk Analysis
```
ROLE: Tester
TASK: Analyze PR #2106 changes and identify regression risk areas
SCOPE: All files changed in the PR + their downstream consumers
OUTPUT: Risk matrix: Area | Risk Level | Why | Recommended Test | Automated?
CONSTRAINTS: Focus on backward compatibility with mobile-ios-app and companion-ios-app (shared SDK consumers)
AUTONOMY: plan-only
```

### E2E Verification Checklist
```
ROLE: Tester
TASK: Create an E2E verification checklist for the form submission flow after JIRA-5678 fix
SCOPE: Full submission path: UI form entry → API POST → database write → confirmation response
OUTPUT: Numbered checklist with: step, verification command or action, expected result, evidence format (screenshot, API response, DB query)
CONSTRAINTS: Must verify idempotency (submit same form twice, expect single DB record). Must verify on both iOS and Android paths.
AUTONOMY: plan-only
```

---

## Architect

### Technical Decision Evaluation
```
ROLE: Architect
TASK: Evaluate whether to use TOON (TOML format) or session-ledger.md (Markdown) for ALCOA+ audit compliance
SCOPE: Technical comparison only — no implementation
OUTPUT: Decision matrix scoring both options on: parseability, token efficiency, IDE portability, ALCOA+ compliance, maintenance burden, tooling ecosystem. Include ADR draft with recommendation.
CONSTRAINTS: Must satisfy 21 CFR Part 11 requirements. Consider cross-IDE portability across all AGENTS.md-compatible editors.
AUTONOMY: plan-only — present analysis for architecture review board
```

### Cross-Repo Impact Analysis
```
ROLE: Architect
TASK: Assess the impact of upgrading the shared library's minimum iOS deployment target
SCOPE: shared-lib and all consuming apps
OUTPUT: Impact report with: API surface changes, deprecated API usage count, App Store analytics (iOS 15 user %), migration effort estimate, recommended timeline
CONSTRAINTS: Must maintain 18-month backward compatibility window per Platform governance. Reference .ai/domain-governance.yaml
AUTONOMY: plan-only
```

### Knowledge Graph Review
```
ROLE: Architect
TASK: Review the current Platform Knowledge Graph for accuracy and completeness
SCOPE: All 18 repos in domain-governance.yaml
OUTPUT: Gap analysis: missing repos, incorrect dependencies, outdated risk levels, suggested new edges (service-to-service relationships not captured)
CONSTRAINTS: Reference docs/knowledge-graph/knowledge-graph.json as source of truth
AUTONOMY: plan-only
```

---

## Guidelines for Better Prompting

### Do's
1. **Start with the verb**: "Review", "Implement", "Suggest", "Break down" — not "Help me with" or "Can you look at"
2. **Set AUTONOMY explicitly**: The single most important field. Prevents agents from acting when you wanted advice, or stopping when you wanted action.
3. **Define SCOPE boundaries**: What NOT to do is as important as what to do. "Do not modify view files" prevents scope creep.
4. **Specify OUTPUT format**: "JIRA-ready stories", "Risk matrix table", "ADR draft" — concrete format expectations eliminate rework.
5. **Reference specific files/branches**: "Branch: fix/update-labels" is actionable. "The feature branch" is ambiguous.
6. **Include constraints that matter**: Coverage targets, sprint timelines, backward compatibility requirements.

### Don'ts
1. **Don't say "help me with X"** — Say what you want done: "Review X", "Plan X", "Build X"
2. **Don't assume the agent knows your intent** — If you want analysis without code changes, say `AUTONOMY: plan-only`
3. **Don't combine unrelated tasks** — "Review this PR and also set up CI for the other repo" should be two separate prompts
4. **Don't omit scope** — Without scope, agents may modify files you didn't intend
5. **Don't forget to say when you want to be asked** — If the task is ambiguous, add: "If TASK or SCOPE is unclear, ask before proceeding"

### When the Agent Should Ask for Clarity
The agent MUST ask if:
- TASK uses ambiguous verbs: "do", "help", "handle", "look at"
- SCOPE is missing entirely
- AUTONOMY conflicts with TASK (e.g., TASK says "implement" but AUTONOMY says "plan-only")
- CONSTRAINTS reference files or branches that don't exist
- The task requires destructive operations (force push, delete, overwrite) without explicit approval

---

## Quick Reference Card

| I want to... | Start with... | Set AUTONOMY to... |
|--------------|--------------|-------------------|
| Understand something | "Analyze", "Explain", "Compare" | plan-only |
| Get suggestions | "Suggest", "Recommend", "Identify" | plan-only |
| See a plan before action | "Plan", "Design", "Break down" | review-first |
| Get work done | "Implement", "Fix", "Build", "Create" | full or review-first |
| Ship it | "Ship", "Release", "Deploy" | review-first (always) |

---

*This guide is a living document. As the team discovers new patterns that work well, add them here. The best templates come from real sessions — if a prompt consistently produces great results, contribute it back.*
