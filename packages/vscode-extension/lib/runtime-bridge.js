const fs = require('fs');
const path = require('path');

function requireFrameworkModule(modulePath) {
  const normalizedPath = modulePath.replace(/\\/g, '/');
  const localCandidate = path.resolve(__dirname, '../../../', normalizedPath);
  const packageCandidate = `agentic-sdlc-development/${normalizedPath.replace(/\.js$/, '')}`;

  if (fs.existsSync(localCandidate)) {
    return require(localCandidate);
  }
  try {
    return require(packageCandidate);
  } catch (error) {
    throw new Error(
      `Agentic SDLC runtime module could not be resolved for ${normalizedPath}. ` +
      `Tried local path ${localCandidate} and package path ${packageCandidate}. ` +
      `Original error: ${error.message}`
    );
  }
}

const sessionRuntime = requireFrameworkModule('lib/session-runtime.js');
const debugFabric = requireFrameworkModule('lib/debug-fabric.js');

function getWorkspaceRoot(workspaceFolders) {
  if (!Array.isArray(workspaceFolders) || workspaceFolders.length === 0) {
    return null;
  }

  const firstFolder = workspaceFolders[0];
  return firstFolder && firstFolder.uri && firstFolder.uri.fsPath
    ? firstFolder.uri.fsPath
    : null;
}

function getRuntimeSnapshot(rootDir, sessionId) {
  return sessionRuntime.getResumeSnapshot(rootDir, sessionId);
}

function getDiagnosticsFeed(rootDir, options = {}) {
  return debugFabric.getDiagnosticsSummary(rootDir, options);
}

function listRuntimeEvents(rootDir, options = {}) {
  return sessionRuntime.listEvents(rootDir, options);
}

function captureDebugEvidence(rootDir, input = {}) {
  const result = debugFabric.createEvidenceBundle(rootDir, input);
  writeTraceMarkdown(rootDir, result);
  return result;
}

