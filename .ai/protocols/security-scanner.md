# Security-Scanner Protocol — IDE-Local Security Checks

Fast, local security scanning that runs before commits (complement to CI-based Dependency-Auditor).

## Trigger
- New dependency added
- Before PR (alongside Review Council)
- User says "audit", "security scan"

## Checks

### 1. Secrets Detection
- Scan for API keys, tokens, passwords in code
- Check .env files are in .gitignore
- Patterns: AWS keys, JWT tokens, database URLs with credentials

### 2. License Compliance
- Check new dependency licenses
- Flag: GPL (if project is proprietary), AGPL, unknown
- Allow: MIT, Apache-2.0, BSD, ISC

### 3. Supply Chain Risk
- Check new packages for:
  - Typosquatting (similar names to popular packages)
  - Recent ownership changes
  - Low download counts with broad permissions

### 4. SBOM Generation
- Generate Software Bill of Materials on init and release
- Format: CycloneDX JSON
- Store in .ai/sbom-current.json

## Output
Write to .ai/agent-exchange/security-scanner-output.md

## Rules
- Secrets in code = ALWAYS BLOCK (no exceptions)
- License issues = WARN with explanation
- Supply chain = WARN with risk assessment
- SBOM = regenerate on every release tag
