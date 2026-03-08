#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const {
  getBrowserPackStatus,
  getDiagnosticsStatus,
  getGovernance,
  getKnowledgeGraph,
  getPluginStatus,
  getRbac,
  getSecurityStatus,
  getSessionRuntime,
} = require('./data');
const {
  searchRepos,
  getRepoRisks,
  getDependencies,
  getCrossRepoImpact,
  queryGovernance,
  getSecuritySummary,
  getStoryContext,
  getPrdImpact,
  getRuntimeSnapshot,
  getDiagnosticsFeed,
  listPlugins,
  getPluginManifest,
  captureDebugEvidence,
  searchCodeSymbols,
  getSymbolUsages,
  getRenamePreview,
} = require('./tools');

const server = new Server(
  { name: 'platform-knowledge-graph', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// Resources

const RESOURCES = [
  {
    uri: 'platform://knowledge-graph',
    name: 'Platform Knowledge Graph',
    description: 'Full knowledge graph of 18 Platform repositories - nodes, edges, groups, risks, and security scan data',
    mimeType: 'application/json',
  },
  {
    uri: 'platform://governance',
    name: 'Platform Governance Rules',
    description: 'Organization governance layer - PII/PII policy, encryption contracts, idempotency rules, mobile compatibility, compliance standards',
    mimeType: 'text/yaml',
  },
  {
    uri: 'platform://rbac',
    name: 'RBAC Configuration',
    description: 'Role-based access control - team roles (architect, dev_lead, dev_engineer, test_engineer), agent permissions, file access rules',
    mimeType: 'text/yaml',
  },
  {
    uri: 'platform://security-status',
    name: 'Security Scan Status',
    description: 'Latest security scan results across all scanned repos - CVEs, outdated packages, secrets, license issues',
    mimeType: 'application/json',
  },
  {
    uri: 'platform://session-runtime',
    name: 'Session Runtime Summary',
    description: 'Current structured session, plan, trace, approval, and event runtime summary',
    mimeType: 'application/json',
  },
  {
    uri: 'platform://diagnostics',
    name: 'Diagnostics Summary',
    description: 'Aggregated diagnostics and evidence bundle summary across command, CI, test, and browser verification signals',
    mimeType: 'application/json',
  },
  {
    uri: 'platform://plugins',
    name: 'Plugin Catalog',
    description: 'Installed framework plugins and their enabled capabilities',
    mimeType: 'application/json',
  },
];

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: RESOURCES,
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  let content;
  let mimeType;

  switch (uri) {
    case 'platform://knowledge-graph':
      content = JSON.stringify(getKnowledgeGraph(), null, 2);
      mimeType = 'application/json';
      break;
    case 'platform://governance':
      content = getGovernance();
      mimeType = 'text/yaml';
      break;
    case 'platform://rbac':
      content = getRbac();
      mimeType = 'text/yaml';
      break;
    case 'platform://security-status':
      content = JSON.stringify(getSecurityStatus(), null, 2);
      mimeType = 'application/json';
      break;
    case 'platform://session-runtime':
      content = JSON.stringify(getSessionRuntime(), null, 2);
      mimeType = 'application/json';
      break;
    case 'platform://diagnostics':
      content = JSON.stringify(getDiagnosticsStatus(), null, 2);
      mimeType = 'application/json';
      break;
    case 'platform://plugins':
      content = JSON.stringify({
        plugins: getPluginStatus(),
        browser_pack: getBrowserPackStatus(),
      }, null, 2);
      mimeType = 'application/json';
      break;
    default:
      return { contents: [{ uri, text: `Unknown resource: ${uri}`, mimeType: 'text/plain' }] };
  }

  return {
    contents: [{ uri, text: content || 'Resource not found', mimeType }],
  };
});

// Tools

