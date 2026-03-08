import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const ROOT = path.resolve(__dirname, '..');
const CLI_PATH = path.resolve(ROOT, 'bin/cli.js');

const {
  startSession,
  upsertPlan,
  createTrace,
  listEvents,
  getResumeSnapshot,
} = require('../lib/session-runtime');
const { createEvidenceBundle, getDiagnosticsSummary } = require('../lib/debug-fabric');
const {
  listPluginManifests,
  setPluginEnabled,
  doctorPlugins,
  syncPluginMcpConfig,
} = require('../lib/plugin-runtime');
const {
  searchSymbols,
  findSymbolUsages,
  renameSymbolPreview,
} = require('../lib/semantic-tools');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-runtime-'));
}

function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function runCli(args = '', cwd = undefined) {
  return execSync(`node "${CLI_PATH}" ${args}`, {
    encoding: 'utf8',
    cwd,
    env: { ...process.env, NODE_ENV: 'test' },
  });
}

describe('session-runtime', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    runCli(`"${tmpDir}"`);
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  it('creates session, plan, trace, and events', () => {
    const session = startSession(tmpDir, { story: 'PROJ-1', actor: 'planner' });
    const plan = upsertPlan(tmpDir, { id: 'proj-1-plan', title: 'Plan', session_id: session.id });
    const trace = createTrace(tmpDir, { summary: 'Trace summary', session_id: session.id, plan_id: plan.id });
    const events = listEvents(tmpDir, { limit: 10 });

    expect(session.id).toContain('session_');
    expect(plan.id).toBe('proj-1-plan');
    expect(trace.id).toContain('trace_');
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it('builds resume snapshot for active work', () => {
    const session = startSession(tmpDir, { story: 'PROJ-2', actor: 'planner' });
    upsertPlan(tmpDir, { id: 'proj-2-plan', title: 'Plan', session_id: session.id });
    const snapshot = getResumeSnapshot(tmpDir);

    expect(snapshot.current_session.id).toBe(session.id);
    expect(snapshot.current_plan.id).toBe('proj-2-plan');
  });
});

describe('debug-fabric', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    runCli(`"${tmpDir}"`);
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  it('captures evidence bundle with diagnostics', () => {
    const result = createEvidenceBundle(tmpDir, {
      summary: 'Test failure bundle',
      command: 'npm test',
      stderr: 'AssertionError: boom',
      test_output: 'FAIL tests/example.test.js',
      url: 'http://localhost:3000',
      screenshot_path: 'artifacts/failure.png',
    });

    expect(result.trace.id).toContain('trace_');
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(3);

    const summary = getDiagnosticsSummary(tmpDir);
    expect(summary.total).toBeGreaterThanOrEqual(3);
    expect(summary.by_kind.command_failure).toBeGreaterThanOrEqual(1);
  });
});

describe('plugin-runtime', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    runCli(`"${tmpDir}"`);
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  it('lists built-in plugin manifests', () => {
    const plugins = listPluginManifests(tmpDir);
    expect(plugins.length).toBeGreaterThanOrEqual(6);
    expect(plugins.some((plugin) => plugin.name === 'browser-pack')).toBe(true);
  });

  it('can disable plugin and sync mcp catalog', () => {
    setPluginEnabled(tmpDir, 'browser-pack', false);
    const mcp = syncPluginMcpConfig(tmpDir);
    expect(mcp.plugins.enabled).not.toContain('browser-pack');
  });

  it('doctor validates plugin manifests', () => {
    const result = doctorPlugins(tmpDir);
    expect(result.valid).toBe(true);
    expect(result.plugin_count).toBeGreaterThanOrEqual(6);
  });
});

describe('semantic-tools', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    fs.writeFileSync(path.join(tmpDir, 'app.js'), 'function startSession() { return startSessionHelper(); }\n');
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src', 'helpers.js'), 'export const startSessionHelper = () => true;\n');
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  it('searches symbols with fallback text search', () => {
    const result = searchSymbols(tmpDir, { symbol: 'startSession' });
    expect(result.total_matches).toBeGreaterThanOrEqual(1);
    expect(result.mode).toBe('fallback-text-search');
  });

  it('finds usages', () => {
    const result = findSymbolUsages(tmpDir, { symbol: 'startSessionHelper' });
    expect(result.total_matches).toBeGreaterThanOrEqual(1);
  });

  it('creates rename preview', () => {
    const result = renameSymbolPreview(tmpDir, { symbol: 'startSessionHelper', replacement: 'resumeSessionHelper' });
    expect(result.impacted_files.length).toBeGreaterThanOrEqual(1);
    expect(result.impacted_references[0].replacement_preview).toContain('resumeSessionHelper');
  });
});
