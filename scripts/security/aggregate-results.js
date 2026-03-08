#!/usr/bin/env node
/**
 * aggregate-results.js — Merge per-repo scan results into knowledge-graph.json
 *
 * Usage: node aggregate-results.js <scan-results-dir> <knowledge-graph.json>
 *
 * Reads all *.json files from scan-results-dir, matches them to nodes in
 * the knowledge graph by repo ID, and updates risk levels + scan metadata.
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = process.argv[2];
const KG_FILE = process.argv[3];

if (!RESULTS_DIR || !KG_FILE) {
  console.error('Usage: node aggregate-results.js <scan-results-dir> <knowledge-graph.json>');
  process.exit(1);
}

const kg = JSON.parse(fs.readFileSync(KG_FILE, 'utf8'));

const REPO_TO_NODE_ID = {
  'mobile-ios-app': 'mobile-ios-app',
  'companion-ios-app': 'companion-ios-app',
  'mobile-android-app': 'mobile-android-app',
  'shared-mobile-sdk': 'shared-mobile-sdk',
  'mobile-telemetry-sdk': 'mobile-telemetry-sdk',
  'api-gateway': 'api-gateway',
  'design-service': 'design-service',
  'analytics-web': 'analytics-web',
  'admin-console': 'admin-console',
  'customer-portal': 'customer-portal',
  'workflow-studio-web': 'workflow-studio-web',
  'config-studio': 'config-studio',
  'account-directory': 'account-directory',
  'account-directory-service': 'account-directory',
  'preferences-web': 'preferences-web',
  'preferences-service': 'preferences-web',
  'localization-service': 'localization-service',
  'rules-engine-service': 'rules-engine-service',
  'feature-config-service': 'feature-config-service',
  'orchestration-service': 'orchestration-service',
};

const scanFiles = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
let totalFindings = 0;
let highCritRepos = [];

for (const file of scanFiles) {
  const scan = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, file), 'utf8'));
  const nodeId = REPO_TO_NODE_ID[scan.repo] || scan.repo;
  const node = kg.nodes.find(n => n.id === nodeId);

  if (!node) {
    console.warn(`  [skip] No KG node for repo "${scan.repo}" (mapped: "${nodeId}")`);
    continue;
  }

  node.scan = {
    scanned_at: scan.scanned_at,
    stack: scan.stack,
    vulnerabilities: scan.vulnerabilities,
    outdated_packages: scan.outdated_packages,
    secrets_detected: scan.secrets_detected,
    license_issues: scan.license_issues,
  };

  const v = scan.vulnerabilities || {};
  const scanRisks = [];

  if (v.critical > 0) scanRisks.push(`${v.critical} CRITICAL CVE(s) detected`);
  if (v.high > 0) scanRisks.push(`${v.high} HIGH severity CVE(s)`);
  if (v.medium > 0) scanRisks.push(`${v.medium} MEDIUM severity CVE(s)`);
  if (scan.secrets_detected > 0) scanRisks.push(`${scan.secrets_detected} leaked secret(s) detected`);
  if (scan.outdated_packages > 5) scanRisks.push(`${scan.outdated_packages} outdated packages`);
  if (scan.license_issues > 0) scanRisks.push(`${scan.license_issues} license compliance issue(s)`);

  if (scanRisks.length > 0) {
    const existingRisks = node.risks || [];
    const existingSet = new Set(existingRisks);
    for (const r of scanRisks) {
      if (!existingSet.has(r)) existingRisks.push(r);
    }
    node.risks = existingRisks;
  }

  if (scan.risk === 'critical' || scan.risk === 'high') {
    if (node.risk !== 'high') node.risk = 'high';
    highCritRepos.push(scan.repo);
  } else if (scan.risk === 'med' && node.risk === 'low') {
    node.risk = 'med';
  }

  totalFindings += (v.total || 0) + (scan.secrets_detected || 0);
  console.log(`  [merged] ${scan.repo} → ${nodeId}: risk=${scan.risk}, vulns=${v.total || 0}, outdated=${scan.outdated_packages || 0}`);
}

kg.meta.generated = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
kg.meta.last_scan = kg.meta.generated;
kg.meta.total_findings = totalFindings;

fs.writeFileSync(KG_FILE, JSON.stringify(kg, null, 2) + '\n');

console.log(`\n=== Aggregation Complete ===`);
console.log(`  Scans merged: ${scanFiles.length}`);
console.log(`  Total findings: ${totalFindings}`);
console.log(`  High/Critical repos: ${highCritRepos.length > 0 ? highCritRepos.join(', ') : 'none'}`);

if (highCritRepos.length > 0) {
  const alertFile = path.join(RESULTS_DIR, 'alerts.json');
  fs.writeFileSync(alertFile, JSON.stringify({
    alert: true,
    severity: 'HIGH',
    repos: highCritRepos,
    total_findings: totalFindings,
    timestamp: kg.meta.generated,
  }, null, 2) + '\n');
  console.log(`  Alert file written: ${alertFile}`);
}
