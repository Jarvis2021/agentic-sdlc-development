import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('RBAC Configuration', () => {
  const rbacContent = fs.readFileSync(path.join(ROOT, 'rbac-factbook.yaml'), 'utf8');

  it('rbac-factbook.yaml is valid YAML structure', () => {
    expect(rbacContent).toContain('apiVersion: v1');
    expect(rbacContent).toContain('kind: TeamRegistry');
    expect(rbacContent).toContain('spec:');
    expect(rbacContent).toContain('roles:');
  });

  it('defines all four standard roles', () => {
    expect(rbacContent).toContain('architect:');
    expect(rbacContent).toContain('dev_lead:');
    expect(rbacContent).toContain('dev_engineer:');
    expect(rbacContent).toContain('test_engineer:');
  });

  it('architect has wildcard access', () => {
    expect(rbacContent).toMatch(/architect:[\s\S]*?agents:\s*\["\*"\]/);
    expect(rbacContent).toMatch(/architect:[\s\S]*?can_modify:\s*\["\*"\]/);
  });

  it('architect can freeze', () => {
    expect(rbacContent).toMatch(/architect:[\s\S]*?can_freeze:\s*true/);
  });

  it('non-architects cannot freeze', () => {
    const lines = rbacContent.split('\n');
    let currentRole = '';
    for (const line of lines) {
      const roleMatch = line.match(/^\s{4}(\w+):$/);
      if (roleMatch) currentRole = roleMatch[1];
      if (currentRole && currentRole !== 'architect' && line.includes('can_freeze')) {
        expect(line.trim()).toBe('can_freeze: false');
      }
    }
  });
});

describe('RBAC Pre-commit Hook Logic', () => {
  const hookContent = fs.readFileSync(path.join(ROOT, 'scripts/hooks/pre-commit.sh'), 'utf8');

  it('starts with shebang', () => {
    expect(hookContent).toMatch(/^#!/);
  });

  it('uses set -e for fail-fast', () => {
    expect(hookContent).toContain('set -e');
  });

  it('extracts git user email', () => {
    expect(hookContent).toContain('git config user.email');
  });

  it('handles missing email gracefully', () => {
    expect(hookContent).toContain('if [ -z "$USER_EMAIL" ]');
    expect(hookContent).toContain('exit 1');
  });

  it('handles missing rbac-factbook.yaml gracefully', () => {
    expect(hookContent).toContain('if [ ! -f "rbac-factbook.yaml" ]');
    expect(hookContent).toContain('exit 0');
  });

  it('protects framework core files from non-architects', () => {
    expect(hookContent).toContain('AGENTS\\.md');
    expect(hookContent).toContain('\\.ai/protocols/');
    expect(hookContent).toContain('rbac-factbook\\.yaml');
  });

  it('implements role-based file access control', () => {
    expect(hookContent).toContain('architect)');
    expect(hookContent).toContain('dev_lead)');
    expect(hookContent).toContain('dev_engineer)');
    expect(hookContent).toContain('test_engineer)');
  });

  it('dev_lead cannot modify ADRs', () => {
    expect(hookContent).toContain('.ai/decisions/');
    expect(hookContent).toContain('Dev Lead role cannot modify ADRs');
  });

  it('dev_engineer cannot modify .ai/ or docs/', () => {
    expect(hookContent).toMatch(/dev_engineer[\s\S]*?\.ai\/.*docs\//);
  });

  it('test_engineer cannot modify production code', () => {
    expect(hookContent).toContain('Test Engineer role cannot modify production code');
  });

  it('supports yq and grep fallback for YAML parsing', () => {
    expect(hookContent).toContain('command -v yq');
    expect(hookContent).toContain('grep -A');
  });

  it('provides emergency bypass instruction', () => {
    expect(hookContent).toContain('--no-verify');
  });
});
