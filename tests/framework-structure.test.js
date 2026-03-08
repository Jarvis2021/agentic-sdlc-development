import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Framework Structure', () => {
  describe('Required root files', () => {
    const requiredFiles = [
      'AGENTS.md',
      'package.json',
      'rbac-factbook.yaml',
      '.mcp.json',
      '.gitignore',
      'bin/cli.js',
      'README.md',
      'CONTRIBUTING.md',
      'factbook.yaml',
    ];

    requiredFiles.forEach(file => {
      it(`${file} exists`, () => {
        expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
      });
    });
  });

  describe('Required .ai/ directories', () => {
    const requiredDirs = [
      '.ai',
      '.ai/protocols',
      '.ai/plugins',
      '.ai/skills',
      '.ai/agent-exchange',
      '.ai/history',
      '.ai/decisions',
      '.ai/benchmarks',
      '.ai/releases',
    ];

    requiredDirs.forEach(dir => {
      it(`${dir}/ exists`, () => {
        const dirPath = path.join(ROOT, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
        expect(fs.statSync(dirPath).isDirectory()).toBe(true);
      });
    });
  });

  describe('Required .ai/ files', () => {
    const requiredAiFiles = [
      '.ai/NOW.md',
      '.ai/session-ledger.md',
      '.ai/domain-governance.yaml',
      '.ai/project-config.yaml',
      '.ai/role-based-prompt-templates.md',
      '.ai/plugins/core/plugin.yaml',
      '.ai/plugins/debug-pack/plugin.yaml',
    ];

    requiredAiFiles.forEach(file => {
      it(`${file} exists`, () => {
        expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
      });
    });
  });

  describe('Protocol files', () => {
    it('has at least 20 protocol files', () => {
      const protocolDir = path.join(ROOT, '.ai/protocols');
      const protocols = fs.readdirSync(protocolDir).filter(f => f.endsWith('.md'));
      expect(protocols.length).toBeGreaterThanOrEqual(20);
    });

    const coreProtocols = [
      'planner.md',
      'implementer.md',
      'reviewer.md',
      'self-healer.md',
      'quality-gates.md',
      'release-gate.md',
      'security-scanner.md',
      'dependency-auditor.md',
      'rbac.md',
      'compliance.md',
      'knowledge-graph.md',
      'agent-orchestration.md',
    ];

    coreProtocols.forEach(protocol => {
      it(`protocol ${protocol} exists`, () => {
        expect(fs.existsSync(path.join(ROOT, '.ai/protocols', protocol))).toBe(true);
      });
    });
  });

  describe('Skill files', () => {
    it('has SKILL.md files in each skill directory', () => {
      const skillsRoot = path.join(ROOT, '.ai/skills');
      const categories = fs.readdirSync(skillsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      expect(categories.length).toBeGreaterThan(0);

      let skillCount = 0;
      for (const cat of categories) {
        const catDir = path.join(skillsRoot, cat);
        const skills = fs.readdirSync(catDir, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => d.name);

        for (const skill of skills) {
          const skillFile = path.join(catDir, skill, 'SKILL.md');
          expect(fs.existsSync(skillFile), `Missing SKILL.md in ${cat}/${skill}`).toBe(true);
          skillCount++;
        }
      }
      expect(skillCount).toBeGreaterThanOrEqual(8);
    });
  });

  describe('GitHub workflows', () => {
    const requiredWorkflows = [
      '.github/workflows/ci.yml',
      '.github/workflows/dependency-audit.yml',
      '.github/workflows/security-scan.yml',
    ];

    requiredWorkflows.forEach(workflow => {
      it(`${workflow} exists`, () => {
        expect(fs.existsSync(path.join(ROOT, workflow))).toBe(true);
      });
    });
  });

  describe('Git hooks', () => {
    const requiredHooks = [
      'scripts/hooks/pre-commit.sh',
      'scripts/hooks/post-checkout.sh',
      'scripts/hooks/session-tracker.sh',
      'scripts/hooks/context-monitor.sh',
      'scripts/hooks/emergency-checkpoint.sh',
    ];

    requiredHooks.forEach(hook => {
      it(`${hook} exists`, () => {
        expect(fs.existsSync(path.join(ROOT, hook))).toBe(true);
      });
    });

    it('hook files start with shebang', () => {
      const hooksDir = path.join(ROOT, 'scripts/hooks');
      const hooks = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
      hooks.forEach(hook => {
        const content = fs.readFileSync(path.join(hooksDir, hook), 'utf8');
        expect(content.startsWith('#!/bin/bash'), `${hook} missing shebang`).toBe(true);
      });
    });
  });

  describe('AGENTS.md content validation', () => {
    const agentsMd = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');

    it('contains agent roster', () => {
      expect(agentsMd).toContain('Planner');
      expect(agentsMd).toContain('Implementer');
      expect(agentsMd).toContain('Reviewer');
      expect(agentsMd).toContain('Self-Healer');
      expect(agentsMd).toContain('Quality-Gate');
    });

    it('references .ai/protocols/ for lazy loading', () => {
      expect(agentsMd).toContain('.ai/protocols/');
    });

    it('contains RBAC reference', () => {
      expect(agentsMd).toContain('rbac');
    });

    it('does not contain competitive comparisons', () => {
      expect(agentsMd).not.toMatch(/enterprise-sdlc-copilot/i);
      expect(agentsMd).not.toMatch(/platform-specific approach/i);
    });

    it('is IDE-agnostic - no product-specific instructions', () => {
      expect(agentsMd).not.toMatch(/cursor/i);
      expect(agentsMd).not.toMatch(/copilot-instructions/i);
    });
  });

  describe('README.md content validation', () => {
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

    it('has Quick Start section', () => {
      expect(readme).toMatch(/Quick Start/i);
    });

    it('does not contain competitive comparisons', () => {
      expect(readme).not.toMatch(/enterprise-sdlc-copilot/i);
      expect(readme).not.toMatch(/platform-specific approach/i);
    });

    it('references v1.0', () => {
      expect(readme).toContain('v1.0');
    });
  });

  describe('Knowledge Graph data', () => {
    const kgPath = path.join(ROOT, 'docs/knowledge-graph/knowledge-graph.json');

    it('knowledge-graph.json exists and is valid JSON', () => {
      expect(fs.existsSync(kgPath)).toBe(true);
      const content = fs.readFileSync(kgPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('has required structure', () => {
      const kg = JSON.parse(fs.readFileSync(kgPath, 'utf8'));
      expect(kg).toHaveProperty('meta');
      expect(kg).toHaveProperty('nodes');
      expect(kg).toHaveProperty('edges');
      expect(kg).toHaveProperty('groups');
    });

    it('has at least 18 repo nodes', () => {
      const kg = JSON.parse(fs.readFileSync(kgPath, 'utf8'));
      expect(kg.nodes.length).toBeGreaterThanOrEqual(18);
    });
  });
});
