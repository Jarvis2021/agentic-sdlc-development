import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const {
  validateAgentFiles,
  validateProtocolContent,
  getFrameworkStatus,
  countFiles,
} = require('../lib/agent-validator');

describe('Agent Validator', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('validateAgentFiles', () => {
    it('returns error when context-index.yaml is missing', () => {
      const result = validateAgentFiles(tmpDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing .ai/context-index.yaml');
    });

    it('returns error when no agents found in index', () => {
      const aiDir = path.join(tmpDir, '.ai');
      fs.mkdirSync(aiDir, { recursive: true });
      fs.writeFileSync(path.join(aiDir, 'context-index.yaml'), 'version: "2.0"\n');
      fs.mkdirSync(path.join(aiDir, 'protocols'), { recursive: true });
      const result = validateAgentFiles(tmpDir);
      expect(result.errors).toContain('No agents found in context-index.yaml');
    });

    it('returns error when protocols directory is missing', () => {
      const aiDir = path.join(tmpDir, '.ai');
      fs.mkdirSync(aiDir, { recursive: true });
      fs.writeFileSync(
        path.join(aiDir, 'context-index.yaml'),
        'agents:\n  implementer:\n    role: "Execute"\n'
      );
      const result = validateAgentFiles(tmpDir);
      expect(result.errors).toContain('Missing .ai/protocols/ directory');
    });

    it('returns error when referenced protocol file is missing', () => {
      const aiDir = path.join(tmpDir, '.ai');
      fs.mkdirSync(path.join(aiDir, 'protocols'), { recursive: true });
      fs.writeFileSync(
        path.join(aiDir, 'context-index.yaml'),
        'agents:\n  implementer:\n    role: "Execute"\n    protocol: ".ai/protocols/implementer.md"\n'
      );
      const result = validateAgentFiles(tmpDir);
      expect(result.errors.some(e => e.includes('implementer.md'))).toBe(true);
    });

    it('validates successfully when all files present', () => {
      const aiDir = path.join(tmpDir, '.ai');
      fs.mkdirSync(path.join(aiDir, 'protocols'), { recursive: true });
      fs.writeFileSync(
        path.join(aiDir, 'context-index.yaml'),
        'agents:\n  implementer:\n    role: "Execute"\n    protocol: ".ai/protocols/implementer.md"\n'
      );
      fs.writeFileSync(
        path.join(aiDir, 'protocols', 'implementer.md'),
        '# Implementer\n\n## Rules\nDo stuff\n\n## Output\nFiles\n'
      );
      fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Agents\nShort');
      const result = validateAgentFiles(tmpDir);
      expect(result.valid).toBe(true);
    });

    it('warns when AGENTS.md is too long', () => {
      const aiDir = path.join(tmpDir, '.ai');
      fs.mkdirSync(path.join(aiDir, 'protocols'), { recursive: true });
      fs.writeFileSync(
        path.join(aiDir, 'context-index.yaml'),
        'agents:\n  implementer:\n    role: "Execute"\n'
      );
      const longContent = Array(2000).fill('word').join(' ');
      fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), longContent);
      const result = validateAgentFiles(tmpDir);
      expect(result.warnings.some(w => w.includes('AGENTS.md'))).toBe(true);
    });

    it('returns error when AGENTS.md is missing', () => {
      const aiDir = path.join(tmpDir, '.ai');
      fs.mkdirSync(path.join(aiDir, 'protocols'), { recursive: true });
      fs.writeFileSync(
        path.join(aiDir, 'context-index.yaml'),
        'agents:\n  implementer:\n    role: "Execute"\n'
      );
      const result = validateAgentFiles(tmpDir);
      expect(result.errors).toContain('Missing AGENTS.md');
    });
  });

  describe('validateProtocolContent', () => {
    it('warns when Rules section is missing', () => {
      const errors = [];
      const warnings = [];
      validateProtocolContent('test', '# Test\n\n## Output\nStuff', errors, warnings);
      expect(warnings.some(w => w.includes('Rules'))).toBe(true);
    });

    it('warns when Output section is missing', () => {
      const errors = [];
      const warnings = [];
      validateProtocolContent('test', '# Test\n\n## Rules\nStuff', errors, warnings);
      expect(warnings.some(w => w.includes('Output'))).toBe(true);
    });

    it('passes when both sections present', () => {
      const errors = [];
      const warnings = [];
      validateProtocolContent('test', '# Test\n\n## Rules\nStuff\n\n## Output\nMore', errors, warnings);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('getFrameworkStatus', () => {
    it('returns unknown version when no package.json', () => {
      const status = getFrameworkStatus(tmpDir);
      expect(status.version).toBe('unknown');
    });

    it('reads version from package.json', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ version: '3.0.0' }));
      const status = getFrameworkStatus(tmpDir);
      expect(status.version).toBe('3.0.0');
    });

    it('counts protocol files', () => {
      const protoDir = path.join(tmpDir, '.ai', 'protocols');
      fs.mkdirSync(protoDir, { recursive: true });
      fs.writeFileSync(path.join(protoDir, 'a.md'), 'test');
      fs.writeFileSync(path.join(protoDir, 'b.md'), 'test');
      fs.writeFileSync(path.join(tmpDir, '.ai', 'context-index.yaml'), 'agents:\n  x:\n    role: "test"\n');
      fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), 'short');
      const status = getFrameworkStatus(tmpDir);
      expect(status.files.protocols).toBe(2);
    });

    it('counts template files', () => {
      const tmplDir = path.join(tmpDir, '.ai', 'templates');
      fs.mkdirSync(tmplDir, { recursive: true });
      fs.writeFileSync(path.join(tmplDir, 'spec-template.md'), 'test');
      fs.writeFileSync(path.join(tmpDir, '.ai', 'context-index.yaml'), 'agents:\n  x:\n    role: "test"\n');
      const protoDir = path.join(tmpDir, '.ai', 'protocols');
      fs.mkdirSync(protoDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), 'short');
      const status = getFrameworkStatus(tmpDir);
      expect(status.files.templates).toBe(1);
    });

    it('detects stale agent-exchange artifacts', () => {
      const exchDir = path.join(tmpDir, '.ai', 'agent-exchange');
      fs.mkdirSync(exchDir, { recursive: true });
      const filePath = path.join(exchDir, 'old.md');
      fs.writeFileSync(filePath, 'stale');
      const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
      fs.utimesSync(filePath, new Date(eightDaysAgo), new Date(eightDaysAgo));
      fs.writeFileSync(path.join(tmpDir, '.ai', 'context-index.yaml'), 'agents:\n  x:\n    role: "test"\n');
      const protoDir = path.join(tmpDir, '.ai', 'protocols');
      fs.mkdirSync(protoDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), 'short');
      const status = getFrameworkStatus(tmpDir);
      expect(status.staleArtifacts).toBe(1);
    });

    it('reports health as errors when critical issues', () => {
      const status = getFrameworkStatus(tmpDir);
      expect(status.health).toBe('errors');
    });

    it('reports health as healthy when all valid', () => {
      const aiDir = path.join(tmpDir, '.ai');
      fs.mkdirSync(path.join(aiDir, 'protocols'), { recursive: true });
      fs.writeFileSync(
        path.join(aiDir, 'context-index.yaml'),
        'agents:\n  implementer:\n    role: "Execute"\n    protocol: ".ai/protocols/implementer.md"\n'
      );
      fs.writeFileSync(
        path.join(aiDir, 'protocols', 'implementer.md'),
        '# Implementer\n\n## Rules\nDo stuff\n\n## Output\nFiles\n'
      );
      fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Agents\nShort');
      const status = getFrameworkStatus(tmpDir);
      expect(status.health).toBe('healthy');
    });
  });

  describe('countFiles', () => {
    it('returns 0 for non-existent directory', () => {
      expect(countFiles('/nonexistent-path-12345')).toBe(0);
    });

    it('counts files recursively', () => {
      const sub = path.join(tmpDir, 'sub');
      fs.mkdirSync(sub, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'x');
      fs.writeFileSync(path.join(sub, 'b.txt'), 'y');
      expect(countFiles(tmpDir)).toBe(2);
    });

    it('returns 0 for empty directory', () => {
      const empty = path.join(tmpDir, 'empty');
      fs.mkdirSync(empty);
      expect(countFiles(empty)).toBe(0);
    });
  });
});
