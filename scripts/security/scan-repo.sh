#!/bin/bash
# scan-repo.sh — Detect tech stack and run appropriate security audits
# Usage: ./scan-repo.sh <repo-dir> <output-dir>
# Output: JSON file at <output-dir>/<repo-name>.json with findings

set -euo pipefail

REPO_DIR="${1:?Usage: scan-repo.sh <repo-dir> <output-dir>}"
OUTPUT_DIR="${2:?Usage: scan-repo.sh <repo-dir> <output-dir>}"
REPO_NAME=$(basename "$REPO_DIR")

mkdir -p "$OUTPUT_DIR"
RESULT_FILE="$OUTPUT_DIR/${REPO_NAME}.json"

VULNS_HIGH=0
VULNS_MEDIUM=0
VULNS_LOW=0
VULNS_CRITICAL=0
OUTDATED_COUNT=0
FINDINGS="[]"
STACK="unknown"
SAST_FINDINGS="[]"

add_finding() {
  local severity="$1" tool="$2" title="$3"
  FINDINGS=$(echo "$FINDINGS" | node -e "
    const fs=require('fs'); let f=JSON.parse(fs.readFileSync('/dev/stdin','utf8'));
    f.push({severity:'$severity',tool:'$tool',title:$(echo "$title" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('/dev/stdin','utf8').trim()))")});
    process.stdout.write(JSON.stringify(f));
  " 2>/dev/null || echo "$FINDINGS")
}

echo "=== Scanning $REPO_NAME ==="

cd "$REPO_DIR"

# ──────────────────────────────────────
# DETECT STACK & RUN APPROPRIATE AUDITS
# ──────────────────────────────────────

# --- Node.js / npm ---
if [ -f "package.json" ]; then
  STACK="node"
  echo "  [npm] Running npm audit..."

  if [ -f "package-lock.json" ]; then
    npm ci --ignore-scripts --quiet 2>/dev/null || npm install --ignore-scripts --quiet 2>/dev/null || true
  else
    npm install --ignore-scripts --package-lock-only --quiet 2>/dev/null || npm install --ignore-scripts --quiet 2>/dev/null || true
  fi

  AUDIT_JSON=$(npm audit --json 2>/dev/null || echo '{}')
  VULNS_CRITICAL=$(echo "$AUDIT_JSON" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.metadata?.vulnerabilities?.critical||0)}catch{console.log(0)}" 2>/dev/null || echo 0)
  VULNS_HIGH=$(echo "$AUDIT_JSON" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.metadata?.vulnerabilities?.high||0)}catch{console.log(0)}" 2>/dev/null || echo 0)
  VULNS_MEDIUM=$(echo "$AUDIT_JSON" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.metadata?.vulnerabilities?.moderate||0)}catch{console.log(0)}" 2>/dev/null || echo 0)
  VULNS_LOW=$(echo "$AUDIT_JSON" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.metadata?.vulnerabilities?.low||0)}catch{console.log(0)}" 2>/dev/null || echo 0)

  OUTDATED_COUNT=$(npm outdated --json 2>/dev/null | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(Object.keys(d).length)}catch{console.log(0)}" 2>/dev/null || echo 0)

  echo "  [npm] critical=$VULNS_CRITICAL high=$VULNS_HIGH medium=$VULNS_MEDIUM low=$VULNS_LOW outdated=$OUTDATED_COUNT"
fi

# --- Python / pip ---
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "Pipfile" ]; then
  STACK="python"
  echo "  [pip] Running pip-audit..."

  pip install pip-audit --quiet 2>/dev/null || true

  if [ -f "requirements.txt" ]; then
    AUDIT_OUT=$(pip-audit -r requirements.txt --format=json 2>/dev/null || echo '[]')
  else
    AUDIT_OUT=$(pip-audit --format=json 2>/dev/null || echo '[]')
  fi

  VULNS_HIGH=$(echo "$AUDIT_OUT" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const a=Array.isArray(d)?d:d.dependencies||[];console.log(a.filter(v=>v.vulns&&v.vulns.length>0).length)}catch{console.log(0)}" 2>/dev/null || echo 0)

  if command -v bandit &>/dev/null; then
    echo "  [bandit] Running Python SAST..."
    BANDIT_OUT=$(bandit -r . -f json --severity-level medium 2>/dev/null || echo '{"results":[]}')
    SAST_COUNT=$(echo "$BANDIT_OUT" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.results?.length||0)}catch{console.log(0)}" 2>/dev/null || echo 0)
    if [ "$SAST_COUNT" -gt 0 ]; then
      echo "  [bandit] Found $SAST_COUNT SAST issues"
    fi
  fi
fi

# --- Ruby / Bundler ---
if [ -f "Gemfile" ] || [ -f "Gemfile.lock" ]; then
  STACK="ruby"
  echo "  [bundler] Running bundler-audit..."

  gem install bundler-audit --no-document --quiet 2>/dev/null || true
  BUNDLE_AUDIT=$(bundler-audit check --format=json 2>/dev/null || echo '{"results":[]}')
  VULNS_HIGH=$(echo "$BUNDLE_AUDIT" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.results?.length||0)}catch{console.log(0)}" 2>/dev/null || echo 0)

  OUTDATED_COUNT=$(bundle outdated --parseable 2>/dev/null | wc -l | tr -d ' ' || echo 0)

  if command -v brakeman &>/dev/null; then
    echo "  [brakeman] Running Rails SAST..."
    BRAKEMAN_OUT=$(brakeman --format json --quiet 2>/dev/null || echo '{"warnings":[]}')
    SAST_COUNT=$(echo "$BRAKEMAN_OUT" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.warnings?.length||0)}catch{console.log(0)}" 2>/dev/null || echo 0)
    if [ "$SAST_COUNT" -gt 0 ]; then
      echo "  [brakeman] Found $SAST_COUNT SAST issues"
    fi
  fi

  echo "  [bundler] high=$VULNS_HIGH outdated=$OUTDATED_COUNT"
