import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../bin/cli.js');
const ROOT = path.resolve(__dirname, '..');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'platform-integration-'));
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

describe('CLI Integration', () => {
  it('--help shows usage', () => {
    const output = runCli('--help');
    expect(output).toContain('Agentic SDLC Framework');
    expect(output).toContain('Usage:');
    expect(output).toContain('plan <slug>');
    expect(output).toContain('plugins <action>');
    expect(output).toContain('--help');
    expect(output).toContain('--version');
  });

  it('--version shows version', () => {
    const output = runCli('--version');
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('exits with error for non-existent directory', () => {
    expect(() => runCli('/tmp/nonexistent-platform-dir-xyz')).toThrow();
  });
});

describe('CLI scaffolding', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  it('scaffolds AGENTS.md into target', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'AGENTS.md'))).toBe(true);
  });

  it('scaffolds .ai/ directory', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.ai'))).toBe(true);
    expect(fs.statSync(path.join(tmpDir, '.ai')).isDirectory()).toBe(true);
  });

  it('scaffolds rbac-factbook.yaml', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'rbac-factbook.yaml'))).toBe(true);
  });

  it('scaffolds .mcp.json', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.mcp.json'))).toBe(true);
  });

  it('scaffolds scripts/hooks/', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'scripts/hooks/pre-commit.sh'))).toBe(true);
  });

  it('generates project-config.yaml', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.ai/project-config.yaml'))).toBe(true);
  });

  it('generates dependency-audit.yml', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.github/workflows/dependency-audit.yml'))).toBe(true);
  });

  it('creates structured session runtime', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.ai/session-state/index.json'))).toBe(true);
  });

  it('creates plugin registry runtime', () => {
    runCli(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.ai/plugins/registry.json'))).toBe(true);
  });

  it('does not overwrite existing .github/workflows/', () => {
    fs.mkdirSync(path.join(tmpDir, '.github/workflows'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.github/workflows/existing.yml'), 'keep');
    runCli(tmpDir);
    expect(fs.readFileSync(path.join(tmpDir, '.github/workflows/existing.yml'), 'utf8')).toBe('keep');
  });

  it('prints success message', () => {
    const output = runCli(tmpDir);
    expect(output).toContain('Framework installed');
  });

  it('prints detected tech stack', () => {
    const output = runCli(tmpDir);
    expect(output).toContain('Detected Tech Stack');
  });

  it('prints next steps', () => {
    const output = runCli(tmpDir);
    expect(output).toContain('Next Steps');
  });

  it('creates a plan and markdown view', () => {
    runCli(tmpDir);
    const output = runCli(`plan test-plan "${tmpDir}" --title "Test Plan" --story PROJ-123 --summary "Create plan"`);
    expect(output).toContain('Plan ready');
    expect(fs.existsSync(path.join(tmpDir, '.ai/plans/test-plan-plan.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.ai/session-state/plans/test-plan-plan.json'))).toBe(true);
  });

  it('shows resume snapshot', () => {
    runCli(tmpDir);
    runCli(`plan resume-plan "${tmpDir}" --title "Resume Plan"`);
    const output = runCli(`resume "${tmpDir}"`);
    expect(output).toContain('Resume Snapshot');
    expect(output).toContain('Session:');
  });

  it('lists plugins', () => {
    runCli(tmpDir);
    const output = runCli(`plugins list "${tmpDir}"`);
    expect(output).toContain('Plugins');
    expect(output).toContain('debug-pack');
  });
});

describe('CLI with tech stack detection', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  it('detects and reports Node.js stack', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test-app' }));
    const output = runCli(tmpDir);
    expect(output).toContain('JavaScript');
    expect(output).toContain('Node.js');
  });

  it('detects and reports Python stack', () => {
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), 'flask==3.0');
    const output = runCli(tmpDir);
    expect(output).toContain('Python');
  });

  it('configures Node project-config with 90% coverage', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test-app' }));
    runCli(tmpDir);
    const config = fs.readFileSync(path.join(tmpDir, '.ai/project-config.yaml'), 'utf8');
    expect(config).toContain('coverage_threshold: 90');
  });

  it('configures Python project-config with 95% coverage', () => {
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), 'flask');
    runCli(tmpDir);
    const config = fs.readFileSync(path.join(tmpDir, '.ai/project-config.yaml'), 'utf8');
    expect(config).toContain('coverage_threshold: 95');
  });

  it('configures Android project-config with extras', () => {
    fs.writeFileSync(path.join(tmpDir, 'build.gradle.kts'), '');
    fs.mkdirSync(path.join(tmpDir, 'app/src/main'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'app/src/main/AndroidManifest.xml'), '');
    runCli(tmpDir);
    const config = fs.readFileSync(path.join(tmpDir, '.ai/project-config.yaml'), 'utf8');
    expect(config).toContain('min_sdk: 26');
    expect(config).toContain('backward_compatibility_months: 18');
  });
});

