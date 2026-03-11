const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_VERSION = '1.0.0';
const COUNTER_KEYS = ['sessions', 'plans', 'tasks', 'traces', 'approvals', 'diagnostics', 'events'];

function defaultExecutionState() {
  return {
    current_mode: 'sprint',
    offset_cursor: null,
    last_save: null,
    sprint: {
      status: 'idle',
      burst_count: 0,
      offset_count: 0,
      save_count: 0,
      failure_streak: 0,
      last_started_at: null,
      last_evaluated_at: null,
    },
  };
}

function defaultIndex() {
  return {
    schema_version: SCHEMA_VERSION,
    current_session_id: null,
    current_plan_id: null,
    current_trace_id: null,
    counters: COUNTER_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {}),
    execution: defaultExecutionState(),
    updated_at: null,
  };
}

function getRuntimePaths(rootDir) {
  const base = path.join(rootDir, '.ai', 'session-state');
  return {
    base,
    index: path.join(base, 'index.json'),
    events: path.join(base, 'events.jsonl'),
    sessionsDir: path.join(base, 'sessions'),
    plansDir: path.join(base, 'plans'),
    tasksDir: path.join(base, 'tasks'),
    tracesDir: path.join(base, 'traces'),
    diagnosticsDir: path.join(base, 'diagnostics'),
    approvalsDir: path.join(base, 'approvals'),
  };
}

function ensureSessionRuntime(rootDir) {
  const paths = getRuntimePaths(rootDir);
  fs.mkdirSync(paths.base, { recursive: true });
  fs.mkdirSync(paths.sessionsDir, { recursive: true });
  fs.mkdirSync(paths.plansDir, { recursive: true });
  fs.mkdirSync(paths.tasksDir, { recursive: true });
  fs.mkdirSync(paths.tracesDir, { recursive: true });
  fs.mkdirSync(paths.diagnosticsDir, { recursive: true });
  fs.mkdirSync(paths.approvalsDir, { recursive: true });

  if (!fs.existsSync(paths.index)) {
    writeJson(paths.index, defaultIndex());
  }

  if (!fs.existsSync(paths.events)) {
    fs.writeFileSync(paths.events, '');
  }

  return paths;
}

function readIndex(rootDir) {
  ensureSessionRuntime(rootDir);
  return normalizeIndex(readJson(getRuntimePaths(rootDir).index, defaultIndex()));
}

function writeIndex(rootDir, index) {
  const paths = ensureSessionRuntime(rootDir);
  const normalized = normalizeIndex(index);
  normalized.updated_at = new Date().toISOString();
  writeJson(paths.index, normalized);
  return normalized;
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function appendEvent(rootDir, event) {
  const paths = ensureSessionRuntime(rootDir);
  const index = readIndex(rootDir);
  const normalized = {
    id: event.id || newId('evt'),
    type: event.type || 'info',
    actor: event.actor || 'system',
    source: event.source || 'runtime',
    severity: event.severity || 'info',
    session_id: event.session_id || index.current_session_id || null,
    plan_id: event.plan_id || index.current_plan_id || null,
    trace_id: event.trace_id || index.current_trace_id || null,
    message: event.message || '',
    payload: event.payload || {},
    created_at: event.created_at || new Date().toISOString(),
  };

  fs.appendFileSync(paths.events, `${JSON.stringify(normalized)}\n`);
  index.counters.events = (index.counters.events || 0) + 1;
  writeIndex(rootDir, index);
  return normalized;
}

function listEvents(rootDir, options = {}) {
  const paths = ensureSessionRuntime(rootDir);
  const {
    limit = 20,
    type,
    severity,
    session_id,
  } = options;

  const lines = fs.readFileSync(paths.events, 'utf8')
    .split('\n')
    .filter(Boolean);

  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch (_) {
      // Ignore malformed runtime lines.
    }
  }

  return events
    .filter((event) => !type || event.type === type)
    .filter((event) => !severity || event.severity === severity)
    .filter((event) => !session_id || event.session_id === session_id)
    .slice(-limit)
    .reverse();
}