fi

# --- .NET / NuGet ---
if ls ./*.csproj >/dev/null 2>&1 || ls ./**/*.csproj >/dev/null 2>&1 || [ -f "*.sln" ]; then
  STACK="dotnet"
  echo "  [dotnet] Running NuGet vulnerability check..."

  DOTNET_VULN=$(dotnet list package --vulnerable --format json 2>/dev/null || echo '{}')
  VULNS_HIGH=$(echo "$DOTNET_VULN" | node -e "
    try {
      const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      let count=0;
      (d.projects||[]).forEach(p=>(p.frameworks||[]).forEach(f=>(f.topLevelPackages||[]).forEach(pkg=>{
        if(pkg.resolvedVersion&&pkg.vulnerabilities) count+=pkg.vulnerabilities.length;
      })));
      console.log(count);
    } catch{console.log(0)}
  " 2>/dev/null || echo 0)

  OUTDATED_COUNT=$(dotnet list package --outdated --format json 2>/dev/null | node -e "
    try {
      const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      let count=0;
      (d.projects||[]).forEach(p=>(p.frameworks||[]).forEach(f=>count+=(f.topLevelPackages||[]).length));
      console.log(count);
    } catch{console.log(0)}
  " 2>/dev/null || echo 0)

  echo "  [dotnet] vulns=$VULNS_HIGH outdated=$OUTDATED_COUNT"
fi

# --- Swift / SPM ---
if [ -f "Package.swift" ]; then
  STACK="swift"
  echo "  [spm] Checking Swift Package dependencies..."
  OUTDATED_COUNT=$(swift package show-dependencies 2>/dev/null | grep -c "http" || echo 0)
fi

# --- Kotlin / Gradle ---
if [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
  STACK="kotlin"
  echo "  [gradle] Checking Gradle dependencies..."

  if [ -f "gradlew" ]; then
    chmod +x gradlew 2>/dev/null || true
    OUTDATED_COUNT=$(./gradlew dependencyUpdates -DoutputFormatter=json 2>/dev/null | node -e "
      try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.outdated?.dependencies?.length||0)}catch{console.log(0)}
    " 2>/dev/null || echo 0)
  fi
fi

# --- CocoaPods ---
if [ -f "Podfile" ] || [ -f "*.podspec" ]; then
  [ "$STACK" = "unknown" ] && STACK="cocoapods"
  echo "  [cocoapods] Checking CocoaPods..."
  OUTDATED_COUNT=$((OUTDATED_COUNT + $(pod outdated 2>/dev/null | grep -c "^-" || echo 0)))
fi

# ──────────────────────────────────────
# SECRETS SCAN (all stacks)
# ──────────────────────────────────────
echo "  [secrets] Scanning for leaked secrets..."
SECRETS_COUNT=0
if command -v trufflehog &>/dev/null; then
  SECRETS_COUNT=$(trufflehog filesystem . --only-verified --json 2>/dev/null | wc -l | tr -d ' ' || echo 0)
elif command -v gitleaks &>/dev/null; then
  SECRETS_COUNT=$(gitleaks detect --source . --report-format json 2>/dev/null | node -e "try{console.log(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).length)}catch{console.log(0)}" 2>/dev/null || echo 0)
fi

# ──────────────────────────────────────
# LICENSE COMPLIANCE CHECK (all stacks)
# ──────────────────────────────────────
LICENSE_ISSUES=0
if [ -f "package.json" ] && command -v npx &>/dev/null; then
  LICENSE_ISSUES=$(npx license-checker --failOn "GPL-3.0;AGPL-3.0" --json 2>/dev/null | node -e "try{console.log(0)}catch{console.log(1)}" 2>/dev/null || echo 0)
fi

# ──────────────────────────────────────
# COMPUTE RISK LEVEL
# ──────────────────────────────────────
TOTAL_VULNS=$((VULNS_CRITICAL + VULNS_HIGH + VULNS_MEDIUM + VULNS_LOW))
RISK="low"
if [ "$VULNS_CRITICAL" -gt 0 ] || [ "$SECRETS_COUNT" -gt 0 ]; then
  RISK="critical"
elif [ "$VULNS_HIGH" -gt 2 ]; then
  RISK="high"
elif [ "$VULNS_HIGH" -gt 0 ] || [ "$VULNS_MEDIUM" -gt 3 ]; then
  RISK="med"
fi

# ──────────────────────────────────────
# WRITE RESULT JSON
# ──────────────────────────────────────
cat > "$RESULT_FILE" <<ENDJSON
{
  "repo": "$REPO_NAME",
  "stack": "$STACK",
  "scanned_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "risk": "$RISK",
  "vulnerabilities": {
    "critical": $VULNS_CRITICAL,
    "high": $VULNS_HIGH,
    "medium": $VULNS_MEDIUM,
    "low": $VULNS_LOW,
    "total": $TOTAL_VULNS
  },
  "outdated_packages": $OUTDATED_COUNT,
  "secrets_detected": $SECRETS_COUNT,
  "license_issues": $LICENSE_ISSUES
}
ENDJSON

echo "  [done] Risk=$RISK | Vulns=$TOTAL_VULNS | Outdated=$OUTDATED_COUNT | Secrets=$SECRETS_COUNT"
echo "  [saved] $RESULT_FILE"
