const {
  getBrowserPackStatus,
  getDiagnosticsStatus,
  getKnowledgeGraph,
  getGovernance,
  getPluginStatus,
  getRbac,
  getSessionRuntime,
} = require('./data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createEvidenceBundle } = require('../lib/debug-fabric');
const { searchSymbols, findSymbolUsages, renameSymbolPreview } = require('../lib/semantic-tools');
const { loadPluginManifest } = require('../lib/plugin-runtime');

const ROOT = path.resolve(__dirname, '..');

function searchRepos({ query, risk_level, group, tech_stack }) {
  const kg = getKnowledgeGraph();
  if (!kg) return { error: 'Knowledge graph not found' };

  let results = kg.nodes;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(n =>
      n.id.toLowerCase().includes(q) ||
      n.name.toLowerCase().includes(q) ||
      (n.desc && n.desc.toLowerCase().includes(q)) ||
      (n.lang && n.lang.toLowerCase().includes(q))
    );
  }

  if (risk_level) {
    results = results.filter(n => n.risk === risk_level);
  }

  if (group) {
    results = results.filter(n => n.group === group);
  }

  if (tech_stack) {
    const ts = tech_stack.toLowerCase();
    results = results.filter(n => n.lang && n.lang.toLowerCase().includes(ts));
  }

  return results.map(n => ({
    id: n.id,
    name: n.name,
    group: n.group,
    lang: n.lang,
    risk: n.risk,
    description: n.desc,
    risk_count: (n.risks || []).length,
  }));
}

function getRepoRisks({ repo_id }) {
  const kg = getKnowledgeGraph();
  if (!kg) return { error: 'Knowledge graph not found' };

  const node = kg.nodes.find(n => n.id === repo_id || n.name.toLowerCase() === repo_id.toLowerCase());
  if (!node) return { error: `Repo "${repo_id}" not found in knowledge graph` };

  return {
    repo: node.id,
    name: node.name,
    risk_level: node.risk,
    risks: node.risks || [],
    scan: node.scan || null,
    lang: node.lang,
    group: node.group,
  };
}

function getDependencies({ repo_id }) {
  const kg = getKnowledgeGraph();
  if (!kg) return { error: 'Knowledge graph not found' };

  const node = kg.nodes.find(n => n.id === repo_id || n.name.toLowerCase() === repo_id.toLowerCase());
  if (!node) return { error: `Repo "${repo_id}" not found in knowledge graph` };

  const upstream = kg.edges
    .filter(e => e.target === node.id)
    .map(e => {
      const src = kg.nodes.find(n => n.id === e.source);
      return { repo: e.source, name: src?.name, type: e.type, label: e.label };
    });

  const downstream = kg.edges
    .filter(e => e.source === node.id)
    .map(e => {
      const tgt = kg.nodes.find(n => n.id === e.target);
      return { repo: e.target, name: tgt?.name, type: e.type, label: e.label };
    });

  return {
    repo: node.id,
    name: node.name,
    upstream_dependencies: upstream,
    downstream_dependents: downstream,
    total_upstream: upstream.length,
    total_downstream: downstream.length,
  };
}

function getCrossRepoImpact({ repo_id }) {
  const kg = getKnowledgeGraph();
  if (!kg) return { error: 'Knowledge graph not found' };

  const node = kg.nodes.find(n => n.id === repo_id || n.name.toLowerCase() === repo_id.toLowerCase());
  if (!node) return { error: `Repo "${repo_id}" not found in knowledge graph` };

  const visited = new Set();
  const impacted = [];

  function traverse(currentId, depth) {
    if (visited.has(currentId) || depth > 3) return;
    visited.add(currentId);

    const dependents = kg.edges
      .filter(e => e.target === currentId)
      .map(e => e.source);

    for (const depId of dependents) {
      const depNode = kg.nodes.find(n => n.id === depId);
      if (depNode && !visited.has(depId)) {
        impacted.push({
          repo: depId,
          name: depNode.name,
          depth,
          risk: depNode.risk,
          group: depNode.group,
        });
        traverse(depId, depth + 1);
      }
    }
  }

  traverse(node.id, 1);

  return {
    source_repo: node.id,
    source_name: node.name,
    impacted_repos: impacted,
    total_impacted: impacted.length,
    blast_radius: impacted.length > 5 ? 'HIGH' : impacted.length > 2 ? 'MEDIUM' : 'LOW',
  };
}

