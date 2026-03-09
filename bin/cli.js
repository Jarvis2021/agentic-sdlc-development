#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { validateAgentFiles, getFrameworkStatus } = require('../lib/agent-validator');
const {
  ensureSessionRuntime,
  getResumeSnapshot,
  getRuntimeSummary,
  listEvents,
  readIndex,
  recordApproval,
  startSession,
  upsertPlan,
  createTrace,
} = require('../lib/session-runtime');
const { createEvidenceBundle, getDiagnosticsSummary } = require('../lib/debug-fabric');
const {
  ensurePluginRuntime,
  listPluginManifests,
  setPluginEnabled,
  doctorPlugins,
  syncPluginMcpConfig,
} = require('../lib/plugin-runtime');

const VERSION = '1.0.0';
const args = process.argv.slice(2);
const command = args[0];

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Agentic SDLC Framework v${VERSION}

Usage: agentic-sdlc <command> [options] [directory]

Commands:
  init [dir]                    Scaffold framework into target directory (default: .)
  update [dir]                  Refresh protocols/templates/scripts/plugins without destroying customizations
  validate [dir]                Check structural integrity of framework installation
  status [dir]                  Show framework, runtime, and plugin health
  plan <slug> [dir]             Create or update a structured plan and markdown view
  resume [session_id] [dir]     Show active session, plan, tasks, approvals, and recent events
  trace [dir]                   Create a trace or evidence bundle for debugging/runtime proof
  events [dir]                  Show recent runtime events
  plugins <action> [name] [dir] Manage plugin packs (list, add, remove, update, doctor)

Options:
  --help, -h                    Show this help message
  --version                     Show version
  --title <text>                Plan title
  --story <id>                  Story or task identifier
  --summary <text>              Summary text
  --classification <level>      TRIVIAL | LOW | MEDIUM | HIGH
  --limit <n>                   Number of events to print
  --kind <kind>                 Trace kind (execution, debug, browser, ci)
  --command <cmd>               Failing command for evidence capture
  --stderr <text>               stderr excerpt for debug evidence
  --stdout <text>               stdout excerpt for debug evidence
  --test-output <text>          Test output for debug evidence
  --ci-log <text>               CI log excerpt for debug evidence
  --url <url>                   Browser verification target URL
  --screenshot <path>           Screenshot artifact path
