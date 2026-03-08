import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

const { loadJSON, loadText, getKnowledgeGraph, getGovernance, getRbac, getSecurityStatus } = require('../mcp-server/data');
const {
  searchRepos, getRepoRisks, getDependencies, getCrossRepoImpact,
  queryGovernance, getSecuritySummary, getStoryContext, getPrdImpact,
} = require('../mcp-server/tools');

// ── data.js tests ──

describe('data.js — loadJSON', () => {
  it('returns parsed JSON for existing file', () => {
    const result = loadJSON('package.json');
    expect(result).not.toBeNull();
    expect(result.name).toBe('agentic-sdlc-development');
  });

  it('returns null for missing file', () => {
    expect(loadJSON('nonexistent-file-xyz.json')).toBeNull();
  });

  it('returns null for invalid JSON file', () => {
    expect(loadJSON('README.md')).toBeNull();
  });
});

describe('data.js — loadText', () => {
  it('returns text content for existing file', () => {
    const result = loadText('package.json');
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns null for missing file', () => {
    expect(loadText('nonexistent-file-xyz.txt')).toBeNull();
  });
});

describe('data.js — getKnowledgeGraph', () => {
  it('returns a valid knowledge graph with nodes and edges', () => {
    const kg = getKnowledgeGraph();
    expect(kg).not.toBeNull();
    expect(Array.isArray(kg.nodes)).toBe(true);
    expect(Array.isArray(kg.edges)).toBe(true);
    expect(kg.nodes.length).toBeGreaterThan(0);
  });

  it('each node has required fields (id, name, group)', () => {
    const kg = getKnowledgeGraph();
    for (const node of kg.nodes) {
      expect(node.id).toBeDefined();
      expect(node.name).toBeDefined();
      expect(node.group).toBeDefined();
    }
  });
});

