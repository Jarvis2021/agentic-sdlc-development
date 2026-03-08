import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const { validateKnowledgeGraph } = require('../lib/cli-utils');

const KG_PATH = path.resolve(__dirname, '../docs/knowledge-graph/knowledge-graph.json');

describe('Knowledge Graph Validation', () => {
  const kg = JSON.parse(fs.readFileSync(KG_PATH, 'utf8'));

  describe('Structure', () => {
    it('passes full validation', () => {
      const result = validateKnowledgeGraph(kg);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('has meta section with required fields', () => {
      expect(kg.meta.version).toBeDefined();
      expect(kg.meta.repos).toBeDefined();
      expect(kg.meta.org).toBe('Example Portfolio');
    });

    it('meta.repos matches actual node count', () => {
      expect(kg.meta.repos).toBe(kg.nodes.length);
    });
  });

  describe('Nodes', () => {
    it('every node has required properties', () => {
      for (const node of kg.nodes) {
        expect(node.id, `Node missing id`).toBeDefined();
        expect(node.name, `Node ${node.id} missing name`).toBeDefined();
        expect(node.group, `Node ${node.id} missing group`).toBeDefined();
        expect(node.lang, `Node ${node.id} missing lang`).toBeDefined();
        expect(node.desc, `Node ${node.id} missing desc`).toBeDefined();
      }
    });

    it('all node IDs are unique', () => {
      const ids = kg.nodes.map(n => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every node references a valid group', () => {
      const groupIds = Object.keys(kg.groups);
      for (const node of kg.nodes) {
        expect(groupIds, `Node ${node.id} references unknown group: ${node.group}`).toContain(node.group);
      }
    });

    it('risk levels are valid enum values', () => {
      const validRisks = ['low', 'med', 'high', 'critical'];
      for (const node of kg.nodes) {
        if (node.risk) {
          expect(validRisks, `Node ${node.id} has invalid risk: ${node.risk}`).toContain(node.risk);
        }
      }
    });

    it('contains core sample portfolio repos', () => {
      const ids = kg.nodes.map(n => n.id);
      const coreRepos = ['mobile-ios-app', 'companion-ios-app', 'mobile-android-app', 'shared-mobile-sdk', 'api-gateway', 'design-service'];
      for (const repo of coreRepos) {
        expect(ids, `Missing core repo: ${repo}`).toContain(repo);
      }
    });
  });

  describe('Edges', () => {
    const nodeIds = new Set(kg.nodes.map(n => n.id));

    it('every edge references existing source and target', () => {
      for (const edge of kg.edges) {
        expect(nodeIds.has(edge.source), `Edge source "${edge.source}" not in nodes`).toBe(true);
        expect(nodeIds.has(edge.target), `Edge target "${edge.target}" not in nodes`).toBe(true);
      }
    });

    it('every edge has a type', () => {
      const validTypes = ['api', 'sdk', 'kafka', 'logs', 'data', 'config', 'mfe', 'event'];
      for (const edge of kg.edges) {
        expect(edge.type, `Edge ${edge.source}->${edge.target} missing type`).toBeDefined();
        expect(validTypes, `Edge ${edge.source}->${edge.target} has unknown type: ${edge.type}`).toContain(edge.type);
      }
    });

    it('every edge has a label', () => {
      for (const edge of kg.edges) {
        expect(edge.label, `Edge ${edge.source}->${edge.target} missing label`).toBeDefined();
        expect(edge.label.length).toBeGreaterThan(0);
      }
    });

    it('no self-referencing edges', () => {
      for (const edge of kg.edges) {
        expect(edge.source, `Self-referencing edge: ${edge.source}`).not.toBe(edge.target);
      }
    });
  });

  describe('Groups', () => {
    it('every group has color, label, and size', () => {
      for (const [id, group] of Object.entries(kg.groups)) {
        expect(group.color, `Group ${id} missing color`).toBeDefined();
        expect(group.label, `Group ${id} missing label`).toBeDefined();
        expect(group.size, `Group ${id} missing size`).toBeDefined();
        expect(group.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('all groups are used by at least one node', () => {
      const usedGroups = new Set(kg.nodes.map(n => n.group));
      for (const groupId of Object.keys(kg.groups)) {
        expect(usedGroups.has(groupId), `Group ${groupId} is unused`).toBe(true);
      }
    });
  });
});

describe('validateKnowledgeGraph edge cases', () => {
  it('reports missing meta', () => {
    const result = validateKnowledgeGraph({ nodes: [], edges: [], groups: {} });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing meta section');
  });

  it('reports missing nodes', () => {
    const result = validateKnowledgeGraph({ meta: {}, edges: [], groups: {} });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid nodes array');
  });

  it('reports duplicate node IDs', () => {
    const kg = {
      meta: {},
      nodes: [
        { id: 'a', name: 'A', group: 'g1' },
        { id: 'a', name: 'B', group: 'g1' },
      ],
      edges: [],
      groups: { g1: {} },
    };
    const result = validateKnowledgeGraph(kg);
    expect(result.errors).toContain('Duplicate node id: a');
  });

  it('reports unknown group references', () => {
    const kg = {
      meta: {},
      nodes: [{ id: 'a', name: 'A', group: 'nonexistent' }],
      edges: [],
      groups: { g1: {} },
    };
    const result = validateKnowledgeGraph(kg);
    expect(result.errors.some(e => e.includes('unknown group'))).toBe(true);
  });

  it('reports invalid risk levels', () => {
    const kg = {
      meta: {},
      nodes: [{ id: 'a', name: 'A', group: 'g1', risk: 'extreme' }],
      edges: [],
      groups: { g1: {} },
    };
    const result = validateKnowledgeGraph(kg);
    expect(result.errors.some(e => e.includes('invalid risk level'))).toBe(true);
  });

  it('reports edges with unknown source/target', () => {
    const kg = {
      meta: {},
      nodes: [{ id: 'a', name: 'A', group: 'g1' }],
      edges: [{ source: 'a', target: 'b' }],
      groups: { g1: {} },
    };
    const result = validateKnowledgeGraph(kg);
    expect(result.errors.some(e => e.includes('unknown target node'))).toBe(true);
  });
});
