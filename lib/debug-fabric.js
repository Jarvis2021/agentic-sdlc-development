const fs = require('fs');
const path = require('path');

const {
  appendEvent,
  createTrace,
  ensureSessionRuntime,
  getRuntimePaths,
  readIndex,
} = require('./session-runtime');

let diagnosticCounter = 0;

function normalizeCommandFailure(input = {}) {
  return {
    schema_version: '1.0.0',
    kind: 'command_failure',
    source: input.source || 'local',
    framework: input.framework || 'shell',
    severity: input.severity || 'error',
    session_id: input.session_id || null,
    plan_id: input.plan_id || null,
    trace_id: input.trace_id || null,
    command: input.command || '',
    exit_code: typeof input.exit_code === 'number' ? input.exit_code : 1,
    summary: input.summary || summarizeText(input.stderr || input.stdout || 'Command failed'),
    stdout: input.stdout || '',
    stderr: input.stderr || '',
    evidence: input.evidence || [],
    created_at: input.created_at || new Date().toISOString(),
  };
}

function normalizeTestFailure(input = {}) {
  const output = input.output || '';
  const failedTests = output
    .split('\n')
    .filter((line) => /(^FAIL\b|^\s*✗|^\s*×|::.*FAILED|AssertionError)/i.test(line.trim()))
    .map((line) => line.trim())
    .slice(0, 20);

  return {
    schema_version: '1.0.0',
    kind: 'test_failure',
    source: input.source || 'local',
    framework: input.framework || 'unknown',
    severity: input.severity || 'error',
    session_id: input.session_id || null,
    plan_id: input.plan_id || null,
    trace_id: input.trace_id || null,
    command: input.command || '',
    summary: input.summary || `Detected ${failedTests.length || 1} failing test signal(s)`,
    files: input.files || [],
    failed_tests: failedTests,
    raw_output: output,
    evidence: input.evidence || [],
    created_at: input.created_at || new Date().toISOString(),
  };
}

function normalizeCiFailure(input = {}) {
  return {
    schema_version: '1.0.0',
    kind: 'ci_failure',
    source: input.source || 'ci',
    framework: input.framework || 'github-actions',
    severity: input.severity || 'error',
    session_id: input.session_id || null,
    plan_id: input.plan_id || null,
    trace_id: input.trace_id || null,
    workflow: input.workflow || '',
    job: input.job || '',
    step: input.step || '',
    run_url: input.run_url || '',
    summary: input.summary || summarizeText(input.log_excerpt || 'CI failure detected'),
    log_excerpt: input.log_excerpt || '',
    evidence: input.evidence || [],
    created_at: input.created_at || new Date().toISOString(),
  };
}

function normalizeBrowserVerification(input = {}) {
  return {
    schema_version: '1.0.0',
    kind: 'browser_verification',
    source: input.source || 'browser',
    framework: input.framework || 'browser-pack',
    severity: input.severity || (input.success === false ? 'error' : 'info'),
    session_id: input.session_id || null,
    plan_id: input.plan_id || null,
    trace_id: input.trace_id || null,
    url: input.url || '',
    action: input.action || 'verify',
    success: input.success !== false,
    summary: input.summary || summarizeBrowser(input),
    console_errors: input.console_errors || [],
    network_errors: input.network_errors || [],
    screenshot_path: input.screenshot_path || '',
    evidence: input.evidence || [],
    created_at: input.created_at || new Date().toISOString(),
  };
}

function writeDiagnostic(rootDir, diagnosticInput) {
  const paths = ensureSessionRuntime(rootDir);
  const index = readIndex(rootDir);
  const diagnostic = {
    id: diagnosticInput.id || nextDiagnosticId(),
    session_id: diagnosticInput.session_id || index.current_session_id,
    plan_id: diagnosticInput.plan_id || index.current_plan_id,
    trace_id: diagnosticInput.trace_id || index.current_trace_id,
    ...diagnosticInput,
  };

  const filePath = path.join(paths.diagnosticsDir, `${diagnostic.id}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(diagnostic, null, 2)}\n`);

  appendEvent(rootDir, {
    type: 'diagnostic.recorded',
    actor: 'debug-fabric',
    source: diagnostic.source || 'runtime',
    severity: diagnostic.severity || 'info',
    session_id: diagnostic.session_id,
    plan_id: diagnostic.plan_id,
    trace_id: diagnostic.trace_id,
    message: diagnostic.summary || `Recorded ${diagnostic.kind}`,
    payload: {
      diagnostic_id: diagnostic.id,
      kind: diagnostic.kind,
    },
  });

  return diagnostic;
}

function createEvidenceBundle(rootDir, input = {}) {
  const trace = createTrace(rootDir, {
    kind: input.kind || 'debug',
    summary: input.summary || 'Debug evidence bundle',
    status: input.status || 'captured',
    session_id: input.session_id,
    plan_id: input.plan_id,
    actor: input.actor || 'debug-fabric',
    metadata: {
      source: input.source || 'runtime',
      command: input.command || '',
    },
  });

  const diagnostics = [];
  if (input.command || input.stderr || input.stdout) {
    diagnostics.push(writeDiagnostic(rootDir, normalizeCommandFailure({
      ...input,
      trace_id: trace.id,
    })));
  }
  if (input.test_output) {
    diagnostics.push(writeDiagnostic(rootDir, normalizeTestFailure({
      ...input,
      output: input.test_output,
      trace_id: trace.id,
    })));
  }
  if (input.ci_log_excerpt) {
    diagnostics.push(writeDiagnostic(rootDir, normalizeCiFailure({
      ...input,
      log_excerpt: input.ci_log_excerpt,
      trace_id: trace.id,
    })));
  }
  if (input.url || input.console_errors || input.network_errors || input.screenshot_path) {
    diagnostics.push(writeDiagnostic(rootDir, normalizeBrowserVerification({
      ...input,
      trace_id: trace.id,
    })));
  }

  return {
    trace,
    diagnostics,
  };
}

function getDiagnosticsSummary(rootDir, options = {}) {
  const paths = getRuntimePaths(rootDir);
  if (!fs.existsSync(paths.diagnosticsDir)) {
    return {
      total: 0,
      by_kind: {},
      by_severity: {},
      recent: [],
    };
  }

  const diagnostics = fs.readdirSync(paths.diagnosticsDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(paths.diagnosticsDir, name), 'utf8')))
    .filter((item) => !options.session_id || item.session_id === options.session_id)
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));

  const summary = {
    total: diagnostics.length,
    by_kind: {},
    by_severity: {},
    recent: diagnostics.slice(-5).reverse(),
  };

  for (const diagnostic of diagnostics) {
    summary.by_kind[diagnostic.kind] = (summary.by_kind[diagnostic.kind] || 0) + 1;
    summary.by_severity[diagnostic.severity] = (summary.by_severity[diagnostic.severity] || 0) + 1;
  }

  return summary;
}

function summarizeText(text) {
  return String(text || '')
    .trim()
    .split('\n')
    .find(Boolean) || 'Diagnostic captured';
}

function summarizeBrowser(input) {
  if (input.success === false) {
    return `Browser verification failed for ${input.url || 'page'}`;
  }
  return `Browser verification captured for ${input.url || 'page'}`;
}

function nextDiagnosticId() {
  diagnosticCounter += 1;
  return `diag_${Date.now()}_${diagnosticCounter}`;
}

module.exports = {
  createEvidenceBundle,
  getDiagnosticsSummary,
  normalizeBrowserVerification,
  normalizeCiFailure,
  normalizeCommandFailure,
  normalizeTestFailure,
  writeDiagnostic,
};