function startSession(rootDir, input = {}) {
  const paths = ensureSessionRuntime(rootDir);
  const index = readIndex(rootDir);
  const session = {
    id: input.id || newId('session'),
    story: input.story || 'manual',
    branch: input.branch || 'main',
    actor: input.actor || 'planner',
    summary: input.summary || '',
    status: input.status || 'active',
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: input.metadata || {},
  };

  writeJson(path.join(paths.sessionsDir, `${session.id}.json`), session);
  index.current_session_id = session.id;
  index.counters.sessions = (index.counters.sessions || 0) + 1;
  writeIndex(rootDir, index);

  appendEvent(rootDir, {
    type: 'session.created',
    actor: session.actor,
    source: 'cli',
    session_id: session.id,
    message: `Started session ${session.id}`,
    payload: {
      story: session.story,
      branch: session.branch,
    },
  });

  startSprint(rootDir, {
    actor: session.actor,
    source: input.source || 'cli',
    reason: input.summary || 'new session',
    message: `Sprint ready for session ${session.id}`,
    reset_offset: true,
  });

  return session;
}

function upsertPlan(rootDir, input = {}) {
  const paths = ensureSessionRuntime(rootDir);
  const index = readIndex(rootDir);
  const slug = sanitizeSlug(input.slug || input.title || 'plan');
  const id = input.id || slug;
  const planPath = path.join(paths.plansDir, `${id}.json`);
  const existing = readJson(planPath, null);
  const plan = {
    id,
    slug,
    title: input.title || existing?.title || slug,
    story: input.story || existing?.story || 'manual',
    classification: input.classification || existing?.classification || 'MEDIUM',
    status: input.status || existing?.status || 'draft',
    summary: input.summary || existing?.summary || '',
    session_id: input.session_id || existing?.session_id || index.current_session_id,
    task_ids: input.task_ids || existing?.task_ids || [],
    approvals: input.approvals || existing?.approvals || [],
    metadata: input.metadata || existing?.metadata || {},
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  writeJson(planPath, plan);
  if (!existing) {
    index.counters.plans = (index.counters.plans || 0) + 1;
  }
  index.current_plan_id = plan.id;
  writeIndex(rootDir, index);

  appendEvent(rootDir, {
    type: existing ? 'plan.updated' : 'plan.created',
    actor: input.actor || 'planner',
    source: 'cli',
    session_id: plan.session_id,
    plan_id: plan.id,
    message: `${existing ? 'Updated' : 'Created'} plan ${plan.id}`,
    payload: {
      title: plan.title,
      classification: plan.classification,
      status: plan.status,
    },
  });

  return plan;
}

function upsertTask(rootDir, input = {}) {
  const paths = ensureSessionRuntime(rootDir);
  const index = readIndex(rootDir);
  const id = input.id || newId('task');
  const taskPath = path.join(paths.tasksDir, `${id}.json`);
  const existing = readJson(taskPath, null);
  const task = {
    id,
    plan_id: input.plan_id || existing?.plan_id || index.current_plan_id,
    session_id: input.session_id || existing?.session_id || index.current_session_id,
    title: input.title || existing?.title || id,
    status: input.status || existing?.status || 'pending',
    owner: input.owner || existing?.owner || 'implementer',
    blocked_by: input.blocked_by || existing?.blocked_by || [],
    metadata: input.metadata || existing?.metadata || {},
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  writeJson(taskPath, task);
  if (!existing) {
    index.counters.tasks = (index.counters.tasks || 0) + 1;
  }
  writeIndex(rootDir, index);

  appendEvent(rootDir, {
    type: existing ? 'task.updated' : 'task.created',
    actor: task.owner,
    source: 'runtime',
    session_id: task.session_id,
    plan_id: task.plan_id,
    message: `${existing ? 'Updated' : 'Created'} task ${task.id}`,
    payload: {
      title: task.title,
      status: task.status,
    },
  });

  return task;
}

function createTrace(rootDir, input = {}) {
  const paths = ensureSessionRuntime(rootDir);
  const index = readIndex(rootDir);
  const trace = {
    id: input.id || newId('trace'),
    kind: input.kind || 'execution',
    session_id: input.session_id || index.current_session_id,
    plan_id: input.plan_id || index.current_plan_id,
    summary: input.summary || '',
    status: input.status || 'active',
    artifacts: input.artifacts || [],
    metadata: input.metadata || {},
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  writeJson(path.join(paths.tracesDir, `${trace.id}.json`), trace);
  index.current_trace_id = trace.id;
  index.counters.traces = (index.counters.traces || 0) + 1;
  writeIndex(rootDir, index);

  appendEvent(rootDir, {
    type: 'trace.created',
    actor: input.actor || 'runtime',
    source: 'cli',
    session_id: trace.session_id,
    plan_id: trace.plan_id,
    trace_id: trace.id,
    message: `Created trace ${trace.id}`,
    payload: {
      kind: trace.kind,
      status: trace.status,
    },
  });

  return trace;
}

function recordApproval(rootDir, input = {}) {
  const paths = ensureSessionRuntime(rootDir);
  const index = readIndex(rootDir);
  const approval = {
    id: input.id || newId('approval'),
    session_id: input.session_id || index.current_session_id,
    plan_id: input.plan_id || index.current_plan_id,
    subject: input.subject || 'approval',
    requested_by: input.requested_by || 'planner',
    requested_from: input.requested_from || 'human',
    status: input.status || 'pending',
    rationale: input.rationale || '',
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  writeJson(path.join(paths.approvalsDir, `${approval.id}.json`), approval);
  index.counters.approvals = (index.counters.approvals || 0) + 1;
  writeIndex(rootDir, index);

  appendEvent(rootDir, {
    type: 'approval.requested',
    actor: approval.requested_by,
    source: 'runtime',
    session_id: approval.session_id,
    plan_id: approval.plan_id,
    message: `Requested approval for ${approval.subject}`,
    payload: {
      subject: approval.subject,
      status: approval.status,
    },
  });

  return approval;
}

function getResumeSnapshot(rootDir, sessionId) {
  const paths = ensureSessionRuntime(rootDir);
  const index = readIndex(rootDir);
  const activeSessionId = sessionId || index.current_session_id;
  const session = activeSessionId
    ? readJson(path.join(paths.sessionsDir, `${activeSessionId}.json`), null)
    : null;

  const plans = readDirJson(paths.plansDir);
  const tasks = readDirJson(paths.tasksDir);
  const traces = readDirJson(paths.tracesDir);
  const approvals = readDirJson(paths.approvalsDir);
  const recentEvents = listEvents(rootDir, { limit: 10, session_id: activeSessionId });

  return {
    index,
    execution: index.execution,
    current_session: session,
    current_plan: index.current_plan_id ? readJson(path.join(paths.plansDir, `${index.current_plan_id}.json`), null) : null,
    current_trace: index.current_trace_id ? readJson(path.join(paths.tracesDir, `${index.current_trace_id}.json`), null) : null,
    open_approvals: approvals.filter((approval) => approval.status === 'pending'),
    task_summary: summarizeTasks(tasks, index.current_plan_id),
    totals: {
      sessions: plans.length ? index.counters.sessions : index.counters.sessions || 0,
      plans: plans.length,
      tasks: tasks.length,
      traces: traces.length,
      approvals: approvals.length,
      events: index.counters.events || 0,
    },
    recent_events: recentEvents,
  };
}

function getRuntimeSummary(rootDir) {
  const snapshot = getResumeSnapshot(rootDir);
  return {
    current_session_id: snapshot.current_session?.id || null,
    current_plan_id: snapshot.current_plan?.id || null,
    current_trace_id: snapshot.current_trace?.id || null,
    execution: snapshot.execution,
    open_approvals: snapshot.open_approvals.length,
    task_summary: snapshot.task_summary,
    totals: snapshot.totals,
  };
}

function startSprint(rootDir, input = {}) {
  const index = readIndex(rootDir);
  const now = input.at || new Date().toISOString();
  const burstCount = (index.execution.sprint?.burst_count || 0) + 1;
  return updateExecutionState(rootDir, {
    current_mode: 'sprint',
    offset_cursor: input.reset_offset ? null : index.execution.offset_cursor,
    sprint: {
      status: input.status || 'active',
      burst_count: burstCount,
      last_started_at: now,
      last_evaluated_at: now,
      failure_streak: typeof input.failure_streak === 'number'
        ? input.failure_streak
        : (index.execution.sprint?.failure_streak || 0),
    },
  }, {
    eventType: 'execution.sprint',
    actor: input.actor || 'runtime',
    source: input.source || 'runtime',
    message: input.message || `Started sprint burst ${burstCount}`,
    payload: {
      reason: input.reason || 'execution ready',
      burst_count: burstCount,
    },
  });
}

function recordOffset(rootDir, input = {}) {
  const index = readIndex(rootDir);
  const now = input.at || new Date().toISOString();
  const latestEvent = listEvents(rootDir, {
    limit: 1,
    session_id: index.current_session_id,
  })[0];
  const offsetCount = (index.execution.sprint?.offset_count || 0) + 1;
  const cursor = {
    event_id: input.event_id || latestEvent?.id || null,
    trace_id: input.trace_id || index.current_trace_id || null,
    plan_id: input.plan_id || index.current_plan_id || null,
    session_id: input.session_id || index.current_session_id || null,
    reason: input.reason || 'offset requested',
    council_verdict: input.council_verdict || null,
    created_at: now,
  };

  return updateExecutionState(rootDir, {
    current_mode: 'resume',
    offset_cursor: cursor,
    sprint: {
      status: input.status || 'offset',
      offset_count: offsetCount,
      failure_streak: typeof input.failure_streak === 'number'
        ? input.failure_streak
        : (index.execution.sprint?.failure_streak || 0),
      last_evaluated_at: now,
    },
  }, {
    eventType: 'execution.offset',
    actor: input.actor || 'council',
    source: input.source || 'runtime',
    message: input.message || `Offset recorded after ${cursor.reason}`,
    payload: cursor,
  });
}

function saveCheckpoint(rootDir, input = {}) {
  const index = readIndex(rootDir);
  const now = input.at || new Date().toISOString();
  const saveCount = (index.execution.sprint?.save_count || 0) + 1;
  const save = {
    reason: input.reason || 'checkpoint requested',
    source: input.source || 'runtime',
    actor: input.actor || 'checkpoint',
    mode_before_save: index.execution.current_mode,
    offset_cursor: index.execution.offset_cursor,
    created_at: now,
  };

  return updateExecutionState(rootDir, {
    last_save: save,
    sprint: {
      status: input.status || index.execution.sprint?.status || 'active',
      save_count: saveCount,
      last_evaluated_at: now,
    },
  }, {
    eventType: 'execution.save',
    actor: save.actor,
    source: save.source,
    message: input.message || `Saved runtime checkpoint for ${save.reason}`,
    payload: save,
  });
}

function updateExecutionState(rootDir, executionPatch = {}, eventInput = null) {
  const index = readIndex(rootDir);
  index.execution = mergeExecutionState(index.execution, executionPatch);
  const updated = writeIndex(rootDir, index);

  if (eventInput?.eventType) {
    appendEvent(rootDir, {
      type: eventInput.eventType,
      actor: eventInput.actor || 'runtime',
      source: eventInput.source || 'runtime',
      session_id: updated.current_session_id,
      plan_id: updated.current_plan_id,
      trace_id: updated.current_trace_id,
      message: eventInput.message || eventInput.eventType,
      payload: eventInput.payload || {},
    });
  }

  return updated.execution;
}

function summarizeTasks(tasks, planId) {
  const scoped = planId
    ? tasks.filter((task) => task.plan_id === planId)
    : tasks;

  return scoped.reduce((acc, task) => {
    acc.total++;
    acc.by_status[task.status] = (acc.by_status[task.status] || 0) + 1;
    return acc;
  }, { total: 0, by_status: {} });
}

function readDirJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(dir, name), null))
    .filter(Boolean)
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
}

function sanitizeSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'plan';
}

