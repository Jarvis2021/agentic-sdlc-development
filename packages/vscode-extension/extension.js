const vscode = require('vscode');
const {
  buildDiagnosticsItems,
  buildRuntimeItems,
  buildStatusBarText,
  captureDebugEvidence,
  getDiagnosticsFeed,
  getLatestTraceMarkdown,
  getRuntimeSnapshot,
  getWorkspaceRoot,
} = require('./lib/runtime-bridge');

class StructuredTreeProvider {
  constructor(emptyLabel) {
    this.emptyLabel = emptyLabel;
    this.items = [];
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  setItems(items) {
    this.items = Array.isArray(items) ? items : [];
    this._onDidChangeTreeData.fire();
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getChildren(element) {
    if (!element) {
      if (this.items.length === 0) {
        return Promise.resolve([{ id: 'empty', label: this.emptyLabel }]);
      }
      return Promise.resolve(this.items);
    }
    return Promise.resolve(element.children || []);
  }

  getTreeItem(element) {
    const collapsibleState = element.children && element.children.length > 0
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    const item = new vscode.TreeItem(element.label, collapsibleState);
    item.id = element.id;
    item.description = element.description;
    item.tooltip = [element.label, element.description].filter(Boolean).join(' - ');
    if (element.command) {
      item.command = element.command;
    }
    return item;
  }
}

function activate(context) {
  const runtimeProvider = new StructuredTreeProvider('Open a workspace to inspect runtime state.');
  const diagnosticsProvider = new StructuredTreeProvider('Capture evidence to populate diagnostics.');
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'agenticSdlc.refresh';
  statusBar.text = 'Agentic SDLC: idle';
  statusBar.show();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('agenticSdlcRuntime', runtimeProvider),
    vscode.window.registerTreeDataProvider('agenticSdlcDiagnostics', diagnosticsProvider),
    statusBar
  );

  async function refreshViews() {
    const rootDir = getWorkspaceRoot(vscode.workspace.workspaceFolders);
    if (!rootDir) {
      runtimeProvider.setItems([]);
      diagnosticsProvider.setItems([]);
      statusBar.text = 'Agentic SDLC: no workspace';
      return;
    }

    try {
      const snapshot = getRuntimeSnapshot(rootDir);
      const diagnostics = getDiagnosticsFeed(rootDir);
      runtimeProvider.setItems(buildRuntimeItems(snapshot));
      diagnosticsProvider.setItems(buildDiagnosticsItems(diagnostics));
      statusBar.text = buildStatusBarText(snapshot);
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      runtimeProvider.setItems([{ id: 'runtime-error', label: `Runtime error: ${message}` }]);
      diagnosticsProvider.setItems([{ id: 'diagnostics-error', label: `Diagnostics error: ${message}` }]);
      statusBar.text = 'Agentic SDLC: error';
    }
  }

  async function ensureWorkspaceRoot() {
    const rootDir = getWorkspaceRoot(vscode.workspace.workspaceFolders);
    if (!rootDir) {
      await vscode.window.showWarningMessage('Agentic SDLC requires an open workspace folder.');
      return null;
    }
    return rootDir;
  }

  async function captureWithPrompts(mode) {
    const rootDir = await ensureWorkspaceRoot();
    if (!rootDir) {
      return;
    }

    const defaultSummary = {
      command: 'Captured command failure',
      test: 'Captured test failure',
      ci: 'Captured CI failure',
      browser: 'Captured browser verification',
    }[mode];

    const summary = await vscode.window.showInputBox({
      prompt: `Summary for ${mode} capture`,
      value: defaultSummary,
    });

    if (summary === undefined) {
      return;
    }

    const input = {
      kind: 'debug',
      summary,
    };

    if (mode === 'command') {
      input.command = await promptRequired('Command');
      if (!input.command) return;
      input.stderr = await promptOptional('stderr excerpt');
      input.stdout = await promptOptional('stdout excerpt');
    } else if (mode === 'test') {
      input.command = await promptOptional('Test command');
      input.test_output = await promptRequired('Test output');
      if (!input.test_output) return;
    } else if (mode === 'ci') {
      input.command = await promptOptional('CI command');
      input.ci_log_excerpt = await promptRequired('CI log excerpt');
      if (!input.ci_log_excerpt) return;
    } else if (mode === 'browser') {
      input.url = await promptRequired('URL');
      if (!input.url) return;
      input.screenshot_path = await promptOptional('Screenshot path');
      const successChoice = await vscode.window.showQuickPick(['success', 'failure'], {
        placeHolder: 'Browser verification result',
      });
      if (!successChoice) return;
      input.success = successChoice === 'success';
    }

    const result = captureDebugEvidence(rootDir, input);
    await refreshViews();
    await vscode.window.showInformationMessage(
      `Captured ${result.diagnostics.length} diagnostic(s) in trace ${result.trace.id}.`
    );
  }

  async function showResumeSnapshot() {
    const rootDir = await ensureWorkspaceRoot();
    if (!rootDir) {
      return;
    }

    const snapshot = getRuntimeSnapshot(rootDir);
    const document = await vscode.workspace.openTextDocument({
      language: 'json',
      content: `${JSON.stringify(snapshot, null, 2)}\n`,
    });
    await vscode.window.showTextDocument(document, { preview: false });
  }

  async function openLatestTrace() {
    const rootDir = await ensureWorkspaceRoot();
    if (!rootDir) {
      return;
    }

    const snapshot = getRuntimeSnapshot(rootDir);
    const tracePath = getLatestTraceMarkdown(rootDir, snapshot.current_trace?.id);
    if (!tracePath) {
      await vscode.window.showWarningMessage('No trace markdown file found in .ai/traces/.');
      return;
    }

    const document = await vscode.workspace.openTextDocument(tracePath);
    await vscode.window.showTextDocument(document, { preview: false });
  }

  function registerCommand(command, handler) {
    context.subscriptions.push(vscode.commands.registerCommand(command, handler));
  }

  registerCommand('agenticSdlc.refresh', refreshViews);
  registerCommand('agenticSdlc.captureCommandFailure', () => captureWithPrompts('command'));
  registerCommand('agenticSdlc.captureTestFailure', () => captureWithPrompts('test'));
  registerCommand('agenticSdlc.captureCiFailure', () => captureWithPrompts('ci'));
  registerCommand('agenticSdlc.captureBrowserVerification', () => captureWithPrompts('browser'));
  registerCommand('agenticSdlc.showResumeSnapshot', showResumeSnapshot);
  registerCommand('agenticSdlc.openLatestTrace', openLatestTrace);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(refreshViews),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('agenticSdlc')) {
        refreshViews();
      }
    })
  );

  refreshViews();
}

function deactivate() {}

async function promptRequired(label) {
  const value = await vscode.window.showInputBox({ prompt: label });
  return value && value.trim() ? value.trim() : null;
}

async function promptOptional(label) {
  const value = await vscode.window.showInputBox({ prompt: label });
  return value === undefined ? '' : value.trim();
}

module.exports = {
  activate,
  deactivate,
};
