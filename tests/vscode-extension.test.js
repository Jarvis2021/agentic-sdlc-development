import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(__dirname, '..');
const CLI_PATH = path.resolve(ROOT, 'bin/cli.js');
const EXTENSION_PKG = path.join(ROOT, 'packages/vscode-extension/package.json');
const EXTENSION_README = path.join(ROOT, 'packages/vscode-extension/README.md');
const EXTENSION_ICON = path.join(ROOT, 'packages/vscode-extension/icon.png');
const EXTENSION_DIAGRAM = path.join(ROOT, 'packages/vscode-extension/media/architecture-diagram.png');
const EXTENSION_DIR = path.join(ROOT, 'packages/vscode-extension');

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

function listVsixEntries(vsixPath) {
  const result = execSync(`python3 - <<'PY' "${vsixPath}"
import json, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    print(json.dumps(sorted(archive.namelist())))
PY`, {
    encoding: 'utf8',
  });
  return JSON.parse(result);
}

function readVsixEntry(vsixPath, entryPath) {
  return execSync(`python3 - <<'PY' "${vsixPath}" "${entryPath}"
import sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    print(archive.read(sys.argv[2]).decode('utf-8'))
PY`, {
    encoding: 'utf8',
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
    expect(runtimeItems.some((item) => item.id === 'execution')).toBe(true);
    expect(runtimeItems.some((item) => item.id === 'events')).toBe(true);
    expect(diagnosticsItems.some((item) => item.id === 'diagnostics-total')).toBe(true);
    expect(buildStatusBarText(snapshot)).toContain('Agentic SDLC');
    expect(snapshot.execution.current_mode).toBe('sprint');
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
    expect(pkg.version).toBe('1.0.4');
    expect(pkg.activationEvents).toBeUndefined();
    expect(pkg.contributes.views.explorer.some((view) => view.id === 'agenticSdlcRuntime')).toBe(true);
    expect(pkg.contributes.views.explorer.some((view) => view.id === 'agenticSdlcDiagnostics')).toBe(true);
    expect(pkg.dependencies['agentic-sdlc-development']).toBe('^1.0.0');
    expect(pkg.icon).toBe('icon.png');
    expect(pkg.files).toContain('README.md');
    expect(pkg.files).toContain('icon.png');
    expect(pkg.files).toContain('media/**/*.svg');
    expect(pkg.files).toContain('media/**/*.png');
  });

  it('ships Marketplace README and visual assets', () => {
    expect(fs.existsSync(EXTENSION_README)).toBe(true);
    expect(fs.existsSync(EXTENSION_ICON)).toBe(true);
    expect(fs.existsSync(EXTENSION_DIAGRAM)).toBe(true);

    const readme = fs.readFileSync(EXTENSION_README, 'utf8');
    expect(readme).toContain('# Agentic SDLC');
    expect(readme).toContain('Compared with IDE-native agent features');
    expect(readme).toContain('spec-kit');
  });

  it('packages the framework runtime into the VSIX', () => {
    const packageDir = createTempDir();
    const vsixPath = path.join(packageDir, 'agentic-sdlc-vscode-test.vsix');

    execSync(`npm run package -- --out "${vsixPath}"`, {
      cwd: EXTENSION_DIR,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const entries = listVsixEntries(vsixPath);
    expect(entries).toContain('extension/node_modules/agentic-sdlc-development/package.json');
    expect(entries).toContain('extension/node_modules/agentic-sdlc-development/lib/session-runtime.js');
    expect(entries).toContain('extension/node_modules/agentic-sdlc-development/lib/debug-fabric.js');

    const runtimeSource = readVsixEntry(
      vsixPath,
      'extension/node_modules/agentic-sdlc-development/lib/session-runtime.js'
    );
    expect(runtimeSource).toContain('current_mode');
    expect(runtimeSource).toContain('recordOffset');
    expect(runtimeSource).toContain('saveCheckpoint');

    cleanupDir(packageDir);
  });
});