describe('data.js — getGovernance', () => {
  it('returns governance YAML text', () => {
    const result = getGovernance();
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('data.js — getRbac', () => {
  it('returns rbac YAML text', () => {
    const result = getRbac();
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('data.js — getSecurityStatus', () => {
  it('returns array of nodes with scan data', () => {
    const result = getSecurityStatus();
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  it('each entry has repo, name, risk, and scan fields', () => {
    const result = getSecurityStatus();
    for (const entry of result) {
      expect(entry.repo).toBeDefined();
      expect(entry.name).toBeDefined();
      expect(entry.risk).toBeDefined();
      expect(entry.scan).toBeDefined();
      expect(entry.scan).not.toBeNull();
    }
  });
});

// ── tools.js — searchRepos ──

describe('tools.js — searchRepos', () => {
  it('returns all repos when no filters are provided', () => {
    const result = searchRepos({});
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by query string matching repo name', () => {
    const result = searchRepos({ query: 'shared-mobile-sdk' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('shared-mobile-sdk');
  });

  it('query is case-insensitive', () => {
    const result = searchRepos({ query: 'SHARED MOBILE SDK' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('shared-mobile-sdk');
  });

  it('filters by query matching description', () => {
    const result = searchRepos({ query: 'workflow rendering' });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some(r => r.description && r.description.toLowerCase().includes('workflow rendering'))).toBe(true);
  });

  it('filters by risk_level', () => {
    const result = searchRepos({ risk_level: 'high' });
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const r of result) {
      expect(r.risk).toBe('high');
    }
  });

  it('filters by group', () => {
    const result = searchRepos({ group: 'mobile' });
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const r of result) {
      expect(r.group).toBe('mobile');
    }
  });

  it('filters by tech_stack', () => {
    const result = searchRepos({ tech_stack: 'Swift' });
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const r of result) {
      expect(r.lang.toLowerCase()).toContain('swift');
    }
  });

  it('tech_stack filter is case-insensitive', () => {
    const result = searchRepos({ tech_stack: 'swift' });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array when no repos match query', () => {
    const result = searchRepos({ query: 'nonexistent-repo-xyz-12345' });
    expect(result).toHaveLength(0);
  });

  it('result objects have expected shape', () => {
    const result = searchRepos({ query: 'shared-mobile-sdk' });
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('group');
    expect(result[0]).toHaveProperty('lang');
    expect(result[0]).toHaveProperty('risk');
    expect(result[0]).toHaveProperty('description');
    expect(result[0]).toHaveProperty('risk_count');
  });

  it('combines multiple filters', () => {
    const allBackend = searchRepos({ group: 'backend' });
    const highRiskBackend = searchRepos({ group: 'backend', risk_level: 'high' });
    expect(highRiskBackend.length).toBeLessThanOrEqual(allBackend.length);
  });

  it('filters by query matching language', () => {
    const result = searchRepos({ query: 'Swift' });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

// ── tools.js — getRepoRisks ──

describe('tools.js — getRepoRisks', () => {
  it('returns risk data for existing repo', () => {
    const result = getRepoRisks({ repo_id: 'shared-mobile-sdk' });
    expect(result.repo).toBe('shared-mobile-sdk');
    expect(result.risk_level).toBeDefined();
    expect(Array.isArray(result.risks)).toBe(true);
  });

  it('finds repo by case-insensitive name', () => {
    const result = getRepoRisks({ repo_id: 'SHARED MOBILE SDK' });
    expect(result.repo).toBe('shared-mobile-sdk');
  });

  it('returns error for nonexistent repo', () => {
    const result = getRepoRisks({ repo_id: 'phantom-repo-xyz' });
    expect(result.error).toContain('not found');
  });

  it('includes scan data when available', () => {
    const result = getRepoRisks({ repo_id: 'shared-mobile-sdk' });
    expect(result).toHaveProperty('scan');
  });

  it('includes lang and group fields', () => {
    const result = getRepoRisks({ repo_id: 'mobile-ios-app' });
    expect(result.lang).toBeDefined();
    expect(result.group).toBeDefined();
  });
});

// ── tools.js — getDependencies ──

describe('tools.js — getDependencies', () => {
  it('returns upstream and downstream for a connected repo', () => {
    const result = getDependencies({ repo_id: 'shared-mobile-sdk' });
    expect(result.repo).toBe('shared-mobile-sdk');
    expect(result.total_upstream).toBeGreaterThanOrEqual(0);
    expect(result.total_downstream).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.upstream_dependencies)).toBe(true);
    expect(Array.isArray(result.downstream_dependents)).toBe(true);
  });

  it('returns error for unknown repo', () => {
    const result = getDependencies({ repo_id: 'unknown-repo-xyz' });
    expect(result.error).toContain('not found');
  });

  it('dependency entries have repo, type, and label', () => {
    const result = getDependencies({ repo_id: 'shared-mobile-sdk' });
    for (const dep of [...result.upstream_dependencies, ...result.downstream_dependents]) {
      expect(dep.repo).toBeDefined();
      expect(dep.type).toBeDefined();
      expect(dep.label).toBeDefined();
    }
  });

  it('total counts match array lengths', () => {
    const result = getDependencies({ repo_id: 'shared-mobile-sdk' });
    expect(result.total_upstream).toBe(result.upstream_dependencies.length);
    expect(result.total_downstream).toBe(result.downstream_dependents.length);
  });
});

// ── tools.js — getCrossRepoImpact ──

describe('tools.js — getCrossRepoImpact', () => {
  it('returns impact analysis for existing repo', () => {
    const result = getCrossRepoImpact({ repo_id: 'shared-mobile-sdk' });
    expect(result.source_repo).toBe('shared-mobile-sdk');
    expect(result.source_name).toBeDefined();
    expect(Array.isArray(result.impacted_repos)).toBe(true);
    expect(typeof result.total_impacted).toBe('number');
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.blast_radius);
  });

  it('returns error for unknown repo', () => {
    const result = getCrossRepoImpact({ repo_id: 'nonexistent-xyz' });
    expect(result.error).toContain('not found');
  });

  it('impacted repos include depth, risk, and group', () => {
    const result = getCrossRepoImpact({ repo_id: 'shared-mobile-sdk' });
    for (const repo of result.impacted_repos) {
      expect(repo.depth).toBeDefined();
      expect(repo.depth).toBeGreaterThanOrEqual(1);
      expect(repo.repo).toBeDefined();
      expect(repo.name).toBeDefined();
    }
  });

  it('blast radius classification follows thresholds', () => {
    const result = getCrossRepoImpact({ repo_id: 'shared-mobile-sdk' });
    if (result.total_impacted > 5) {
      expect(result.blast_radius).toBe('HIGH');
    } else if (result.total_impacted > 2) {
      expect(result.blast_radius).toBe('MEDIUM');
    } else {
      expect(result.blast_radius).toBe('LOW');
    }
  });
});

// ── tools.js — queryGovernance ──

describe('tools.js — queryGovernance', () => {
  it('detects sensitive data violation with person_name', () => {
    const result = queryGovernance({ check_type: 'phi_pii', value: 'logging person_name to console' });
    expect(result.compliant).toBe(false);
    expect(result.details.some(d => d.includes('Sensitive-data'))).toBe(true);
  });

  it('allows request_id as operational identifier', () => {
    const result = queryGovernance({ check_type: 'phi_pii', value: 'using request_id for lookup' });
    expect(result.compliant).toBe(true);
    expect(result.details.some(d => d.includes('Operational identifiers'))).toBe(true);
  });

  it('flags encryption contract file changes', () => {
    const result = queryGovernance({ check_type: 'ecdh', value: 'modified AppEnvironment.swift' });
    expect(result.compliant).toBe(false);
    expect(result.details.some(d => d.includes('REQUIRE_ARCHITECT_ADR'))).toBe(true);
  });

  it('passes encryption check for non-contract files', () => {
    const result = queryGovernance({ check_type: 'ecdh', value: 'modified ViewController.swift' });
    expect(result.compliant).toBe(true);
  });

  it('detects idempotency requirement for submission endpoint', () => {
    const result = queryGovernance({ check_type: 'idempotency', value: 'POST /api/submission' });
    expect(result.details.some(d => d.includes('Idempotency required'))).toBe(true);
  });

  it('returns mobile compat info', () => {
    const result = queryGovernance({ check_type: 'mobile_compat', value: '' });
    expect(result.details.some(d => d.includes('18 months'))).toBe(true);
  });

  it('returns details for unknown check type', () => {
    const result = queryGovernance({ check_type: 'unknown_type', value: '' });
    expect(result.details.some(d => d.includes('Unknown check type'))).toBe(true);
  });

  it('handles null value for phi_pii check without crashing', () => {
    const result = queryGovernance({ check_type: 'phi_pii', value: null });
    expect(result.compliant).toBe(true);
  });

  it('handles undefined value for ecdh check without crashing', () => {
    const result = queryGovernance({ check_type: 'ecdh' });
    expect(result.compliant).toBe(true);
  });

  it('detects multiple sensitive-data patterns simultaneously', () => {
    const result = queryGovernance({ check_type: 'phi_pii', value: 'person_name and date_of_birth' });
    expect(result.compliant).toBe(false);
    const warnDetail = result.details.find(d => d.includes('Sensitive-data'));
    expect(warnDetail).toContain('person_name');
    expect(warnDetail).toContain('date_of_birth');
  });

  it('detects Environment.kt as encryption contract file', () => {
    const result = queryGovernance({ check_type: 'ecdh', value: 'modified Environment.kt' });
    expect(result.compliant).toBe(false);
  });
});

// ── tools.js — getSecuritySummary ──

describe('tools.js — getSecuritySummary', () => {
  it('returns total repos count', () => {
    const result = getSecuritySummary();
    expect(result.total_repos).toBeGreaterThan(0);
  });

  it('returns risk distribution by level', () => {
    const result = getSecuritySummary();
    expect(result.by_risk).toBeDefined();
    expect(typeof result.by_risk.low).toBe('number');
    expect(typeof result.by_risk.med).toBe('number');
    expect(typeof result.by_risk.high).toBe('number');
  });

  it('risk counts sum to total repos', () => {
    const result = getSecuritySummary();
    const sum = Object.values(result.by_risk).reduce((a, b) => a + b, 0);
    expect(sum).toBe(result.total_repos);
  });

  it('high risk repos list is consistent with by_risk count', () => {
    const result = getSecuritySummary();
    const highAndCritical = (result.by_risk.high || 0) + (result.by_risk.critical || 0);
    expect(result.high_risk_repos.length).toBe(highAndCritical);
  });

  it('counts repos with scans', () => {
    const result = getSecuritySummary();
    expect(typeof result.repos_with_scans).toBe('number');
    expect(result.repos_with_scans).toBeLessThanOrEqual(result.total_repos);
  });

  it('high risk repos have top_risks limited to 3', () => {
    const result = getSecuritySummary();
    for (const repo of result.high_risk_repos) {
      expect(repo.top_risks.length).toBeLessThanOrEqual(3);
    }
  });
});

// ── tools.js — getStoryContext ──

describe('tools.js — getStoryContext', () => {
  it('returns full context for existing repo', () => {
    const result = getStoryContext({ repo_id: 'shared-mobile-sdk' });
    expect(result.repo).toBe('shared-mobile-sdk');
    expect(result.tech_stack).toBeDefined();
    expect(result.group).toBeDefined();
    expect(typeof result.governance_available).toBe('boolean');
    expect(typeof result.rbac_available).toBe('boolean');
  });

  it('includes upstream and downstream dependencies', () => {
    const result = getStoryContext({ repo_id: 'shared-mobile-sdk' });
    expect(Array.isArray(result.upstream_dependencies)).toBe(true);
    expect(Array.isArray(result.downstream_dependents)).toBe(true);
  });

  it('returns error for unknown repo', () => {
    const result = getStoryContext({ repo_id: 'atlantis-xyz' });
    expect(result.error).toContain('not found');
  });

  it('includes risks array', () => {
    const result = getStoryContext({ repo_id: 'shared-mobile-sdk' });
    expect(Array.isArray(result.risks)).toBe(true);
  });

  it('includes ADRs array', () => {
    const result = getStoryContext({ repo_id: 'shared-mobile-sdk' });
    expect(Array.isArray(result.adrs)).toBe(true);
  });

  it('includes API contracts array', () => {
    const result = getStoryContext({ repo_id: 'shared-mobile-sdk' });
    expect(Array.isArray(result.api_contracts)).toBe(true);
  });

  it('includes scan field', () => {
    const result = getStoryContext({ repo_id: 'shared-mobile-sdk' });
    expect(result).toHaveProperty('scan');
  });

  it('includes risk_level field', () => {
    const result = getStoryContext({ repo_id: 'shared-mobile-sdk' });
    expect(result.risk_level).toBeDefined();
  });
});

// ── tools.js — getPrdImpact ──

describe('tools.js — getPrdImpact', () => {
  it('matches repos by feature keywords', () => {
    const result = getPrdImpact({ feature_keywords: ['workflow'] });
    expect(result.directly_matched_repos.length).toBeGreaterThanOrEqual(1);
  });

  it('returns blast radius classification', () => {
    const result = getPrdImpact({ feature_keywords: ['workflow', 'gateway', 'analytics'] });
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.blast_radius);
  });

  it('returns error for empty keywords array', () => {
    const result = getPrdImpact({ feature_keywords: [] });
    expect(result.error).toContain('non-empty array');
  });

  it('returns error for missing keywords', () => {
    const result = getPrdImpact({});
    expect(result.error).toBeDefined();
  });

  it('returns error for non-array keywords', () => {
    const result = getPrdImpact({ feature_keywords: 'not-an-array' });
    expect(result.error).toBeDefined();
  });

  it('filters out empty string keywords', () => {
    const result = getPrdImpact({ feature_keywords: ['', '', ''] });
    expect(result.error).toContain('non-empty string');
  });

  it('includes governance flags for mobile keywords', () => {
    const result = getPrdImpact({ feature_keywords: ['mobile'] });
    expect(result.governance_flags).toContain('mobile_compat');
  });

  it('includes governance flags for submission keywords', () => {
    const result = getPrdImpact({ feature_keywords: ['submission'] });
    expect(result.governance_flags).toContain('idempotency');
  });

  it('includes governance flags for PII keywords', () => {
    const result = getPrdImpact({ feature_keywords: ['user'] });
    expect(result.governance_flags).toContain('phi_pii');
  });

  it('includes governance flags for encryption keywords', () => {
    const result = getPrdImpact({ feature_keywords: ['ecdh'] });
    expect(result.governance_flags).toContain('ecdh');
  });

  it('returns knowledge_graph_hash as 16-char hex string', () => {
    const result = getPrdImpact({ feature_keywords: ['form'] });
    expect(result.knowledge_graph_hash).toBeDefined();
    expect(typeof result.knowledge_graph_hash).toBe('string');
    expect(result.knowledge_graph_hash.length).toBe(16);
  });

  it('sorts matched repos by match_score descending', () => {
    const result = getPrdImpact({ feature_keywords: ['gateway', 'Python', 'backend'] });
    const scores = result.directly_matched_repos.map(r => r.match_score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it('each matched repo has match_score between 0 and 1', () => {
    const result = getPrdImpact({ feature_keywords: ['form', 'Python'] });
    for (const repo of result.directly_matched_repos) {
      expect(repo.match_score).toBeGreaterThan(0);
      expect(repo.match_score).toBeLessThanOrEqual(1);
    }
  });

  it('includes transitive impact repos array', () => {
    const result = getPrdImpact({ feature_keywords: ['ODM'] });
    expect(Array.isArray(result.transitively_impacted_repos)).toBe(true);
  });

  it('total_affected equals direct + transitive count', () => {
    const result = getPrdImpact({ feature_keywords: ['form'] });
    const directIds = new Set(result.directly_matched_repos.map(r => r.repo));
    const transitiveIds = new Set(result.transitively_impacted_repos.map(r => r.repo));
    const combined = new Set([...directIds, ...transitiveIds]);
    expect(result.total_affected).toBe(combined.size);
  });
});
