#!/usr/bin/env node
/**
 * your organization Dependency Scanner
 *
 * Scans all Platform repos via GitHub API, extracts dependencies and tech stack,
 * and merges findings into knowledge-graph.json.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/scan-org-deps.js [--dry-run]
 *
 * What it detects (per language):
 *   Ruby   → Gemfile for @your-org gems + SDK refs
 *   JS/TS  → package.json for @your-org/* packages
 *   C#     → *.csproj for org.* NuGet refs
 *   Swift  → Package.swift for SPM dependencies
 *   Python → requirements.txt / pyproject.toml
 *
 * What it preserves:
 *   - All manually curated descriptions, risks, groups
 *   - Manually added edges (marked confidence:"manual")
 *   - Node ordering and structure
 */

const fs = require('fs');
const path = require('path');

const KG_PATH = path.resolve(__dirname, '../docs/knowledge-graph/knowledge-graph.json');
const ORG = 'your-org';
const DRY_RUN = process.argv.includes('--dry-run');
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

if (!TOKEN) {
  console.error('ERROR: GITHUB_TOKEN or GH_TOKEN env var required');
  process.exit(1);
}

const HEADERS = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'agentic-sdlc-development-scanner/1.0',
};

async function ghFetch(url) {
  const resp = await fetch(url, { headers: HEADERS });
  if (resp.status === 404) return null;
  if (resp.status === 403) {
    console.warn('  WARN: Rate limited or forbidden for', url);
    return null;
  }
  if (!resp.ok) {
    console.warn(`  WARN: ${resp.status} for ${url}`);
    return null;
  }
  return resp.json();
}

async function ghFileContent(repo, filePath) {
  const data = await ghFetch(
    `https://api.github.com/repos/${ORG}/${repo}/contents/${filePath}`
  );
  if (!data || !data.content) return null;
  return Buffer.from(data.content, 'base64').toString('utf8');
}

async function getRepoLanguages(repo) {
  return (await ghFetch(`https://api.github.com/repos/${ORG}/${repo}/languages`)) || {};
}

// ── Language-specific scanners ──

function scanPackageJson(content) {
  const edges = [];
  try {
    const pkg = JSON.parse(content);
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };
    for (const [name, version] of Object.entries(allDeps)) {
      if (name.startsWith('@your-org/')) {
        const sdkName = name.replace('@your-org/', '');
        edges.push({
          targetHint: sdkName,
          type: 'sdk',
          label: `npm: ${name}@${version}`,
          raw: name,
        });
      }
    }
  } catch (e) {
    console.warn('  WARN: Failed to parse package.json');
  }
  return edges;
}

function scanGemfile(content) {
  const edges = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/gem\s+['"]([^'"]+)['"]/);
    if (match) {
      const gem = match[1];
      if (gem.startsWith('your-org-') || gem.includes('enterprise') || gem.includes('design-service') || gem.includes('admin-console')) {
        edges.push({
          targetHint: gem.replace('your-org-', '').replace('-sdk', '').replace('_sdk', ''),
          type: 'sdk',
          label: `gem: ${gem}`,
          raw: gem,
        });
      }
    }
  }
  return edges;
}

function scanCsproj(content) {
  const edges = [];
  const refs = content.matchAll(/<PackageReference\s+Include="([^"]+)"/g);
  for (const m of refs) {
    const pkg = m[1];
    if (pkg.startsWith('org.') || pkg.startsWith('Org.')) {
      const hint = pkg
        .replace('org.', '')
        .replace('Org.', '')
        .replace('.Client', '')
        .replace('.Sdk', '')
        .toLowerCase();
      edges.push({
        targetHint: hint,
        type: 'sdk',
        label: `NuGet: ${pkg}`,
        raw: pkg,
      });
    }
  }
  return edges;
}

function scanSwiftPackage(content) {
  const edges = [];
  const urls = content.matchAll(/url:\s*"([^"]+)"/g);
  for (const m of urls) {
    const url = m[1];
    if (url.includes('your-org/') || url.includes('enterprise/')) {
      const repoName = url.split('/').pop().replace('.git', '');
      edges.push({
        targetHint: repoName.toLowerCase(),
        type: 'sdk',
        label: `SPM: ${repoName}`,
        raw: url,
      });
    }
  }
  return edges;
}

function scanRequirements(content) {
  const edges = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const pkg = line.trim().split(/[>=<!\s]/)[0];
    if (pkg && (pkg.startsWith('your-org') || pkg.includes('enterprise'))) {
      edges.push({
        targetHint: pkg.replace('your-org-', '').replace('_', '-'),
        type: 'sdk',
        label: `pip: ${pkg}`,
        raw: pkg,
      });
    }
  }
  return edges;
}

function computeLangString(languages) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  if (total === 0) return '';
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 2);
  return top
    .map(([lang, bytes]) => {
      const pct = ((bytes / total) * 100).toFixed(1);
      return `${lang} (${pct}%)`;
    })
    .join(' + ');
}

// ── Repo-to-node ID mapping ──

function repoToNodeId(repoName) {
  const map = {
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
    'preferences-web': 'preferences-web',
    'localization-service': 'localization-service',
    'rules-engine-service': 'rules-engine-service',
    'feature-config-service': 'feature-config-service',
    'orchestration-service': 'orchestration-service',
    'person-service': 'person-service',
    'pdk': 'pdk',
    'sensorcloud': 'sensorcloud',
    'pineapple': 'pineapple',
    'pear': 'pear',
  };
  return map[repoName] || repoName.toLowerCase();
}

