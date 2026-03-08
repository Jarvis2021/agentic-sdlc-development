import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Framework Determinism', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('Protocol files are model-agnostic', () => {
    const protocolDir = path.join(rootDir, '.ai', 'protocols');

    it('no protocol references specific model names in rules', () => {
      const modelNames = ['gpt-4', 'gpt-3.5', 'claude-3', 'claude-2', 'gemini', 'llama', 'mistral'];
      const protocols = fs.readdirSync(protocolDir).filter(f => f.endsWith('.md'));

      for (const proto of protocols) {
        const content = fs.readFileSync(path.join(protocolDir, proto), 'utf8').toLowerCase();
        for (const model of modelNames) {
          expect(content).not.toContain(model);
        }
      }
    });

    it('all protocols have structured content with subsections', () => {
      const protocols = fs.readdirSync(protocolDir)
        .filter(f => f.endsWith('.md') && !f.includes('summary') && !f.includes('constitution'));

      for (const proto of protocols) {
        const content = fs.readFileSync(path.join(protocolDir, proto), 'utf8');
        const subsections = (content.match(/^## /gm) || []).length;
        expect(subsections, `${proto} has fewer than 3 subsections`).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Context index is model-agnostic', () => {
    const indexPath = path.join(rootDir, '.ai', 'context-index.yaml');

    it('context-index.yaml exists', () => {
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('classification rules use fixed token budgets', () => {
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toContain('token_budget: 5000');
      expect(content).toContain('token_budget: 20000');
      expect(content).toContain('token_budget: 80000');
      expect(content).toContain('token_budget: 200000');
    });

    it('agent roster uses role names not model names', () => {
      const content = fs.readFileSync(indexPath, 'utf8').toLowerCase();
      const modelNames = ['gpt-4', 'gpt-3.5', 'claude-3', 'claude-2', 'gemini-pro'];
      for (const model of modelNames) {
        expect(content).not.toContain(model);
      }
    });
  });

  describe('Templates produce identical structure', () => {
    const templateDir = path.join(rootDir, '.ai', 'templates');

    it('all templates exist', () => {
      const expected = ['spec-template.md', 'plan-template.md', 'task-template.md', 'trace-template.md'];
      for (const tmpl of expected) {
        expect(fs.existsSync(path.join(templateDir, tmpl)), `missing ${tmpl}`).toBe(true);
      }
    });

    it('templates use placeholder syntax not hardcoded values', () => {
      const templates = fs.readdirSync(templateDir).filter(f => f.endsWith('.md'));
      for (const tmpl of templates) {
        const content = fs.readFileSync(path.join(templateDir, tmpl), 'utf8');
        expect(content).toContain('{{');
        expect(content).toContain('}}');
      }
    });
  });

  describe('Quality gates are deterministic', () => {
    it('preflight script exists and is executable', () => {
      const preflightPath = path.join(rootDir, 'scripts', 'preflight.sh');
      expect(fs.existsSync(preflightPath)).toBe(true);
      const stat = fs.statSync(preflightPath);
      expect(stat.mode & 0o111).toBeGreaterThan(0);
    });

    it('exit criteria script exists', () => {
      expect(fs.existsSync(path.join(rootDir, 'scripts', 'verify-exit-criteria.sh'))).toBe(true);
    });
  });

  describe('Config separates structure from model preference', () => {
    const configPath = path.join(rootDir, '.ai', 'config.yaml');

    it('config.yaml exists', () => {
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('model preferences are in a separate section from token budgets', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      expect(content).toContain('token_budgets:');
      expect(content).toContain('model_preferences:');
    });
  });
});
