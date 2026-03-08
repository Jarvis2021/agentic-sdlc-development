const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { getRuntimeSummary, ensureSessionRuntime, getRuntimePaths } = require('../lib/session-runtime');
const { getDiagnosticsSummary } = require('../lib/debug-fabric');
const { ensurePluginRuntime, listPluginManifests } = require('../lib/plugin-runtime');

function loadJSON(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function loadText(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

function getKnowledgeGraph() {
  return loadJSON('docs/knowledge-graph/knowledge-graph.json');
}

function getGovernance() {
  return loadText('.ai/domain-governance.yaml');
}

function getRbac() {
  return loadText('rbac-factbook.yaml');
}

function getSecurityStatus() {
  const kg = getKnowledgeGraph();
  if (!kg) return null;
  if (!kg.nodes) return null;
  return kg.nodes
    .filter(n => n.scan)
    .map(n => ({
      repo: n.id,
      name: n.name,
      risk: n.risk,
      scan: n.scan,
    }));
}

function getSessionRuntime() {
  ensureSessionRuntime(ROOT);
  return getRuntimeSummary(ROOT);
}

function getDiagnosticsStatus() {
  ensureSessionRuntime(ROOT);
  return getDiagnosticsSummary(ROOT);
}

function getPluginStatus() {
  ensurePluginRuntime(ROOT);
  return listPluginManifests(ROOT).map((plugin) => ({
    name: plugin.name,
    version: plugin.version,
    enabled: plugin.enabled,
    capabilities: plugin.capabilities || [],
  }));
}

function getBrowserPackStatus() {
  const plugins = getPluginStatus();
  const browserPack = plugins.find((plugin) => plugin.name === 'browser-pack');
  return browserPack || null;
}

function getRuntimePathsInfo() {
  return getRuntimePaths(ROOT);
}

module.exports = {
  loadJSON,
  loadText,
  getBrowserPackStatus,
  getDiagnosticsStatus,
  getGovernance,
  getKnowledgeGraph,
  getPluginStatus,
  getRbac,
  getRuntimePathsInfo,
  getSecurityStatus,
  getSessionRuntime,
  ROOT,
};
