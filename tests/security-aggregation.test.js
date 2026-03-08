import { describe, it, expect } from 'vitest';

const { aggregateScanResults } = require('../lib/cli-utils');

function createKg(nodes = []) {
  return {
    meta: { generated: '2026-03-05T00:00:00Z', version: '1.0', repos: nodes.length },
    groups: { mobile: { color: '#60a5fa', label: 'Mobile Apps', size: 14 } },
    nodes,
    edges: [],
  };
}

function createScan(repo, overrides = {}) {
  return {
    repo,
    scanned_at: '2026-03-05T12:00:00Z',
    stack: 'node',
    risk: 'low',
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    outdated_packages: 0,
    secrets_detected: 0,
    license_issues: 0,
    ...overrides,
  };
}

describe('aggregateScanResults', () => {
  it('merges scan data into matching KG node', () => {
    const kg = createKg([{ id: 'mobile-android-app', name: 'Mobile Android App', group: 'mobile', risk: 'low' }]);
    const scans = [createScan('mobile-android-app', { stack: 'kotlin' })];
    aggregateScanResults(scans, kg);
    expect(kg.nodes[0].scan).toBeDefined();
    expect(kg.nodes[0].scan.stack).toBe('kotlin');
  });

  it('maps hyphenated repo names to KG node IDs', () => {
    const kg = createKg([{ id: 'mobile-telemetry-sdk', name: 'Mobile Telemetry SDK', group: 'mobile', risk: 'low' }]);
    const scans = [createScan('mobile-telemetry-sdk')];
    aggregateScanResults(scans, kg);
    expect(kg.nodes[0].scan).toBeDefined();
  });

  it('maps alternate account directory repo names', () => {
    const kg = createKg([{ id: 'account-directory', name: 'Account Directory', group: 'mobile', risk: 'low' }]);
    const scans = [createScan('account-directory-service')];
    aggregateScanResults(scans, kg);
    expect(kg.nodes[0].scan).toBeDefined();
  });

  it('escalates risk to high on critical scan', () => {
    const kg = createKg([{ id: 'mobile-ios-app', name: 'Mobile iOS App', group: 'mobile', risk: 'low' }]);
    const scans = [createScan('mobile-ios-app', {
      risk: 'critical',
      vulnerabilities: { critical: 3, high: 0, medium: 0, low: 0, total: 3 },
    })];
    const result = aggregateScanResults(scans, kg);
    expect(kg.nodes[0].risk).toBe('high');
    expect(result.highCritRepos).toContain('mobile-ios-app');
  });

  it('escalates risk from low to med on med scan', () => {
    const kg = createKg([{ id: 'companion-ios-app', name: 'Companion iOS App', group: 'mobile', risk: 'low' }]);
    const scans = [createScan('companion-ios-app', { risk: 'med' })];
    aggregateScanResults(scans, kg);
    expect(kg.nodes[0].risk).toBe('med');
  });

  it('does not downgrade risk from high to med', () => {
    const kg = createKg([{ id: 'api-gateway', name: 'API Gateway', group: 'mobile', risk: 'high' }]);
    const scans = [createScan('api-gateway', { risk: 'med' })];
    aggregateScanResults(scans, kg);
    expect(kg.nodes[0].risk).toBe('high');
  });

  it('counts total findings including secrets', () => {
    const kg = createKg([{ id: 'design-service', name: 'Design Service', group: 'mobile', risk: 'low' }]);
    const scans = [createScan('design-service', {
      vulnerabilities: { critical: 1, high: 2, medium: 3, low: 4, total: 10 },
      secrets_detected: 2,
    })];
    const result = aggregateScanResults(scans, kg);
    expect(result.totalFindings).toBe(12);
  });

  it('skips repos not in KG', () => {
    const kg = createKg([{ id: 'mobile-ios-app', name: 'Mobile iOS App', group: 'mobile', risk: 'low' }]);
    const scans = [createScan('unknown-repo')];
    const result = aggregateScanResults(scans, kg);
    expect(result.totalFindings).toBe(0);
    expect(result.highCritRepos).toHaveLength(0);
  });

  it('handles empty scan array', () => {
    const kg = createKg([{ id: 'mobile-ios-app', name: 'Mobile iOS App', group: 'mobile', risk: 'low' }]);
    const result = aggregateScanResults([], kg);
    expect(result.totalFindings).toBe(0);
  });

  it('aggregates multiple scans', () => {
    const kg = createKg([
      { id: 'mobile-ios-app', name: 'Mobile iOS App', group: 'mobile', risk: 'low' },
      { id: 'mobile-android-app', name: 'Mobile Android App', group: 'mobile', risk: 'low' },
    ]);
    const scans = [
      createScan('mobile-ios-app', { vulnerabilities: { total: 5 }, risk: 'high' }),
      createScan('mobile-android-app', { vulnerabilities: { total: 3 }, secrets_detected: 1 }),
    ];
    const result = aggregateScanResults(scans, kg);
    expect(result.totalFindings).toBe(9);
    expect(result.highCritRepos).toContain('mobile-ios-app');
  });
});
