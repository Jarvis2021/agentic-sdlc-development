# Contract-Guard Protocol — API Contract Enforcement

Prevents backward compatibility breaks between mobile clients (iOS/Android) and
backend services. Enforces 18-month backward compatibility window.

## Trigger (AUTOMATIC)
- Any change to API endpoints (routes, request/response schema)
- Any change to database schema (migrations)
- Any change to Kafka/Archon event schemas
- Any change to encryption-layer contracts (ProxyPayload, ProxyApi, salt strings)
- Before EVERY PR (full scan)
- User says "audit" or "contract check"

## Tools

1. SPECTRAL (.spectral.yaml): OpenAPI linting with custom Platform rules
   Blocks on: missing operationId, missing examples, breaking schema changes

2. BUMP.SH (PR check): Detects breaking changes in OpenAPI diff
   Blocks on: field removed, type changed, required field added, endpoint removed

3. PACT (consumer-driven): Verifies provider changes don't break mobile consumers
   Verifies against: ios-latest, ios-prev-1, ios-prev-2, android-latest, android-prev-1

## Platform-Specific Contract Rules

### encryption Salt Contract
- AppEnvironment.swift (iOS) and Environment.kt (Android) must have IDENTICAL salts
  per environment. Any mismatch = BLOCK. Requires architect ADR.

### shared-lib Shared Model Contract
- Shared model changes affect ALL consuming applications
- Any field removal or type change = BLOCK until both apps verified

### Idempotency Contract
- All domain-specific data write endpoints MUST include idempotency key in request schema

### Mobile Backward Compat Window
- New fields: additive (OK, PASS)
- Changed field types: BLOCK
- Removed fields: BLOCK (18-month minimum retention)
- New required fields: BLOCK (mobile may not send them)

## Output
Write to .ai/agent-exchange/contract-guard-output.md
