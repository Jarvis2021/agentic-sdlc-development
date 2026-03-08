---
name: story-breakdown
description: Provides story breakdown format and Gherkin acceptance criteria guidelines for agile development. Use when creating user stories, defining acceptance criteria, or breaking down epics into implementable units. Contains story template with 2-4 hour constraint, Given-When-Then format, and dependency mapping. Required for story development in plan phase.
argument-hint: Provide the story or feature to break down with Gherkin
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## Story Format

Stories should be completable in 2-4 hours of focused work for sustainable velocity.

### Story Template

```markdown
### Story [NUMBER]: [Title]

**Story Points**: [Points] (Traditional) | [Points] (AI-Assisted)
**Story Title**: [Descriptive title]
**Confidence**: [%] - [Rationale]

#### Description

##### Background
- **Business Context**: [Why is this needed?]
- **Technical Rationale**: [Why this approach?]
- **Risk Mitigation**: [What could go wrong?]
- **Dependency Context**: [What must exist first?]

##### Objective
- **Primary Goal**: [What must be achieved]
- **Technical Scope**: [Files/components affected]
- **Validation Target**: [How to verify success]
- **Safety Requirement**: [Quality constraints - coverage, performance, security]

#### Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

#### Test Cases

[Gherkin scenarios or test descriptions]
```

### Gherkin Acceptance Criteria

Use Given-When-Then format for acceptance criteria:

```gherkin
Feature: [Feature name]

  Scenario: [Scenario description]
    Given [initial context]
    And [additional context]
    When [action is performed]
    Then [expected outcome]
    And [additional outcome]
```

### Example Gherkin

```gherkin
Feature: User Authentication

  Scenario: Successful login with valid credentials
    Given a registered user with email "user@example.com"
    And the user has password "SecurePass123"
    When the user submits login credentials
    Then the user is redirected to dashboard
    And a session token is generated
    And the session expires after 30 minutes
```

### Story Size Guidelines

| Size | Duration | Complexity |
|------|----------|------------|
| **Small** | 1-2 hours | Single file, simple logic |
| **Medium** | 2-4 hours | Multiple files, moderate logic |
| **Large** | >4 hours | **Split required** |

If a story exceeds 4 hours, break it down further.

### Dependency Types

| Type | Abbreviation | Meaning |
|------|--------------|---------|
| Finish-to-Start | **FS** | B starts after A finishes |
| Start-to-Start | **SS** | B starts when A starts |
| Finish-to-Finish | **FF** | B finishes when A finishes |
| Start-to-Finish | **SF** | B finishes when A starts |

### Story Map Structure (Hierarchical Decomposition)

Three-level hierarchy for large initiatives:

1. **Activities** - High-level user goals (e.g., "User Management")
2. **Steps** - Actions within activities (e.g., "Create User," "Edit User," "Delete User")
3. **Details** - Specific implementation tasks (e.g., "Validate email format," "Hash password")

### Critical Rules

- ❌ Never allow stories larger than 4 hours without splitting
- ❌ Never skip acceptance criteria section
- ✅ Always include Gherkin scenarios for testable stories
- ✅ Always map dependencies between stories
- ✅ Always include test cases or test plan

### Session Ledger Entry for Story Creation

When creating stories, log to `.ai/session-ledger.md`:

```markdown
## [2026-01-15T10:30:00Z] | Agent: Planner | Phase: plan | Story: PROJ-NNN
Decision: Story breakdown complete for feature [X]
Rationale: Created 5 stories totaling 12 hours estimated work, with dependencies mapped
Files affected: .ai/agent-exchange/planner-output.md
Cost: ~0.08 USD | Tokens: 2500 in / 1200 out | Model: strongest
```