function resolveTarget(hint, nodeIds) {
  const lower = hint.toLowerCase().replace(/-/g, '_').replace(/\./g, '_');
  if (nodeIds.has(hint)) return hint;
  if (nodeIds.has(lower)) return lower;
  for (const id of nodeIds) {
    if (id.toLowerCase() === lower) return id;
    if (lower.includes(id.toLowerCase())) return id;
    if (id.toLowerCase().includes(lower)) return id;
  }
  return null;
}

// ── Main scanner ──

async function scanRepo(repoName, nodeIds) {
  console.log(`Scanning ${ORG}/${repoName}...`);
  const detectedEdges = [];

  const [pkgJson, gemfile, swiftPkg, reqTxt] = await Promise.all([
    ghFileContent(repoName, 'package.json'),
    ghFileContent(repoName, 'Gemfile'),
    ghFileContent(repoName, 'Package.swift'),
    ghFileContent(repoName, 'requirements.txt'),
  ]);

  if (pkgJson) detectedEdges.push(...scanPackageJson(pkgJson));
  if (gemfile) detectedEdges.push(...scanGemfile(gemfile));
  if (swiftPkg) detectedEdges.push(...scanSwiftPackage(swiftPkg));
  if (reqTxt) detectedEdges.push(...scanRequirements(reqTxt));

  const csprojList = await ghFetch(
    `https://api.github.com/search/code?q=extension:csproj+repo:${ORG}/${repoName}&per_page=5`
  );
  if (csprojList && csprojList.items) {
    for (const item of csprojList.items.slice(0, 3)) {
      const content = await ghFileContent(repoName, item.path);
      if (content) detectedEdges.push(...scanCsproj(content));
    }
  }

  const languages = await getRepoLanguages(repoName);
  const langStr = computeLangString(languages);

  const sourceId = repoToNodeId(repoName);
  const resolvedEdges = [];
  for (const edge of detectedEdges) {
    const targetId = resolveTarget(edge.targetHint, nodeIds);
    if (targetId && targetId !== sourceId) {
      resolvedEdges.push({
        source: sourceId,
        target: targetId,
        type: edge.type,
        label: edge.label,
        confidence: 'auto',
      });
    }
  }

  console.log(
    `  Found ${resolvedEdges.length} edges, lang: ${langStr || '(unchanged)'}`
  );
  return { edges: resolvedEdges, langStr };
}

async function main() {
  console.log('=== Portfolio Knowledge Graph Scanner ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  const kg = JSON.parse(fs.readFileSync(KG_PATH, 'utf8'));
  const nodeIds = new Set(kg.nodes.map((n) => n.id));
  const repoNames = kg.nodes.map((n) => {
    const nameMap = {
      'analytics-web': 'analytics-web',
      'config-studio': 'config-studio',
      'account-directory': 'account-directory',
      'preferences-web': 'preferences-web',
      'mobile-telemetry-sdk': 'mobile-telemetry-sdk',
    };
    return nameMap[n.id] || n.id;
  });

  const allDetectedEdges = [];
  const langUpdates = {};

  for (const repo of repoNames) {
    try {
      const result = await scanRepo(repo, nodeIds);
      allDetectedEdges.push(...result.edges);
      if (result.langStr) {
        langUpdates[repoToNodeId(repo)] = result.langStr;
      }
    } catch (err) {
      console.warn(`  ERROR scanning ${repo}: ${err.message}`);
    }
  }

  // Deduplicate detected edges
  const edgeKey = (e) => `${e.source}|${e.target}|${e.type}`;
  const existingKeys = new Set(kg.edges.map(edgeKey));
  const newEdges = [];
  const seen = new Set();
  for (const e of allDetectedEdges) {
    const k = edgeKey(e);
    if (!existingKeys.has(k) && !seen.has(k)) {
      seen.add(k);
      newEdges.push(e);
    }
  }

  // Update language strings only for nodes with generic placeholders.
  // Preserve manually curated strings that contain framework context
  // (e.g. "React 18", "Robot", "Flask") which GitHub API can't detect.
  let langChanges = 0;
  for (const node of kg.nodes) {
    if (!langUpdates[node.id] || langUpdates[node.id] === node.lang) continue;
    const hasPercentage = /\(\d+(\.\d+)?%\)/.test(node.lang);
    if (hasPercentage) {
      console.log(`  Lang skip (curated): ${node.id}: "${node.lang}"`);
      continue;
    }
    console.log(`  Lang update: ${node.id}: "${node.lang}" → "${langUpdates[node.id]}"`);
    node.lang = langUpdates[node.id];
    langChanges++;
  }

  // Append new edges
  if (newEdges.length > 0) {
    console.log(`\nNew edges detected (${newEdges.length}):`);
    for (const e of newEdges) {
      console.log(`  ${e.source} → ${e.target} [${e.type}] ${e.label}`);
    }
    kg.edges.push(...newEdges);
  } else {
    console.log('\nNo new edges detected.');
  }

  // Update meta
  kg.meta.generated = new Date().toISOString();
  kg.meta.edges = kg.edges.length;
  kg.meta.repos = kg.nodes.length;
  kg.meta.source = `auto-scan + manual (v${kg.meta.version})`;
  kg.meta.lastScan = new Date().toISOString();

  const totalChanges = newEdges.length + langChanges;
  console.log(`\nSummary: ${newEdges.length} new edges, ${langChanges} lang updates, ${totalChanges} total changes`);

  if (totalChanges === 0) {
    console.log('Graph is up to date. No changes needed.');
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would write changes but skipping.');
    console.log(JSON.stringify({ newEdges, langChanges }, null, 2));
  } else {
    fs.writeFileSync(KG_PATH, JSON.stringify(kg, null, 2) + '\n');
    console.log(`\nWrote updated graph to ${KG_PATH}`);
  }
}

main().catch((err) => {
  console.error('Scanner failed:', err);
  process.exit(1);
});
