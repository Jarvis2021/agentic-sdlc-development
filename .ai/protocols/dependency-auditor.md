# Dependency-Auditor Protocol — CI-Powered CVE & Outdated Package Scanner

Automated dependency auditing across all ecosystems. Runs in CI (IDE-agnostic).

## Triggers
- Scheduled CI: Weekly (Monday 6am UTC) via GitHub Actions
- Pre-PR: Before every pull request
- IDE-local: User says "deps", "outdated", or "audit deps"
- Package install: After npm install, pip install, bundle install, etc.

## What Gets Scanned

### 1. Outdated Packages
| Ecosystem | Tool | Command |
|-----------|------|---------|
| npm/pnpm/yarn | npm outdated | npm outdated --json |
| Python | pip | pip list --outdated --format=json |
| Ruby | bundler | bundle outdated --parseable |
| .NET | dotnet | dotnet list package --outdated --format json |
| iOS | CocoaPods | pod outdated --no-color |
| Android | Gradle | ./gradlew dependencyUpdates |
| Go | go | go list -u -m -json all |

### 2. Known Vulnerabilities (CVEs)
| Ecosystem | Tool | Command |
|-----------|------|---------|
| npm | npm audit | npm audit --json |
| Python | pip-audit | pip-audit --format=json |
| Ruby | bundler-audit | bundle audit check --format=json |
| Go | govulncheck | govulncheck -json ./... |
| Rust | cargo-audit | cargo audit --json |
| .NET | dotnet | dotnet list package --vulnerable --format json |

### 3. GitHub Dependabot API
Query Dependabot alerts via REST API. Requires GITHUB_TOKEN with security_events scope.

### 4. SBOM Diff
Compare current SBOM against previous on release tags.

## Severity Levels
| Level | Action | Example |
|-------|--------|---------|
| CRITICAL | BLOCK PR, alert Slack immediately | Known RCE, auth bypass |
| HIGH | BLOCK PR until resolved | SQL injection in dep |
| MEDIUM | WARN, require ADR justification | Deprecated dep |
| LOW | NOTE in output | Minor CVE with no exploit path |

## Output
Write to .ai/agent-exchange/dependency-auditor-output.md

## Cross-Reference: Security-Scanner vs Dependency-Auditor
| Concern | Agent | Scope | When |
|---------|-------|-------|------|
| Secrets detection | Security-Scanner | IDE-local | Every commit |
| License compliance | Security-Scanner | IDE-local | New dependency |
| CVEs (known vulns) | Dependency-Auditor | CI (weekly + PR) | Scheduled + PR |
| Outdated packages | Dependency-Auditor | CI (weekly + PR) | Scheduled + PR |

Both agents run before PR. Security-Scanner is IDE-triggered.
Dependency-Auditor is CI-triggered (comprehensive, IDE-agnostic).

## Rules
- NEVER allow CRITICAL/HIGH vulnerability to pass into production
- ALWAYS run audit before PR
- SBOM must be regenerated on every release tag
