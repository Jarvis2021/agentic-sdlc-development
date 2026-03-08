const fs = require('fs');
const path = require('path');

function validateAgentFiles(rootDir) {
  const errors = [];
  const warnings = [];

  const contextIndexPath = path.join(rootDir, '.ai', 'context-index.yaml');
  if (!fs.existsSync(contextIndexPath)) {
    errors.push('Missing .ai/context-index.yaml');
    return { valid: false, errors, warnings };
  }

  const indexContent = fs.readFileSync(contextIndexPath, 'utf8');

  const agentNames = [];
  const agentBlock = indexContent.match(/^agents:\s*\n([\s\S]*?)(?=\n[^\s]|\n*$)/m);
  if (agentBlock) {
    const matches = agentBlock[1].matchAll(/^\s{2}(\w+):/gm);
    for (const m of matches) {
      agentNames.push(m[1]);
    }
  }

  if (agentNames.length === 0) {
    errors.push('No agents found in context-index.yaml');
  }

  const protocolDir = path.join(rootDir, '.ai', 'protocols');
  if (!fs.existsSync(protocolDir)) {
    errors.push('Missing .ai/protocols/ directory');
    return { valid: errors.length === 0, errors, warnings };
  }

  const protocolFiles = fs.readdirSync(protocolDir).filter(f => f.endsWith('.md'));

  for (const agent of agentNames) {
    const protocolLine = indexContent.match(new RegExp(`${agent}:[\\s\\S]*?protocol:\\s*"([^"]+)"`, 'm'));
    if (protocolLine) {
      const protocolPath = protocolLine[1];
      const fullPath = path.join(rootDir, protocolPath);
      if (!fs.existsSync(fullPath)) {
        errors.push(`Agent "${agent}" references protocol "${protocolPath}" but file not found`);
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        validateProtocolContent(agent, content, errors, warnings);
      }
    }
  }

  for (const file of protocolFiles) {
    if (file.includes('summary') || file === 'constitution.md') continue;
    const content = fs.readFileSync(path.join(protocolDir, file), 'utf8');
    if (!content.match(/^# .+/m)) {
      warnings.push(`Protocol "${file}" missing title heading`);
    }
  }

  const agentsmdPath = path.join(rootDir, 'AGENTS.md');
  if (!fs.existsSync(agentsmdPath)) {
    errors.push('Missing AGENTS.md');
  } else {
    const agentsMd = fs.readFileSync(agentsmdPath, 'utf8');
    const tokenEstimate = agentsMd.split(/\s+/).length;
    if (tokenEstimate > 1500) {
      warnings.push(`AGENTS.md is ~${tokenEstimate} words -- consider trimming (target <1200 tokens)`);
    }
  }

  const handoffTargets = [];
  const handoffMatches = indexContent.matchAll(/handoff:\s*"[^"]*?(\w+)\s*\(/gm);
  for (const m of handoffMatches) {
    handoffTargets.push(m[1]);
  }
  const handoffMatches2 = indexContent.matchAll(/handoff:\s*".*?→\s*(\w+)/gm);
  for (const m of handoffMatches2) {
    handoffTargets.push(m[1]);
  }
  for (const target of handoffTargets) {
    const normalizedTarget = target.replace(/-/g, '_');
    if (!agentNames.includes(normalizedTarget) && !['human', 'committer'].includes(normalizedTarget)) {
      warnings.push(`Handoff target "${target}" not found in agent roster`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateProtocolContent(agentName, content, errors, warnings) {
  if (!content.match(/## Rules|## Golden Rules|## Non-Negotiable/i)) {
    warnings.push(`Protocol for "${agentName}" missing Rules section`);
  }
  if (!content.match(/## Output/i)) {
    warnings.push(`Protocol for "${agentName}" missing Output section`);
  }
}

function getFrameworkStatus(rootDir) {
  const status = {
    version: 'unknown',
    files: { total: 0, protocols: 0, templates: 0, scripts: 0, plugins: 0 },
    agents: [],
    coverage: 'unknown',
    lastPreflight: 'never',
    lastCouncil: 'never',
    staleArtifacts: 0,
    runtimeReady: false,
    health: 'unknown',
  };

  const pkgPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      status.version = pkg.version || 'unknown';
    } catch (_) { /* ignore parse errors */ }
  }

  const aiDir = path.join(rootDir, '.ai');
  if (fs.existsSync(aiDir)) {
    status.files.total = countFiles(aiDir);
  }

  const protocolDir = path.join(aiDir, 'protocols');
  if (fs.existsSync(protocolDir)) {
    status.files.protocols = fs.readdirSync(protocolDir).filter(f => f.endsWith('.md')).length;
  }

  const templateDir = path.join(aiDir, 'templates');
  if (fs.existsSync(templateDir)) {
    status.files.templates = fs.readdirSync(templateDir).filter(f => f.endsWith('.md')).length;
  }

  const scriptsDir = path.join(rootDir, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    status.files.scripts = countFiles(scriptsDir);
  }

  const pluginsDir = path.join(aiDir, 'plugins');
  if (fs.existsSync(pluginsDir)) {
    status.files.plugins = countFiles(pluginsDir);
  }

  const runtimeIndex = path.join(aiDir, 'session-state', 'index.json');
  status.runtimeReady = fs.existsSync(runtimeIndex);

  const contextIndexPath = path.join(aiDir, 'context-index.yaml');
  if (fs.existsSync(contextIndexPath)) {
    const content = fs.readFileSync(contextIndexPath, 'utf8');
    const matches = content.matchAll(/^\s{2}(\w+):/gm);
    const agentBlock = content.match(/^agents:\s*\n([\s\S]*?)(?=\n[^\s]|\n*$)/m);
    if (agentBlock) {
      const agentMatches = agentBlock[1].matchAll(/^\s{2}(\w+):/gm);
      for (const m of agentMatches) {
        status.agents.push(m[1]);
      }
    }
  }

  const exchangeDir = path.join(aiDir, 'agent-exchange');
  if (fs.existsSync(exchangeDir)) {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(exchangeDir).filter(f => f.endsWith('.md'));
    for (const f of files) {
      const stat = fs.statSync(path.join(exchangeDir, f));
      if (now - stat.mtimeMs > sevenDays) {
        status.staleArtifacts++;
      }
    }
  }

  const validation = validateAgentFiles(rootDir);
  if (validation.valid && validation.warnings.length === 0) {
    status.health = 'healthy';
  } else if (validation.valid) {
    status.health = 'warnings';
  } else {
    status.health = 'errors';
  }

  return status;
}

function countFiles(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

module.exports = {
  validateAgentFiles,
  validateProtocolContent,
  getFrameworkStatus,
  countFiles,
};
