#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const output = {
  timestamp: new Date().toISOString(),
  repos: [process.env.GITHUB_REPOSITORY || 'unknown'],
  vulnerabilities: [],
  outdated: [],
  summary: { critical: 0, high: 0, medium: 0, low: 0, outdated: 0 }
};

if (fs.existsSync('audit-npm.json')) {
  const npm = JSON.parse(fs.readFileSync('audit-npm.json', 'utf8'));
  for (const [, vuln] of Object.entries(npm.vulnerabilities || {})) {
    output.vulnerabilities.push({
      ecosystem: 'npm',
      package: vuln.name,
      severity: vuln.severity,
      cve: vuln.cves?.[0] || vuln.via?.[0]?.cve || 'N/A',
      current: vuln.range,
      fixed: vuln.fixAvailable ? 'yes' : 'no'
    });
    output.summary[vuln.severity] = (output.summary[vuln.severity] || 0) + 1;
  }
}

if (fs.existsSync('outdated-npm.json')) {
  const outdated = JSON.parse(fs.readFileSync('outdated-npm.json', 'utf8'));
  for (const [name, info] of Object.entries(outdated)) {
    output.outdated.push({
      ecosystem: 'npm',
      package: name,
      current: info.current,
      latest: info.latest,
      type: info.type
    });
    output.summary.outdated++;
  }
}

if (fs.existsSync('audit-python.json')) {
  const python = JSON.parse(fs.readFileSync('audit-python.json', 'utf8'));
  for (const vuln of python.vulnerabilities || []) {
    const severity = vuln.fix_versions ? 'medium' : 'high';
    output.vulnerabilities.push({
      ecosystem: 'python',
      package: vuln.name,
      severity,
      cve: vuln.id,
      current: vuln.version,
      fixed: vuln.fix_versions?.join(', ') || 'N/A'
    });
    output.summary[severity] = (output.summary[severity] || 0) + 1;
  }
}

if (fs.existsSync('outdated-python.json')) {
  const outdated = JSON.parse(fs.readFileSync('outdated-python.json', 'utf8'));
  for (const pkg of outdated) {
    output.outdated.push({
      ecosystem: 'python',
      package: pkg.name,
      current: pkg.version,
      latest: pkg.latest_version,
      type: 'unknown'
    });
    output.summary.outdated++;
  }
}

if (fs.existsSync('audit-ruby.json')) {
  const ruby = JSON.parse(fs.readFileSync('audit-ruby.json', 'utf8'));
  for (const vuln of ruby.results || []) {
    const severity = vuln.criticality || 'medium';
    output.vulnerabilities.push({
      ecosystem: 'ruby',
      package: vuln.gem.name,
      severity,
      cve: vuln.cve || vuln.osvdb || 'N/A',
      current: vuln.gem.version,
      fixed: vuln.patched_versions?.join(', ') || 'N/A'
    });
    output.summary[severity] = (output.summary[severity] || 0) + 1;
  }
}

fs.mkdirSync('.ai', { recursive: true });
fs.writeFileSync('.ai/dependency-status.json', JSON.stringify(output, null, 2));
console.log('Merged audit reports -> .ai/dependency-status.json');
console.log(`Summary: ${output.summary.critical} critical, ${output.summary.high} high, ${output.summary.medium} medium, ${output.summary.low} low, ${output.summary.outdated} outdated`);