`);
  process.exit(0);
}

if (args.includes('--version')) {
  console.log(VERSION);
  process.exit(0);
}

if (command === 'init') {
  runInit(resolveDirectory(args[1] || '.'));
} else if (command === 'validate') {
  runValidate(resolveDirectory(args[1]));
} else if (command === 'status') {
  runStatus(resolveDirectory(args[1]));
} else if (command === 'update') {
  runUpdate(resolveDirectory(args[1]));
} else if (command === 'plan') {
  runPlan(args.slice(1));
} else if (command === 'resume') {
  runResume(args.slice(1));
} else if (command === 'trace') {
  runTrace(args.slice(1));
} else if (command === 'events') {
  runEvents(args.slice(1));
} else if (command === 'plugins') {
  runPlugins(args.slice(1));
} else {
  runInit(resolveDirectory(command || '.'));
}

function runValidate(dir) {
  console.log(`\n🔍 Validating framework in: ${dir}\n`);
  const result = validateAgentFiles(dir);
  const pluginDoctor = doctorPlugins(dir);

  if (result.errors.length > 0) {
    console.log('ERRORS:');
    result.errors.forEach(e => console.log(`  ❌ ${e}`));
  }
  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    result.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }
  if (result.valid && result.warnings.length === 0) {
    console.log('  ✅ All checks passed\n');
  }

  if (!pluginDoctor.valid) {
    console.log('PLUGIN ISSUES:');
    pluginDoctor.issues.forEach(issue => console.log(`  ❌ ${issue}`));
  }

  process.exit(result.valid && pluginDoctor.valid ? 0 : 1);
}

function runStatus(dir) {
  ensureSessionRuntime(dir);
  ensurePluginRuntime(dir);
  console.log(`\n📊 Framework Status: ${dir}\n`);
  const s = getFrameworkStatus(dir);
  const runtime = getRuntimeSummary(dir);
  const diagnostics = getDiagnosticsSummary(dir);
  const plugins = listPluginManifests(dir);

  console.log(`  Version:          ${s.version}`);
  console.log(`  Health:           ${s.health}`);
  console.log(`  Agents:           ${s.agents.length} (${s.agents.join(', ')})`);
  console.log(`  Files in .ai/:    ${s.files.total}`);
  console.log(`  Protocols:        ${s.files.protocols}`);
  console.log(`  Templates:        ${s.files.templates}`);
  console.log(`  Scripts:          ${s.files.scripts}`);
  console.log(`  Stale artifacts:  ${s.staleArtifacts}`);
  console.log(`  Active session:   ${runtime.current_session_id || 'none'}`);
  console.log(`  Active plan:      ${runtime.current_plan_id || 'none'}`);
  console.log(`  Open approvals:   ${runtime.open_approvals}`);
  console.log(`  Diagnostics:      ${diagnostics.total}`);
  console.log(`  Plugins:          ${plugins.length} (${plugins.filter(p => p.enabled).length} enabled)`);
  console.log('');
}

function runUpdate(dir) {
  console.log(`\n🔄 Updating framework in: ${dir}\n`);

  const packageRoot = path.resolve(__dirname, '..');
  const updateTargets = ['.ai/protocols', '.ai/templates', '.ai/plugins', 'scripts'];
  let updated = 0;

  for (const target of updateTargets) {
    const src = path.join(packageRoot, target);
    const dest = path.join(dir, target);
    if (!fs.existsSync(src)) continue;

    const srcFiles = getFilesRecursive(src);
    for (const relPath of srcFiles) {
      const srcFile = path.join(src, relPath);
      const destFile = path.join(dest, relPath);

      if (!fs.existsSync(destFile)) {
        fs.mkdirSync(path.dirname(destFile), { recursive: true });
        fs.copyFileSync(srcFile, destFile);
        console.log(`  + ${path.join(target, relPath)} (new)`);
        updated++;
      } else {
        const srcStat = fs.statSync(srcFile);
        const destStat = fs.statSync(destFile);
        if (srcStat.mtimeMs > destStat.mtimeMs) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`  ↻ ${path.join(target, relPath)} (updated)`);
          updated++;
        }
      }
    }
  }

  if (updated === 0) {
    console.log('  ✅ All files are up to date\n');
  } else {
    console.log(`\n  Updated ${updated} file(s)\n`);
  }

  ensureSessionRuntime(dir);
  ensurePluginRuntime(dir);
  syncPluginMcpConfig(dir);
}

function getFilesRecursive(dir, prefix) {
  prefix = prefix || '';
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesRecursive(path.join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

function runInit(dir) {
  console.log(`🚀 Agentic SDLC Framework v${VERSION} — Scaffolding...\n`);

  const absoluteTarget = path.resolve(dir);

  if (!fs.existsSync(absoluteTarget)) {
    fs.mkdirSync(absoluteTarget, { recursive: true });
    console.log(`📁 Created target directory: ${absoluteTarget}\n`);
  }

  if (!fs.statSync(absoluteTarget).isDirectory()) {
    console.error(`❌ Error: "${dir}" is not a directory.`);
    process.exit(1);
  }

  console.log(`📂 Target: ${absoluteTarget}\n`);

  const { detectTechStack, generateProjectConfig, copyDirRecursive } = require('../lib/cli-utils');

  const stack = detectTechStack(absoluteTarget);
  console.log('🔍 Detected Tech Stack:');
  if (stack.length === 0) {
    console.log('   (none detected -- new project, using defaults)\n');
  } else {
    stack.forEach(s => console.log(`   - ${s.name} (${s.detail})`));
    console.log('');
  }

  const packageRoot = path.resolve(__dirname, '..');
  const filesToCopy = ['AGENTS.md', '.ai', 'rbac-factbook.yaml', '.mcp.json', 'scripts'];

  if (!fs.existsSync(path.join(absoluteTarget, '.github', 'workflows'))) {
    filesToCopy.push('.github');
  }

  console.log('Copying framework files...');

  filesToCopy.forEach(file => {
    const src = path.join(packageRoot, file);
    const dest = path.join(absoluteTarget, file);

    if (!fs.existsSync(src)) {
      console.log(`   Skipping ${file} (not in template)`);
      return;
    }

    try {
      if (fs.statSync(src).isDirectory()) {
        copyDirRecursive(src, dest);
        console.log(`   + ${file}/`);
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        console.log(`   + ${file}`);
      }
    } catch (error) {
      console.error(`   FAIL: ${file}: ${error.message}`);
    }
  });

  generateProjectConfig(absoluteTarget, stack);
  console.log('   + .ai/project-config.yaml (customized for detected stack)');

  generateDependencyAudit(absoluteTarget, stack);
  console.log('   + .github/workflows/dependency-audit.yml (customized for detected stack)');

  ensureSessionRuntime(absoluteTarget);
  console.log('   + .ai/session-state/ (structured runtime state)');

  ensurePluginRuntime(absoluteTarget);
  syncPluginMcpConfig(absoluteTarget);
  console.log('   + .ai/plugins/ registry synced');

  const hooksDir = path.join(absoluteTarget, 'scripts', 'hooks');
  if (fs.existsSync(hooksDir)) {
    try {
      fs.readdirSync(hooksDir).forEach(f => {
        if (f.endsWith('.sh')) {
          fs.chmodSync(path.join(hooksDir, f), 0o755);
        }
      });
    } catch (_) { /* chmod may not work on Windows */ }
  }

  console.log('\nFramework installed!\n');

  printNextSteps(stack);
}

function runPlan(argv) {
  const parsed = parseArgs(argv);
  const slug = parsed.positionals[0] || 'manual-plan';
  const dir = resolveDirectory(parsed.positionals[1] || parsed.flags.dir || '.');
  ensureSessionRuntime(dir);

  const sessionIndex = readIndex(dir);
  const session = sessionIndex.current_session_id
    ? getResumeSnapshot(dir).current_session
    : startSession(dir, {
        story: parsed.flags.story || slug,
        branch: getCurrentBranch(dir),
        actor: 'planner',
        summary: parsed.flags.summary || '',
      });

  const plan = upsertPlan(dir, {
    id: `${slug}-plan`,
    slug,
    title: parsed.flags.title || slug,
    story: parsed.flags.story || slug,
    classification: parsed.flags.classification || 'MEDIUM',
    summary: parsed.flags.summary || '',
    status: 'draft',
    session_id: session.id,
    actor: 'planner',
  });

  recordApproval(dir, {
    plan_id: plan.id,
    session_id: session.id,
    subject: `Plan review for ${plan.title}`,
    requested_by: 'planner',
    requested_from: 'human',
    rationale: 'Plan approval required before implementation',
  });

  writeMarkdownView(
    path.join(dir, '.ai', 'plans', `${slug}-plan.md`),
    renderPlanMarkdown(plan, session)
  );

  console.log(`\n📝 Plan ready: ${plan.id}`);
  console.log(`   Session: ${session.id}`);
  console.log(`   View:    .ai/plans/${slug}-plan.md\n`);
}

function runResume(argv) {
  const parsed = parseArgs(argv);
  const sessionId = parsed.positionals[0] && !looksLikeDirectory(parsed.positionals[0]) ? parsed.positionals[0] : undefined;
  const dirArg = sessionId ? parsed.positionals[1] : parsed.positionals[0];
  const dir = resolveDirectory(dirArg || parsed.flags.dir || '.');
  const snapshot = getResumeSnapshot(dir, sessionId);

  console.log(`\n🔄 Resume Snapshot: ${dir}\n`);
  console.log(`  Session:       ${snapshot.current_session?.id || 'none'}`);
  console.log(`  Story:         ${snapshot.current_session?.story || 'none'}`);
  console.log(`  Plan:          ${snapshot.current_plan?.id || 'none'}`);
  console.log(`  Trace:         ${snapshot.current_trace?.id || 'none'}`);
  console.log(`  Open approvals:${snapshot.open_approvals.length}`);
  console.log(`  Tasks:         ${snapshot.task_summary.total}`);
  Object.entries(snapshot.task_summary.by_status).forEach(([status, count]) => {
    console.log(`    - ${status}: ${count}`);
  });
  if (snapshot.recent_events.length > 0) {
    console.log('\n  Recent events:');
    snapshot.recent_events.forEach((event) => {
      console.log(`    - ${event.type} | ${event.message}`);
    });
  }
  console.log('');
}

function runTrace(argv) {
  const parsed = parseArgs(argv);
  const dir = resolveDirectory(parsed.positionals[0] || parsed.flags.dir || '.');
  ensureSessionRuntime(dir);

  const hasEvidence = parsed.flags.command || parsed.flags.stderr || parsed.flags.stdout ||
    parsed.flags['test-output'] || parsed.flags['ci-log'] || parsed.flags.url || parsed.flags.screenshot;

  const result = hasEvidence
    ? createEvidenceBundle(dir, {
        kind: parsed.flags.kind || 'debug',
        summary: parsed.flags.summary || 'Captured runtime evidence',
        command: parsed.flags.command,
        stderr: parsed.flags.stderr,
        stdout: parsed.flags.stdout,
        test_output: parsed.flags['test-output'],
        ci_log_excerpt: parsed.flags['ci-log'],
        url: parsed.flags.url,
        screenshot_path: parsed.flags.screenshot,
      })
    : { trace: createTrace(dir, { kind: parsed.flags.kind || 'execution', summary: parsed.flags.summary || 'Manual trace' }), diagnostics: [] };

  writeMarkdownView(
    path.join(dir, '.ai', 'traces', `${result.trace.id}.md`),
    renderTraceMarkdown(result)
  );

  console.log(`\n🧪 Trace captured: ${result.trace.id}`);
  console.log(`   Diagnostics: ${result.diagnostics.length}\n`);
}

function runEvents(argv) {
  const parsed = parseArgs(argv);
  const dir = resolveDirectory(parsed.positionals[0] || parsed.flags.dir || '.');
  const limit = Number(parsed.flags.limit || 20);
  const events = listEvents(dir, { limit });

  console.log(`\n📡 Runtime Events (${events.length})\n`);
  events.forEach((event) => {
    console.log(`- ${event.created_at} | ${event.type} | ${event.message}`);
  });
  console.log('');
}

function runPlugins(argv) {
  const parsed = parseArgs(argv);
  const action = parsed.positionals[0] || 'list';
  const pluginName = parsed.positionals[1];
  const dir = resolveDirectory(parsed.positionals[2] || parsed.flags.dir || '.');
  ensurePluginRuntime(dir);

  if (action === 'list') {
    const plugins = listPluginManifests(dir);
    console.log('\n🧩 Plugins\n');
    plugins.forEach((plugin) => {
      console.log(`- ${plugin.name} v${plugin.version} | ${plugin.enabled ? 'enabled' : 'disabled'} | ${(plugin.capabilities || []).join(', ')}`);
    });
    console.log('');
    return;
  }

  if (action === 'add') {
    const result = setPluginEnabled(dir, pluginName, true);
    syncPluginMcpConfig(dir);
    console.log(`\n✅ Enabled plugin ${result.plugin} (${result.version})\n`);
    return;
  }

  if (action === 'remove') {
    const result = setPluginEnabled(dir, pluginName, false);
    syncPluginMcpConfig(dir);
    console.log(`\n🛑 Disabled plugin ${result.plugin}\n`);
    return;
  }

  if (action === 'update') {
    syncPluginMcpConfig(dir);
    console.log('\n🔄 Plugin catalog synced to .mcp.json\n');
    return;
  }

  if (action === 'doctor') {
    const result = doctorPlugins(dir);
    console.log(`\n🩺 Plugin Doctor: ${result.valid ? 'healthy' : 'issues found'}\n`);
    result.plugins.forEach((plugin) => {
      console.log(`- ${plugin.name} v${plugin.version} | ${plugin.enabled ? 'enabled' : 'disabled'}`);
    });
    result.issues.forEach((issue) => console.log(`  ❌ ${issue}`));
    console.log('');
    process.exit(result.valid ? 0 : 1);
  }

  console.error(`Unknown plugins action: ${action}`);
  process.exit(1);
}


function generateDependencyAudit(dir, stack) {
  const stackIds = stack.map(s => s.id);

  let detectSteps = '';
  let auditSteps = '';

  if (stackIds.includes('node') || stackIds.length === 0) {
    detectSteps += '          [ -f package.json ] && echo "npm=true" >> $GITHUB_OUTPUT || true\n';
    auditSteps += `
      - name: Setup Node
        if: steps.detect.outputs.npm == 'true'
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: npm audit
        if: steps.detect.outputs.npm == 'true'
        run: |
          npm audit --json > audit-npm.json || true
          npm outdated --json > outdated-npm.json || true
