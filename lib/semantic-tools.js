const fs = require('fs');
const path = require('path');

const DEFAULT_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rb', '.java', '.kt', '.swift', '.md', '.yaml', '.yml', '.json', '.sh'];
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'coverage', 'dist', 'build', '.next']);

function searchSymbols(rootDir, input = {}) {
  const symbol = input.symbol || input.query;
  if (!symbol) {
    return { error: 'symbol or query is required' };
  }

  const matches = [];
  for (const filePath of walkFiles(rootDir, input.extensions || DEFAULT_EXTENSIONS)) {
    const content = safeRead(filePath);
    if (!content) continue;
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes(symbol)) {
        matches.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          preview: line.trim(),
        });
      }
    });
  }

  return {
    symbol,
    matches: matches.slice(0, input.limit || 100),
    total_matches: matches.length,
    mode: 'fallback-text-search',
  };
}

function findSymbolUsages(rootDir, input = {}) {
  return searchSymbols(rootDir, input);
}

function renameSymbolPreview(rootDir, input = {}) {
  const { symbol, replacement } = input;
  if (!symbol || !replacement) {
    return { error: 'symbol and replacement are required' };
  }

  const search = searchSymbols(rootDir, input);
  if (search.error) return search;

  return {
    symbol,
    replacement,
    impacted_files: [...new Set(search.matches.map((match) => match.file))],
    impacted_references: search.matches.map((match) => ({
      ...match,
      replacement_preview: match.preview.replaceAll(symbol, replacement),
    })),
    mode: 'preview-only',
  };
}

function walkFiles(rootDir, extensions) {
  const results = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.includes(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }
  }
  walk(rootDir);
  return results;
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return null;
  }
}

module.exports = {
  findSymbolUsages,
  renameSymbolPreview,
  searchSymbols,
};