const TOOLS = [
  {
    name: 'search_repos',
    description: 'Search Platform repositories by name, tech stack, layer, or risk level',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term (matches repo name, tech stack, or description)' },
        risk_level: { type: 'string', enum: ['low', 'med', 'high'], description: 'Filter by risk level' },
        group: { type: 'string', enum: ['mobile', 'ios', 'gateway', 'backend', 'web', 'platform', 'support'], description: 'Filter by architecture group' },
        tech_stack: { type: 'string', description: 'Filter by technology (e.g. "Swift", "Kotlin", "Python")' },
      },
    },
  },
  {
    name: 'get_repo_risks',
    description: 'Get risk assessment for a specific repository - risk level, vulnerabilities, outdated packages, security scan data',
    inputSchema: {
      type: 'object',
      properties: {
        repo_id: { type: 'string', description: 'Repository ID (e.g. "shared-mobile-sdk", "mobile-ios-app", "api-gateway")' },
      },
      required: ['repo_id'],
    },
  },
  {
    name: 'get_dependencies',
    description: 'Get upstream and downstream dependencies for a repository from the knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        repo_id: { type: 'string', description: 'Repository ID' },
      },
      required: ['repo_id'],
    },
  },
  {
    name: 'get_cross_repo_impact',
    description: 'Analyze blast radius of a change in one repo across the Platform ecosystem - which repos are directly and transitively affected',
    inputSchema: {
      type: 'object',
      properties: {
        repo_id: { type: 'string', description: 'Repository where the change originates' },
        change_type: { type: 'string', enum: ['api', 'model', 'config', 'dependency'], description: 'Type of change being made' },
      },
      required: ['repo_id'],
    },
  },
  {
    name: 'query_governance',
    description: 'Check if a proposed change complies with Platform governance rules - PII/PII, encryption contracts, idempotency, mobile compatibility',
    inputSchema: {
      type: 'object',
      properties: {
        check_type: { type: 'string', enum: ['phi_pii', 'ecdh', 'idempotency', 'mobile_compat'], description: 'Which governance rule to check' },
        value: { type: 'string', description: 'Code snippet or description of the change being checked' },
      },
      required: ['check_type'],
    },
  },
  {
    name: 'get_security_summary',
    description: 'Get aggregated security status across all scanned repos - total CVEs, outdated packages, secrets detected, risk distribution',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_story_context',
    description: 'Get full context for story creation targeting a specific repo - ADRs, architecture patterns, API contracts, tech stack, governance rules. Use during PRD-to-Stories decomposition.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_id: { type: 'string', description: 'Repository ID (e.g. "shared-mobile-sdk", "mobile-ios-app", "api-gateway")' },
      },
      required: ['repo_id'],
    },
  },
  {
    name: 'get_prd_impact',
    description: 'Given feature keywords from a PRD, find all affected repos (directly matched + transitively impacted) with blast radius and governance flags. Use to determine which repos need stories.',
    inputSchema: {
      type: 'object',
      properties: {
        feature_keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords extracted from PRD features (e.g. ["workflow", "submission", "inline labels", "mobile"])' },
      },
      required: ['feature_keywords'],
    },
  },
  {
    name: 'get_runtime_snapshot',
    description: 'Get the structured session runtime snapshot including active session, plan, approvals, tasks, and recent events.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_diagnostics_feed',
    description: 'Get aggregated diagnostics and recent debug evidence artifacts captured by the debug fabric.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_plugins',
    description: 'List installed framework plugins, capabilities, and whether they are enabled.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_plugin_manifest',
    description: 'Get a plugin manifest and compatibility metadata for a specific plugin.',
    inputSchema: {
      type: 'object',
      properties: {
        plugin_name: { type: 'string', description: 'Plugin name (for example "debug-pack")' },
      },
      required: ['plugin_name'],
    },
  },
  {
    name: 'capture_debug_evidence',
    description: 'Capture structured debug evidence for command, CI, test, or browser verification failures.',
    inputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Human-readable summary of the evidence bundle' },
        command: { type: 'string', description: 'Failing command, if any' },
        stderr: { type: 'string', description: 'stderr output' },
        stdout: { type: 'string', description: 'stdout output' },
        test_output: { type: 'string', description: 'Test failure output' },
        ci_log_excerpt: { type: 'string', description: 'CI failure excerpt' },
        url: { type: 'string', description: 'Browser verification target URL' },
        screenshot_path: { type: 'string', description: 'Screenshot artifact path' },
      },
    },
  },
  {
    name: 'search_code_symbols',
    description: 'Search for symbol occurrences across the workspace using the framework semantic fallback layer.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Symbol or query to search for' },
        limit: { type: 'number', description: 'Maximum number of matches to return' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_symbol_usages',
    description: 'Find symbol usages through the semantic abstraction layer. Uses text fallback when no LSP is available.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Symbol name to locate' },
        limit: { type: 'number', description: 'Maximum number of matches to return' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_rename_preview',
    description: 'Preview which files and references would change during a symbol rename.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Current symbol name' },
        replacement: { type: 'string', description: 'New symbol name' },
      },
      required: ['symbol', 'replacement'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const safeArgs = args || {};
  let result;
  try {
    switch (name) {
      case 'search_repos':
        result = searchRepos(safeArgs);
        break;
      case 'get_repo_risks':
        result = getRepoRisks(safeArgs);
        break;
      case 'get_dependencies':
        result = getDependencies(safeArgs);
        break;
      case 'get_cross_repo_impact':
        result = getCrossRepoImpact(safeArgs);
        break;
      case 'query_governance':
        result = queryGovernance(safeArgs);
        break;
      case 'get_security_summary':
        result = getSecuritySummary();
        break;
      case 'get_story_context':
        result = getStoryContext(safeArgs);
        break;
      case 'get_prd_impact':
        result = getPrdImpact(safeArgs);
        break;
      case 'get_runtime_snapshot':
        result = getRuntimeSnapshot();
        break;
      case 'get_diagnostics_feed':
        result = getDiagnosticsFeed();
        break;
      case 'list_plugins':
        result = listPlugins();
        break;
      case 'get_plugin_manifest':
        result = getPluginManifest(safeArgs);
        break;
      case 'capture_debug_evidence':
        result = captureDebugEvidence(safeArgs);
        break;
      case 'search_code_symbols':
        result = searchCodeSymbols(safeArgs);
        break;
      case 'get_symbol_usages':
        result = getSymbolUsages(safeArgs);
        break;
      case 'get_rename_preview':
        result = getRenamePreview(safeArgs);
        break;
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `Tool error: ${err.message}` }], isError: true };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`MCP server error: ${error.message}\n`);
  process.exit(1);
});