`;
  }

  if (stackIds.includes('python')) {
    detectSteps += "          { [ -f pyproject.toml ] || [ -f requirements.txt ]; } && echo \"python=true\" >> $GITHUB_OUTPUT || true\n";
    auditSteps += `
      - name: Setup Python
        if: steps.detect.outputs.python == 'true'
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: pip-audit
        if: steps.detect.outputs.python == 'true'
        run: |
          pip install pip-audit
          pip-audit --format=json > audit-python.json || true
`;
  }

  if (stackIds.includes('ruby') || stackIds.includes('ios')) {
    detectSteps += '          [ -f Gemfile ] && echo "ruby=true" >> $GITHUB_OUTPUT || true\n';
    auditSteps += `
      - name: Setup Ruby
        if: steps.detect.outputs.ruby == 'true'
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'

      - name: bundler-audit
        if: steps.detect.outputs.ruby == 'true'
        run: |
          gem install bundler-audit
          bundle audit check --format=json > audit-ruby.json || true
`;
  }

  if (stackIds.includes('android') || stackIds.includes('jvm')) {
    detectSteps += '          { [ -f build.gradle ] || [ -f build.gradle.kts ]; } && echo "gradle=true" >> $GITHUB_OUTPUT || true\n';
    auditSteps += `
      - name: Setup Java
        if: steps.detect.outputs.gradle == 'true'
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Gradle dependency check
        if: steps.detect.outputs.gradle == 'true'
        run: |
          chmod +x gradlew 2>/dev/null || true
          ./gradlew dependencies --configuration releaseRuntimeClasspath > gradle-deps.txt 2>/dev/null || true