function normalizeIndex(index = {}) {
  const base = defaultIndex();
  return {
    ...base,
    ...index,
    counters: COUNTER_KEYS.reduce((acc, key) => {
      acc[key] = Number(index?.counters?.[key] ?? base.counters[key]) || 0;
      return acc;
    }, {}),
    execution: mergeExecutionState(base.execution, index.execution || {}),
  };
}

function mergeExecutionState(currentState, patchState) {
  const current = currentState || defaultExecutionState();
  const patch = patchState || {};
  return {
    ...defaultExecutionState(),
    ...current,
    ...patch,
    sprint: {
      ...defaultExecutionState().sprint,
      ...(current.sprint || {}),
      ...(patch.sprint || {}),
    },
    offset_cursor: patch.offset_cursor !== undefined ? patch.offset_cursor : current.offset_cursor,
    last_save: patch.last_save !== undefined ? patch.last_save : current.last_save,
  };
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

module.exports = {
  SCHEMA_VERSION,
  appendEvent,
  createTrace,
  ensureSessionRuntime,
  getResumeSnapshot,
  getRuntimePaths,
  getRuntimeSummary,
  listEvents,
  newId,
  recordOffset,
  readIndex,
  recordApproval,
  saveCheckpoint,
  startSprint,
  startSession,
  updateExecutionState,
  upsertPlan,
  upsertTask,
  writeIndex,
};