// ============================================================
// DETERMINISM & IDEMPOTENCY
// ============================================================

function getAllFiles(dir, base = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(full, base));
    } else {
      results.push({ relative: path.relative(base, full), content: fs.readFileSync(full, 'utf8') });
    }
  }
  return results.sort((a, b) => a.relative.localeCompare(b.relative));
}

describe('Deterministic scaffolding - same input, same output', () => {
  function normalizeForDirName(content) {
    return content.replace(/name: "platform-integration-[^"]+"/g, 'name: "<DIR>"');
  }

  it('two runs on identical empty dirs produce identical files (modulo dir name)', () => {
    const dir1 = createTempDir();
    const dir2 = createTempDir();
    try {
      runCli(dir1);
      runCli(dir2);
      const files1 = getAllFiles(dir1);
      const files2 = getAllFiles(dir2);
      expect(files1.map(f => f.relative)).toEqual(files2.map(f => f.relative));
      for (let i = 0; i < files1.length; i++) {
        expect(
          normalizeForDirName(files1[i].content),
          `Content mismatch in ${files1[i].relative}`
        ).toBe(normalizeForDirName(files2[i].content));
      }
    } finally {
      cleanupDir(dir1);
      cleanupDir(dir2);
    }
  });

  it('two runs on identical Node.js dirs produce identical files (modulo dir name)', () => {
    const dir1 = createTempDir();
    const dir2 = createTempDir();
    try {
      const pkg = JSON.stringify({ name: 'test-app', dependencies: { express: '4.21.0' } });
      fs.writeFileSync(path.join(dir1, 'package.json'), pkg);
      fs.writeFileSync(path.join(dir2, 'package.json'), pkg);
      runCli(dir1);
      runCli(dir2);
      const files1 = getAllFiles(dir1);
      const files2 = getAllFiles(dir2);
      expect(files1.map(f => f.relative)).toEqual(files2.map(f => f.relative));
      for (let i = 0; i < files1.length; i++) {
        expect(
          normalizeForDirName(files1[i].content),
          `Content mismatch in ${files1[i].relative}`
        ).toBe(normalizeForDirName(files2[i].content));
      }
    } finally {
      cleanupDir(dir1);
      cleanupDir(dir2);
    }
  });

  it('two runs on identical Python dirs produce identical files (modulo dir name)', () => {
    const dir1 = createTempDir();
    const dir2 = createTempDir();
    try {
      fs.writeFileSync(path.join(dir1, 'requirements.txt'), 'flask==3.0.0\nrequests==2.32.0');
      fs.writeFileSync(path.join(dir2, 'requirements.txt'), 'flask==3.0.0\nrequests==2.32.0');
      runCli(dir1);
      runCli(dir2);
      const files1 = getAllFiles(dir1);
      const files2 = getAllFiles(dir2);
      expect(files1.map(f => f.relative)).toEqual(files2.map(f => f.relative));
      for (let i = 0; i < files1.length; i++) {
        expect(
          normalizeForDirName(files1[i].content),
          `Content mismatch in ${files1[i].relative}`
        ).toBe(normalizeForDirName(files2[i].content));
      }
    } finally {
      cleanupDir(dir1);
      cleanupDir(dir2);
    }
  });

  it('two runs on identical Android dirs produce identical files (modulo dir name)', () => {
    const dir1 = createTempDir();
    const dir2 = createTempDir();
    try {
      for (const d of [dir1, dir2]) {
        fs.writeFileSync(path.join(d, 'build.gradle.kts'), '');
        fs.mkdirSync(path.join(d, 'app/src/main'), { recursive: true });
        fs.writeFileSync(path.join(d, 'app/src/main/AndroidManifest.xml'), '');
      }
      runCli(dir1);
      runCli(dir2);
      const files1 = getAllFiles(dir1);
      const files2 = getAllFiles(dir2);
      expect(files1.map(f => f.relative)).toEqual(files2.map(f => f.relative));
      for (let i = 0; i < files1.length; i++) {
        expect(
          normalizeForDirName(files1[i].content),
          `Content mismatch in ${files1[i].relative}`
        ).toBe(normalizeForDirName(files2[i].content));
      }
    } finally {
      cleanupDir(dir1);
      cleanupDir(dir2);
    }
  });
});