`;
  }

  if (stackIds.includes('ios')) {
    detectSteps += '          [ -f Podfile ] && echo "cocoapods=true" >> $GITHUB_OUTPUT || true\n';
  }

  if (stackIds.includes('go')) {
    detectSteps += '          [ -f go.mod ] && echo "go=true" >> $GITHUB_OUTPUT || true\n';
    auditSteps += `
      - name: Go vulnerability check
        if: steps.detect.outputs.go == 'true'
        run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./... > audit-go.json 2>&1 || true
`;
  }

  // Default fallback
  if (detectSteps === '') {
    detectSteps = '          [ -f package.json ] && echo "npm=true" >> $GITHUB_OUTPUT || true\n';
  }

  const workflow = `name: Dependency Audit

on:
  schedule:
    - cron: '0 6 * * 1'
  pull_request:
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Detect ecosystems
        id: detect
        run: |
${detectSteps}
${auditSteps}
      - name: Check severity
        id: severity
        run: |
          if [ -f .ai/dependency-status.json ]; then
            CRITICAL=\$(jq '[.vulnerabilities[] | select(.severity=="critical")] | length' .ai/dependency-status.json 2>/dev/null || echo 0)
            HIGH=\$(jq '[.vulnerabilities[] | select(.severity=="high")] | length' .ai/dependency-status.json 2>/dev/null || echo 0)
          else
            CRITICAL=0
            HIGH=0
          fi
          echo "critical=\$CRITICAL" >> \$GITHUB_OUTPUT
          echo "high=\$HIGH" >> \$GITHUB_OUTPUT

      - name: Fail on critical
        if: fromJSON(steps.severity.outputs.critical) > 0
        run: |
          echo "::error::\${{ steps.severity.outputs.critical }} critical vulnerabilities detected"
          exit 1
