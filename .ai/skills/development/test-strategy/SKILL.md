---
name: test-strategy
description: Provides test pyramid structure, coverage thresholds, and test strategy guidelines. Use when defining test distribution, setting coverage requirements, or creating test quality standards. Contains unit/integration/E2E ratios, coverage enforcement commands, and CI pipeline configuration. Required for test strategy and Quality-Gate enforcement.
argument-hint: Describe the component or feature to create test strategy for
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## Test Pyramid Structure

Recommended test distribution for sustainable quality and fast feedback loops.

### Test Distribution Ratios

| Layer | Ratio | Characteristics |
|-------|-------|-----------------|
| **Unit Tests** | 70% | Fast (<10ms each), isolated, mocked dependencies |
| **Integration Tests** | 20% | Component interactions, real dependencies (DB, APIs) |
| **E2E Tests** | 10% | Critical user flows only (slow, brittle) |

### Why This Ratio?

- **Unit tests** are fast and cheap - run thousands in seconds
- **Integration tests** catch interface issues - moderate cost
- **E2E tests** are slow and brittle - use sparingly for critical paths only

Inverting this pyramid (many E2E, few unit) leads to slow CI and brittle tests.

## Coverage Thresholds

### Framework vs Consumer Standards

| Context | Threshold | Rationale |
|---------|-----------|-----------|
| **Framework Code** | 100% | Framework multiplier effect - bugs propagate to all consumers |
| **Consumer Code** | 98% | High standard with practical flexibility |
| **Absolute Floor** | 80% | Never allow below this (releases blocked) |

Reference: Our framework uses 95% as Quality-Gate threshold (configurable in `project-config.yaml`).

### Coverage Metrics

Measure all four dimensions:

- **Branches** - Decision points covered (if/else, switch, ternary)
- **Functions** - Functions executed at least once
- **Lines** - Lines executed
- **Statements** - Statements executed

### Coverage Commands by Tech Stack

| Stack | Command | Threshold Flag |
|-------|---------|----------------|
| Node.js/Jest | `npm test -- --coverage` | `--coverageThreshold='{"global":{"lines":98}}'` |
| Python/pytest | `pytest --cov` | `--cov-fail-under=98` |
| Go | `go test -coverprofile` | Manual threshold check |
| Ruby/RSpec | `rspec` | `SimpleCov.minimum_coverage 98` |
| Rust | `cargo tarpaulin` | `--fail-under 98` |

## Test Quality Standards

### Naming Convention

Tests should be descriptive and behavior-focused:

```
✅ "should return 404 when user not found"
✅ "should hash password before saving user"
❌ "test1" or "testGetUser"
```

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should calculate total with discount', () => {
  // Arrange
  const cart = new Cart();
  cart.addItem({ price: 100 });
  cart.applyDiscount(0.1);

  // Act
  const total = cart.getTotal();

  // Assert
  expect(total).toBe(90);
});
```

### Test Isolation Requirements

- Tests must not depend on execution order
- Tests must not share mutable state
- Tests must clean up after themselves (teardown)
- Tests must be deterministic (no flaky tests, no random data)

## CI Coverage Enforcement

### Quick vs Thorough Split

| Phase | Speed | Checks |
|-------|-------|--------|
| **Pre-commit** | < 30 sec | Lint + affected tests only |
| **CI Pipeline** | Unlimited | Full suite + coverage gate |

### Enforcement Authority

Quality-Gate protocol can BLOCK merges for:

- ❌ Coverage below threshold (defined in `project-config.yaml`)
- ❌ Flaky tests (non-deterministic, intermittent failures)
- ❌ Missing edge case coverage (error paths, boundaries)
- ❌ Tests without assertions (empty tests)

## Test Strategy Documentation

When defining test strategy for a feature, document in `.ai/agent-exchange/test-strategy-output.md`:

```markdown
# Test Strategy - [Feature/Story ID]

## Coverage Target
[X]% overall, broken down by layer

## Test Distribution
- Unit: [X] tests
- Integration: [X] tests
- E2E: [X] tests

## Critical Paths (E2E)
1. [Path 1]
2. [Path 2]

## Edge Cases
- [Case 1]
- [Case 2]

## Performance Requirements
- [Metric]: [Target]
```

## Session Ledger Entry for Test Strategy

When creating test strategy, log to `.ai/session-ledger.md`:

```markdown
## [2026-01-15T11:00:00Z] | Agent: Implementer | Phase: implement | Story: PROJ-NNN
Decision: Test strategy defined for authentication module
Rationale: 98% coverage target, 15 unit + 5 integration + 2 E2E tests planned
Files affected: .ai/agent-exchange/test-strategy-output.md, tests/
Cost: ~0.10 USD | Tokens: 3000 in / 1500 out | Model: strongest
```
