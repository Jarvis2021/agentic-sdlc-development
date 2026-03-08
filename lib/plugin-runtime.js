const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const { appendEvent } = require('./session-runtime');

function getPluginPaths(rootDir) {
  const base = path.join(rootDir, '.ai', 'plugins');
  return {
    base,
    registry: path.join(base, 'registry.json'),
  };
}

function ensurePluginRuntime(rootDir) {
  const paths = getPluginPaths(rootDir);
  fs.mkdirSync(paths.base, { recursive: true });

  if (!fs.existsSync(paths.registry)) {
    writeJson(paths.registry, {
      schema_version: '1.0.0',
      plugins: {},
      updated_at: null,
    });
  }

  return paths;
}

function readRegistry(rootDir) {
  const paths = ensurePluginRuntime(rootDir);
  const registry = readJson(paths.registry, { schema_version: '1.0.0', plugins: {} });
  if (!registry.plugins && registry.installed) {
    registry.plugins = Object.fromEntries(
      Object.entries(registry.installed).map(([name, value]) => [name, {
        enabled: value.enabled !== false,
        version: value.version || 'unknown',
        capabilities: [],
        updated_at: value.updated_at || value.installed_at || null,
      }])
    );
  }
  registry.plugins = registry.plugins || {};
  return registry;
}

function writeRegistry(rootDir, registry) {
  const paths = ensurePluginRuntime(rootDir);
  registry.updated_at = new Date().toISOString();
  writeJson(paths.registry, registry);
  return registry;
}

function loadPluginManifest(rootDir, pluginName) {
  const paths = ensurePluginRuntime(rootDir);
  const manifestPath = path.join(paths.base, pluginName, 'plugin.yaml');
  if (!fs.existsSync(manifestPath)) return null;
  const data = YAML.parse(fs.readFileSync(manifestPath, 'utf8'));
  return {
    ...data,
    path: manifestPath,
    name: data?.name || pluginName,
  };
}

function listPluginManifests(rootDir) {
  const paths = ensurePluginRuntime(rootDir);
  if (!fs.existsSync(paths.base)) return [];

  const registry = readRegistry(rootDir);
  return fs.readdirSync(paths.base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => loadPluginManifest(rootDir, entry.name))
    .filter(Boolean)
    .map((manifest) => ({
      ...manifest,
      enabled: registry.plugins?.[manifest.name]?.enabled !== false,
      installed: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function setPluginEnabled(rootDir, pluginName, enabled) {
  const manifest = loadPluginManifest(rootDir, pluginName);
  if (!manifest) {
    throw new Error(`Plugin "${pluginName}" not found`);
  }

  const registry = readRegistry(rootDir);
  registry.plugins[pluginName] = {
    enabled,
    version: manifest.version,
    capabilities: manifest.capabilities || [],
    updated_at: new Date().toISOString(),
  };
  writeRegistry(rootDir, registry);

  appendEvent(rootDir, {
    type: enabled ? 'plugin.enabled' : 'plugin.disabled',
    actor: 'plugin-runtime',
    source: 'cli',
    message: `${enabled ? 'Enabled' : 'Disabled'} plugin ${pluginName}`,
    payload: {
      plugin: pluginName,
      version: manifest.version,
    },
  });

  return {
    plugin: pluginName,
    enabled,
    version: manifest.version,
  };
}

function doctorPlugins(rootDir) {
  const manifests = listPluginManifests(rootDir);
  const issues = [];

  for (const manifest of manifests) {
    const requiredFields = ['name', 'version', 'capabilities', 'compatibility'];
    for (const field of requiredFields) {
      if (manifest[field] === undefined) {
        issues.push(`${manifest.name}: missing ${field}`);
      }
    }

    if (!Array.isArray(manifest.capabilities)) {
      issues.push(`${manifest.name}: capabilities must be an array`);
    }

    if (manifest.dependencies && !Array.isArray(manifest.dependencies)) {
      issues.push(`${manifest.name}: dependencies must be an array`);
    }
  }

  return {
    valid: issues.length === 0,
    plugin_count: manifests.length,
    issues,
    plugins: manifests.map((manifest) => ({
      name: manifest.name,
      version: manifest.version,
      enabled: manifest.enabled,
    })),
  };
}

function syncPluginMcpConfig(rootDir) {
  const mcpPath = path.join(rootDir, '.mcp.json');
  const current = readJson(mcpPath, { servers: {}, plugins: { enabled: [] } });
  const manifests = listPluginManifests(rootDir);
  current.plugins = current.plugins || {};
  current.plugins.enabled = manifests.filter((manifest) => manifest.enabled).map((manifest) => manifest.name);
  current.plugins.catalog = manifests.map((manifest) => ({
    name: manifest.name,
    version: manifest.version,
    capabilities: manifest.capabilities || [],
  }));
  writeJson(mcpPath, current);
  return current;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

module.exports = {
  doctorPlugins,
  ensurePluginRuntime,
  getPluginPaths,
  listPluginManifests,
  loadPluginManifest,
  readRegistry,
  setPluginEnabled,
  syncPluginMcpConfig,
  writeRegistry,
};