`;

  const workflowDir = path.join(dir, '.github', 'workflows');
  fs.mkdirSync(workflowDir, { recursive: true });
  fs.writeFileSync(path.join(workflowDir, 'dependency-audit.yml'), workflow);
}


// ============================================================
// PRINT NEXT STEPS BASED ON STACK
// ============================================================
function printNextSteps(stack) {
  const stackIds = stack.map(s => s.id);

  console.log('📚 Next Steps:\n');
  console.log('1. Configure RBAC:');
  console.log('   Edit rbac-factbook.yaml and add your team emails\n');

  console.log('2. Install git hooks:');
  if (stackIds.includes('android') || stackIds.includes('ios')) {
    console.log('   ln -sf ../../scripts/hooks/pre-commit.sh .git/hooks/pre-commit');
    console.log('   ln -sf ../../scripts/hooks/post-checkout.sh .git/hooks/post-checkout\n');
  } else {
    console.log('   ln -sf ../../scripts/hooks/pre-commit.sh .git/hooks/pre-commit\n');
  }

  console.log('3. Initialize the framework:');
  console.log('   Open in any AGENTS.md-compatible IDE and say: "init"\n');

  if (stackIds.includes('android')) {
    console.log('4. Multi-repo setup (Android + shared libraries):');
    console.log('   Say: "init --repos ../shared-mobile-sdk ../api-gateway ../design-service"\n');
  } else if (stackIds.includes('ios')) {
    console.log('4. Multi-repo setup (iOS + shared libraries):');
    console.log('   Say: "init --repos ../shared-mobile-sdk ../mobile-ios-app ../companion-ios-app"\n');
  } else {
    console.log('4. For multi-repo setup:');
    console.log('   Say: "init --repos ../repo1 ../repo2"\n');
  }

  console.log('5. Push to GitHub:');
  console.log('   git add AGENTS.md .ai/ rbac-factbook.yaml .mcp.json scripts/ .github/');
  console.log('   git commit -m "feat: adopt Agentic SDLC v1.0"');
  console.log('   git push\n');

  console.log('📖 Documentation: https://github.com/Jarvis2021/agentic-sdlc-development\n');
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current.startsWith('--')) {
      const key = current.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positionals.push(current);
    }
  }

  return { positionals, flags };
}

function resolveDirectory(dir) {
  return path.resolve(dir || '.');
}

function looksLikeDirectory(value) {
  if (!value) return false;
  return value.includes('/') || value === '.' || value === '..' || fs.existsSync(path.resolve(value));
}

function writeMarkdownView(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function renderPlanMarkdown(plan, session) {
  return `# ${plan.title}

## Plan Metadata
- Plan ID: \`${plan.id}\`
- Story: \`${plan.story}\`
- Classification: \`${plan.classification}\`
- Session: \`${session.id}\`
- Status: \`${plan.status}\`

## Summary
${plan.summary || 'No summary provided yet.'}

## Runtime Notes
- Structured runtime state is stored in \`.ai/session-state/\`
- Approval queue is tracked in \`.ai/session-state/approvals/\`
- Recent events can be inspected with \`agentic-sdlc events\`
`;
}

function renderTraceMarkdown(result) {
  return `# Trace ${result.trace.id}

## Trace
- Kind: \`${result.trace.kind}\`
- Status: \`${result.trace.status}\`
- Summary: ${result.trace.summary || 'No summary'}

## Diagnostics
${result.diagnostics.length === 0
  ? '- No diagnostics recorded.'
  : result.diagnostics.map((diagnostic) => `- \`${diagnostic.kind}\`: ${diagnostic.summary}`).join('\n')}
`;
}

function getCurrentBranch(dir) {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
  } catch (_) {
    return 'main';
  }
}