function queryGovernance({ check_type, value }) {
  const governance = getGovernance();
  if (!governance) return { error: 'Governance file not found' };

  const result = { check_type, value, compliant: true, details: [] };

  if (check_type === 'phi_pii') {
    const warnPatterns = ['person_name', 'date_of_birth', 'government_id', 'home_address', 'sensitive_payload'];
    const allowPatterns = ['record_id', 'request_id', 'trace_id', 'idempotency_key'];

    const lowerVal = (value || '').toLowerCase();
    const matched = warnPatterns.filter(p => lowerVal.includes(p));
    const allowed = allowPatterns.filter(p => lowerVal.includes(p));

    if (matched.length > 0) {
      result.compliant = false;
      result.details.push(`WARN: Sensitive-data pattern(s) detected in source code: ${matched.join(', ')}`);
      result.details.push('Policy: configurable handling - warn on source code literals, align runtime logging with team governance');
    }
    if (allowed.length > 0) {
      result.details.push(`OK: Operational identifiers detected: ${allowed.join(', ')}`);
    }
  } else if (check_type === 'ecdh') {
    const ecdhFiles = ['AppEnvironment.swift', 'Environment.kt'];
    const lowerVal = (value || '').toLowerCase();
    const matched = ecdhFiles.filter(f => lowerVal.includes(f.toLowerCase()));
    if (matched.length > 0) {
      result.compliant = false;
      result.details.push(`REQUIRE_ARCHITECT_ADR: Changes to encryption contract files (${matched.join(', ')}) require an Architecture Decision Record`);
    }
  } else if (check_type === 'idempotency') {
    const endpoints = ['POST /api/submission', 'POST /api/data-import', 'DataImportCreateJob'];
    const lowerVal = (value || '').toLowerCase();
    const matched = endpoints.filter(e => lowerVal.includes(e.toLowerCase()));
    if (matched.length > 0) {
      result.details.push(`Idempotency required: ${matched.join(', ')} - must include "idempotency_key" field`);
    }
  } else if (check_type === 'mobile_compat') {
    result.details.push('Mobile backward compatibility window: 18 months');
    result.details.push('Applies to: all consuming apps');
  } else {
    result.details.push(`Unknown check type: ${check_type}. Available: phi_pii, ecdh, idempotency, mobile_compat`);
  }

  return result;
}

function getSecuritySummary() {
  const kg = getKnowledgeGraph();
  if (!kg) return { error: 'Knowledge graph not found' };

  const summary = { total_repos: kg.nodes.length, by_risk: {}, repos_with_scans: 0, high_risk_repos: [] };
  const riskCounts = { low: 0, med: 0, high: 0, critical: 0 };

  for (const node of kg.nodes) {
    const risk = node.risk || 'low';
    riskCounts[risk] = (riskCounts[risk] || 0) + 1;

    if (risk === 'high' || risk === 'critical') {
      summary.high_risk_repos.push({
        repo: node.id,
        name: node.name,
        risk,
        top_risks: (node.risks || []).slice(0, 3),
      });
    }

    if (node.scan) summary.repos_with_scans++;
  }

  summary.by_risk = riskCounts;
  return summary;
}

function getStoryContext({ repo_id }) {
  const kg = getKnowledgeGraph();
  if (!kg) return { error: 'Knowledge graph not found' };

  const node = kg.nodes.find(n => n.id === repo_id || n.name.toLowerCase() === repo_id.toLowerCase());
  if (!node) return { error: `Repo "${repo_id}" not found in knowledge graph` };

  const upstream = kg.edges
    .filter(e => e.target === node.id)
    .map(e => ({ repo: e.source, type: e.type, label: e.label }));

  const downstream = kg.edges
    .filter(e => e.source === node.id)
    .map(e => ({ repo: e.target, type: e.type, label: e.label }));

  const adrs = [];
  const adrDir = path.join(ROOT, '.ai', 'decisions');
  if (fs.existsSync(adrDir)) {
    const files = fs.readdirSync(adrDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(adrDir, file), 'utf8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      adrs.push({ file, title: titleMatch ? titleMatch[1] : file });
    }
  }

  const governance = getGovernance();
  const rbac = getRbac();

  const contracts = [];
  const apiDir = path.join(ROOT, 'docs', 'api');
  if (fs.existsSync(apiDir)) {
    const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.yaml') || f.endsWith('.json'));
    contracts.push(...files);
  }

  return {
    repo: node.id,
    name: node.name,
    tech_stack: node.lang,
    group: node.group,
    risk_level: node.risk,
    risks: node.risks || [],
    upstream_dependencies: upstream,
    downstream_dependents: downstream,
    adrs,
    api_contracts: contracts,
    governance_available: !!governance,
    rbac_available: !!rbac,
    scan: node.scan || null,
  };
}