describe('Idempotent scaffolding - re-run produces same result', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  it('running CLI twice on same directory produces identical output', () => {
    runCli(tmpDir);
    const firstRun = getAllFiles(tmpDir);
    runCli(tmpDir);
    const secondRun = getAllFiles(tmpDir);
    expect(firstRun.map(f => f.relative)).toEqual(secondRun.map(f => f.relative));
    for (let i = 0; i < firstRun.length; i++) {
      expect(firstRun[i].content, `Drift detected in ${firstRun[i].relative}`).toBe(secondRun[i].content);
    }
  });

  it('re-run on Node.js project does not mutate existing files', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-app' }));
    runCli(tmpDir);
    const agentsBefore = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');
    const configBefore = fs.readFileSync(path.join(tmpDir, '.ai/project-config.yaml'), 'utf8');
    runCli(tmpDir);
    expect(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8')).toBe(agentsBefore);
    expect(fs.readFileSync(path.join(tmpDir, '.ai/project-config.yaml'), 'utf8')).toBe(configBefore);
  });
});

describe('Content parity - scaffolded files match source templates', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  it('scaffolded AGENTS.md is byte-identical to source', () => {
    runCli(tmpDir);
    const source = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
    const scaffolded = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');
    expect(scaffolded).toBe(source);
  });

  it('scaffolded rbac-factbook.yaml is byte-identical to source', () => {
    runCli(tmpDir);
    const source = fs.readFileSync(path.join(ROOT, 'rbac-factbook.yaml'), 'utf8');
    const scaffolded = fs.readFileSync(path.join(tmpDir, 'rbac-factbook.yaml'), 'utf8');
    expect(scaffolded).toBe(source);
  });

  it('scaffolded .mcp.json is byte-identical to source', () => {
    runCli(tmpDir);
    const source = fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8');
    const scaffolded = fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf8');
    expect(scaffolded).toBe(source);
  });

  it('scaffolded pre-commit.sh is byte-identical to source', () => {
    runCli(tmpDir);
    const source = fs.readFileSync(path.join(ROOT, 'scripts/hooks/pre-commit.sh'), 'utf8');
    const scaffolded = fs.readFileSync(path.join(tmpDir, 'scripts/hooks/pre-commit.sh'), 'utf8');
    expect(scaffolded).toBe(source);
  });

  it('every scaffolded protocol file matches source', () => {
    runCli(tmpDir);
    const sourceDir = path.join(ROOT, '.ai/protocols');
    const targetDir = path.join(tmpDir, '.ai/protocols');
    const sourceFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md')).sort();
    const targetFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.md')).sort();
    expect(targetFiles).toEqual(sourceFiles);
    for (const file of sourceFiles) {
      const src = fs.readFileSync(path.join(sourceDir, file), 'utf8');
      const tgt = fs.readFileSync(path.join(targetDir, file), 'utf8');
      expect(tgt, `Protocol ${file} diverged from source`).toBe(src);
    }
  });

  it('every scaffolded SKILL.md file matches source', () => {
    runCli(tmpDir);
    const srcSkills = getAllFiles(path.join(ROOT, '.ai/skills')).filter(f => f.relative.endsWith('SKILL.md'));
    const tgtSkills = getAllFiles(path.join(tmpDir, '.ai/skills')).filter(f => f.relative.endsWith('SKILL.md'));
    expect(tgtSkills.map(f => f.relative)).toEqual(srcSkills.map(f => f.relative));
    for (let i = 0; i < srcSkills.length; i++) {
      expect(tgtSkills[i].content, `SKILL ${srcSkills[i].relative} diverged`).toBe(srcSkills[i].content);
    }
  });
});