function getLatestTraceMarkdown(rootDir, traceId) {
  const tracesDir = path.join(rootDir, '.ai', 'traces');
  if (!fs.existsSync(tracesDir)) {
    return null;
  }

  if (traceId) {
    const directPath = path.join(tracesDir, `${traceId}.md`);
    if (fs.existsSync(directPath)) {
      return directPath;
    }
  }

  const markdownFiles = fs.readdirSync(tracesDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const filePath = path.join(tracesDir, name);
      return {
        filePath,
        mtimeMs: fs.statSync(filePath).mtimeMs,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return markdownFiles[0] ? markdownFiles[0].filePath : null;
}

function buildRuntimeItems(snapshot) {
  const executionChildren = [];
  if (snapshot.execution?.offset_cursor?.reason) {
    executionChildren.push({
      id: 'execution-offset',
      label: `Offset: ${snapshot.execution.offset_cursor.reason}`,
      description: snapshot.execution.offset_cursor.council_verdict || '',
    });
  }
  if (snapshot.execution?.last_save?.reason) {
    executionChildren.push({
      id: 'execution-save',
      label: `Last save: ${snapshot.execution.last_save.reason}`,
      description: snapshot.execution.last_save.created_at || '',
    });
  }

  const items = [
    {
      id: 'session',
      label: `Session: ${snapshot.current_session?.id || 'none'}`,
      description: snapshot.current_session?.story || '',
    },
    {
      id: 'plan',
      label: `Plan: ${snapshot.current_plan?.id || 'none'}`,
      description: snapshot.current_plan?.status || '',
    },
    {
      id: 'trace',
      label: `Trace: ${snapshot.current_trace?.id || 'none'}`,
      description: snapshot.current_trace?.kind || '',
    },
    {
      id: 'execution',
      label: `Execution: ${snapshot.execution?.current_mode || 'unknown'}`,
      description: snapshot.execution?.sprint?.status || '',
      children: executionChildren,
    },
    {
      id: 'approvals',
      label: `Open approvals: ${snapshot.open_approvals?.length || 0}`,
    },
    {
      id: 'totals',
      label: `Totals: ${formatTotals(snapshot.totals || {})}`,
    },
  ];

  const taskChildren = Object.entries(snapshot.task_summary?.by_status || {}).map(([status, count]) => ({
    id: `task-${status}`,
    label: `${status}: ${count}`,
  }));

  items.push({
    id: 'tasks',
    label: `Tasks: ${snapshot.task_summary?.total || 0}`,
    children: taskChildren,
  });

  const eventChildren = (snapshot.recent_events || []).map((event) => ({
    id: event.id,
    label: `${event.type}: ${singleLine(event.message || 'No message')}`,
    description: event.created_at || '',
  }));

  items.push({
    id: 'events',
    label: `Recent events: ${eventChildren.length}`,
    children: eventChildren,
  });

  return items;
}

function buildDiagnosticsItems(summary) {
  const kindChildren = Object.entries(summary.by_kind || {}).map(([kind, count]) => ({
    id: `kind-${kind}`,
    label: `${kind}: ${count}`,
  }));

  const severityChildren = Object.entries(summary.by_severity || {}).map(([severity, count]) => ({
    id: `severity-${severity}`,
    label: `${severity}: ${count}`,
  }));

  const recentChildren = (summary.recent || []).map((diagnostic) => ({
    id: diagnostic.id,
    label: `${diagnostic.kind}: ${singleLine(diagnostic.summary || 'Diagnostic captured')}`,
    description: diagnostic.created_at || '',
  }));

  return [
    {
      id: 'diagnostics-total',
      label: `Diagnostics: ${summary.total || 0}`,
    },
    {
      id: 'diagnostics-kind',
      label: `By kind: ${kindChildren.length}`,
      children: kindChildren,
    },
    {
      id: 'diagnostics-severity',
      label: `By severity: ${severityChildren.length}`,
      children: severityChildren,
    },
    {
      id: 'diagnostics-recent',
      label: `Recent: ${recentChildren.length}`,
      children: recentChildren,
    },
  ];
}

function buildStatusBarText(snapshot) {
  const sessionId = snapshot.current_session?.id || 'no session';
  const story = snapshot.current_session?.story || 'manual';
  const mode = snapshot.execution?.current_mode || 'unknown';
  return `Agentic SDLC: ${story} (${sessionId}, ${mode})`;
}

function formatTotals(totals) {
  const orderedKeys = ['sessions', 'plans', 'tasks', 'traces', 'approvals', 'events'];
  return orderedKeys
    .filter((key) => totals[key] !== undefined)
    .map((key) => `${key}=${totals[key]}`)
    .join(', ');
}

function singleLine(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function writeTraceMarkdown(rootDir, result) {
  const tracePath = path.join(rootDir, '.ai', 'traces', `${result.trace.id}.md`);
  const lines = [
    `# Trace ${result.trace.id}`,
    '',
    '## Trace',
    `- Kind: \`${result.trace.kind}\``,
    `- Status: \`${result.trace.status}\``,
    `- Summary: ${result.trace.summary || 'No summary'}`,
    '',
    '## Diagnostics',
  ];

  if ((result.diagnostics || []).length === 0) {
    lines.push('- No diagnostics recorded.');
  } else {
    for (const diagnostic of result.diagnostics) {
      lines.push(`- \`${diagnostic.kind}\`: ${diagnostic.summary}`);
    }
  }

  fs.mkdirSync(path.dirname(tracePath), { recursive: true });
  fs.writeFileSync(tracePath, `${lines.join('\n')}\n`);
}

module.exports = {
  buildDiagnosticsItems,
  buildRuntimeItems,
  buildStatusBarText,
  captureDebugEvidence,
  getDiagnosticsFeed,
  getLatestTraceMarkdown,
  getRuntimeSnapshot,
  getWorkspaceRoot,
  listRuntimeEvents,
};