function getPrdImpact({ feature_keywords }) {
  const kg = getKnowledgeGraph();
  if (!kg) return { error: 'Knowledge graph not found' };

  if (!feature_keywords || !Array.isArray(feature_keywords) || feature_keywords.length === 0) {
    return { error: 'feature_keywords must be a non-empty array of strings' };
  }

  const keywords = feature_keywords
    .filter(k => typeof k === 'string' && k.length > 0)
    .map(k => k.toLowerCase());

  if (keywords.length === 0) {
    return { error: 'feature_keywords must contain at least one non-empty string' };
  }

  const matchedRepos = [];
  for (const node of kg.nodes) {
    const searchable = [
      node.id,
      node.name,
      node.desc || '',
      node.lang || '',
      ...(node.risks || []),
    ].join(' ').toLowerCase();

    const matchedKeywords = keywords.filter(kw => searchable.includes(kw));
    if (matchedKeywords.length > 0) {
      matchedRepos.push({
        repo: node.id,
        name: node.name,
        group: node.group,
        tech_stack: node.lang,
        risk: node.risk,
        matched_keywords: matchedKeywords,
        match_score: matchedKeywords.length / keywords.length,
      });
    }
  }

  matchedRepos.sort((a, b) => b.match_score - a.match_score);

  const allAffectedIds = new Set(matchedRepos.map(r => r.repo));
  const transitiveImpact = [];

  for (const repo of matchedRepos) {
    const dependents = kg.edges
      .filter(e => e.target === repo.repo)
      .map(e => e.source);

    for (const depId of dependents) {
      if (!allAffectedIds.has(depId)) {
        allAffectedIds.add(depId);
        const depNode = kg.nodes.find(n => n.id === depId);
        if (depNode) {
          transitiveImpact.push({
            repo: depId,
            name: depNode.name,
            group: depNode.group,
            impacted_by: repo.repo,
            relationship: 'transitive_dependency',
          });
        }
      }
    }
  }

  const totalAffected = allAffectedIds.size;
  const blastRadius = totalAffected > 5 ? 'HIGH' : totalAffected > 2 ? 'MEDIUM' : 'LOW';

  const governanceFlags = [];
  const governance = getGovernance();
  if (governance) {
    const govText = typeof governance === 'string' ? governance : JSON.stringify(governance);
    for (const kw of keywords) {
      if (['user', 'pii', 'personal', 'sensitive', 'identity'].some(p => kw.includes(p))) {
        governanceFlags.push('phi_pii');
      }
      if (['ecdh', 'salt', 'encryption', 'key'].some(p => kw.includes(p))) {
        governanceFlags.push('ecdh');
      }
      if (['submit', 'submission', 'create', 'write', 'post'].some(p => kw.includes(p))) {
        governanceFlags.push('idempotency');
      }
      if (['mobile', 'ios', 'android', 'app'].some(p => kw.includes(p))) {
        governanceFlags.push('mobile_compat');
      }
    }
  }

  const kgHash = crypto.createHash('sha256')
    .update(JSON.stringify(kg))
    .digest('hex')
    .substring(0, 16);

  return {
    keywords: feature_keywords,
    directly_matched_repos: matchedRepos,
    transitively_impacted_repos: transitiveImpact,
    total_affected: totalAffected,
    blast_radius: blastRadius,
    governance_flags: [...new Set(governanceFlags)],
    knowledge_graph_hash: kgHash,
  };
}

function getRuntimeSnapshot() {
  return getSessionRuntime();
}

function getDiagnosticsFeed() {
  return getDiagnosticsStatus();
}

function listPlugins() {
  return {
    plugins: getPluginStatus(),
    browser_pack: getBrowserPackStatus(),
  };
}

function getPluginManifest({ plugin_name }) {
  if (!plugin_name) {
    return { error: 'plugin_name is required' };
  }

  const manifest = loadPluginManifest(ROOT, plugin_name);
  if (!manifest) {
    return { error: `Plugin "${plugin_name}" not found` };
  }

  return manifest;
}

function captureDebugEvidence(args = {}) {
  return createEvidenceBundle(ROOT, args);
}

function searchCodeSymbols(args = {}) {
  return searchSymbols(ROOT, args);
}

function getSymbolUsages(args = {}) {
  return findSymbolUsages(ROOT, args);
}

function getRenamePreview(args = {}) {
  return renameSymbolPreview(ROOT, args);
}

module.exports = {
  searchRepos, getRepoRisks, getDependencies, getCrossRepoImpact,
  queryGovernance, getSecuritySummary, getStoryContext, getPrdImpact,
  getRuntimeSnapshot, getDiagnosticsFeed, listPlugins, getPluginManifest,
  captureDebugEvidence, searchCodeSymbols, getSymbolUsages, getRenamePreview,
};