describe('Model-agnostic - no AI model or IDE references in scaffolded output', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  it('scaffolded files contain no IDE-specific references', () => {
    runCli(tmpDir);
    const allFiles = getAllFiles(tmpDir);
    const ideTerms = ['copilot-instructions', 'windsurf', 'claude code', 'kiro'];
    const excludePatterns = ['.github/workflows/ci.yml', 'platform-guides/', 'post-task-cleanup.sh', 'skills/'];
    for (const file of allFiles) {
      if (excludePatterns.some(p => file.relative.includes(p))) continue;
      for (const term of ideTerms) {
        expect(
          file.content.toLowerCase().includes(term),
          `${file.relative} contains IDE reference "${term}"`
        ).toBe(false);
      }
    }
  });

  it('CI checker grep pattern is the only "cursor" reference in workflows', () => {
    runCli(tmpDir);
    const ciPath = path.join(tmpDir, '.github/workflows/ci.yml');
    if (fs.existsSync(ciPath)) {
      const content = fs.readFileSync(ciPath, 'utf8');
      const lines = content.split('\n');
      const cursorLines = lines.filter(l => l.toLowerCase().includes('cursor'));
      for (const line of cursorLines) {
        expect(line, 'Non-grep "cursor" reference in ci.yml').toMatch(/grep/i);
      }
    }
  });

  it('scaffolded files contain no specific AI model references', () => {
    runCli(tmpDir);
    const allFiles = getAllFiles(tmpDir);
    const modelTerms = ['gpt-4', 'gpt-5', 'claude-3', 'claude-4', 'sonnet', 'opus', 'gemini-2'];
    const excludePatterns = ['config.yaml', 'platform-guides/'];
    for (const file of allFiles) {
      if (excludePatterns.some(p => file.relative.includes(p))) continue;
      for (const term of modelTerms) {
        expect(
          file.content.toLowerCase().includes(term),
          `${file.relative} contains model reference "${term}"`
        ).toBe(false);
      }
    }
  });
});

describe('No comparison references in shipped files', () => {
  it('AGENTS.md has no competitive references', () => {
    const content = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
    expect(content.toLowerCase()).not.toContain('enterprise-sdlc-copilot');
    expect(content.toLowerCase()).not.toContain('copilot-instructions');
    expect(content.toLowerCase()).not.toContain('cursor');
  });

  it('README.md has no competitive references', () => {
    const content = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    expect(content.toLowerCase()).not.toContain('enterprise-sdlc-copilot');
    expect(content.toLowerCase()).not.toContain('platform-specific approach');
  });

  it('shipped protocol files have no competitive references', () => {
    const protocolDir = path.join(ROOT, '.ai/protocols');
    const files = fs.readdirSync(protocolDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(protocolDir, file), 'utf8');
      expect(content.toLowerCase(), `${file} contains competitive reference`).not.toContain('enterprise-sdlc-copilot');
    }
  });
});
