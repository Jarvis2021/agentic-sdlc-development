import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(__dirname, '..');
const CLI_PATH = path.resolve(ROOT, 'bin/cli.js');
const EXTENSION_PKG = path.join(ROOT, 'packages/vscode-extension/package.json');

const {
  buildDiagnosticsItems,
  buildRuntimeItems,
  buildStatusBarText,
  captureDebugEvidence,
  getDiagnosticsFeed,
  getLatestTraceMarkdown,
  getRuntimeSnapshot,
  getWorkspaceRoot,
} = require('../packages/vscode-extension/lib/runtime-bridge');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-vscode-'));
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

describe('vscode extension runtime bridge', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    runCli(`"${tmpDir}"`);
    runCli(`plan vscode-debug "${tmpDir}" --title "VS Code Debug Plan" --story PROJ-321`);
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  it('resolves the first workspace root', () => {
    const root = getWorkspaceRoot([{ uri: { fsPath: tmpDir } }]);
    expect(root).toBe(tmpDir);
  });

  it('captures debug evidence against the workspace runtime', () => {
    const result = captureDebugEvidence(tmpDir, {
      kind: 'debug',
      summary: 'Captured from extension',
      command: 'npm test',
      stderr: 'AssertionError: expected 1 to equal 2',
      test_output: 'FAIL tests/cart.test.js',
    });

    expect(result.trace.id).toContain('trace_');
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(2);

    const summary = getDiagnosticsFeed(tmpDir);
    expect(summary.total).toBeGreaterThanOrEqual(2);
    expect(summary.by_kind.command_failure).toBeGreaterThanOrEqual(1);
    expect(summary.by_kind.test_failure).toBeGreaterThanOrEqual(1);
  });

  it('builds runtime and diagnostics view models', () => {
    captureDebugEvidence(tmpDir, {
      kind: 'debug',
      summary: 'View model trace',
      ci_log_excerpt: 'Job failed in build step',
    });

    const snapshot = getRuntimeSnapshot(tmpDir);
    const runtimeItems = buildRuntimeItems(snapshot);
    const diagnosticsItems = buildDiagnosticsItems(getDiagnosticsFeed(tmpDir));

    expect(runtimeItems.some((item) => item.id === 'session')).toBe(true);
    expect(runtimeItems.some((item) => item.id === 'events')).toBe(true);
    expect(diagnosticsItems.some((item) => item.id === 'diagnostics-total')).toBe(true);
    expect(buildStatusBarText(snapshot)).toContain('Agentic SDLC');
  });

  it('finds the latest trace markdown file', () => {
    const result = captureDebugEvidence(tmpDir, {
      kind: 'debug',
      summary: 'Trace lookup',
      command: 'npm test',
      stderr: 'Failure',
    });

    const tracePath = getLatestTraceMarkdown(tmpDir, result.trace.id);
    expect(tracePath).toContain(`${result.trace.id}.md`);
    expect(fs.existsSync(tracePath)).toBe(true);
  });
});

describe('vscode extension package manifest', () => {
  it('declares VS Code commands, views, and engine support', () => {
    const pkg = JSON.parse(fs.readFileSync(EXTENSION_PKG, 'utf8'));

    expect(pkg.engines.vscode).toBe('^1.110.0');
    expect(pkg.activationEvents).toContain('onCommand:agenticSdlc.captureCommandFailure');
    expect(pkg.contributes.views.explorer.some((view) => view.id === 'agenticSdlcRuntime')).toBe(true);
    expect(pkg.contributes.views.explorer.some((view) => view.id === 'agenticSdlcDiagnostics')).toBe(true);
    expect(pkg.dependencies['agentic-sdlc-development']).toBe('^1.0.0');
  });
});
