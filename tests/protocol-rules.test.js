import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Protocol Structure Validation', () => {
  const protocolDir = path.resolve(__dirname, '..', '.ai', 'protocols');
  const protocols = fs.readdirSync(protocolDir)
    .filter(f => f.endsWith('.md') && !f.includes('summary'));

  describe('All protocols have required sections', () => {
    for (const proto of protocols) {
      describe(proto, () => {
        const content = fs.readFileSync(path.join(protocolDir, proto), 'utf8');

        it('has a title (# heading)', () => {
          expect(content).toMatch(/^# .+/m);
        });

        it('has a Rules section or equivalent structural enforcement', () => {
          const structuralExceptions = ['constitution.md', 'contract-guard.md', 'prd-to-stories.md', 'quality-gates.md', 'reviewer.md'];
          if (structuralExceptions.includes(proto)) return;
          expect(content).toMatch(/## Rules|## Golden Rules|## Non-Negotiable/i);
        });
      });
    }
  });

  describe('Self-healer has enforcement rules', () => {
    const content = fs.readFileSync(path.join(protocolDir, 'self-healer.md'), 'utf8');

    it('has circuit breaker rule', () => {
      expect(content).toContain('failure_count');
    });

    it('has preflight requirement', () => {
      expect(content).toContain('preflight');
    });

    it('has max 3 attempts', () => {
      expect(content).toMatch(/max 3|failure_count >= 3/i);
    });

    it('has post-push observation', () => {
      expect(content).toContain('120 seconds');
    });

    it('has autofix-first rule', () => {
      expect(content).toContain('ruff check --fix');
    });
  });

  describe('Implementer has required gates', () => {
    const content = fs.readFileSync(path.join(protocolDir, 'implementer.md'), 'utf8');

    it('has boot sequence', () => {
      expect(content).toMatch(/boot sequence/i);
    });

    it('has impact analysis', () => {
      expect(content).toMatch(/impact analysis/i);
    });

    it('has pre-commit gate', () => {
      expect(content).toMatch(/pre-commit|preflight/i);
    });
  });

  describe('Reviewer has council process', () => {
    const content = fs.readFileSync(path.join(protocolDir, 'reviewer.md'), 'utf8');

    it('has correctness reviewer', () => {
      expect(content).toMatch(/correctness/i);
    });

    it('has standards reviewer', () => {
      expect(content).toMatch(/standards/i);
    });

    it('has security reviewer', () => {
      expect(content).toMatch(/security/i);
    });
  });

  describe('Quality gates has verification commands', () => {
    const content = fs.readFileSync(path.join(protocolDir, 'quality-gates.md'), 'utf8');

    it('has phase transitions', () => {
      expect(content).toMatch(/phase transition/i);
    });

    it('mentions preflight', () => {
      expect(content).toContain('preflight');
    });
  });

  describe('Enforcement prompt has all 8 rules', () => {
    const enforcementPath = path.resolve(__dirname, '..', '.ai', 'enforcement-prompt.md');
    if (fs.existsSync(enforcementPath)) {
      const content = fs.readFileSync(enforcementPath, 'utf8');

      it('has Rule 1: CI Parity', () => {
        expect(content).toMatch(/RULE 1/);
      });

      it('has Rule 2: Never manually edit', () => {
        expect(content).toMatch(/RULE 2/);
      });

      it('has Rule 3: Post-push', () => {
        expect(content).toMatch(/RULE 3/);
      });

      it('has all 8 rules', () => {
        expect(content).toMatch(/RULE 8/);
      });
    }
  });
});
