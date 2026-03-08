import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const { detectTechStack, generateProjectConfig, copyDirRecursive } = require('../lib/cli-utils');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'platform-test-'));
}

function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('detectTechStack', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  it('returns empty array for empty directory', () => {
    expect(detectTechStack(tmpDir)).toEqual([]);
  });

  it('detects Android project', () => {
    fs.writeFileSync(path.join(tmpDir, 'build.gradle.kts'), '');
    fs.mkdirSync(path.join(tmpDir, 'app/src/main'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'app/src/main/AndroidManifest.xml'), '');
    const result = detectTechStack(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('android');
    expect(result[0].name).toBe('Android');
  });

  it('detects JVM (Gradle without Android manifest)', () => {
    fs.writeFileSync(path.join(tmpDir, 'build.gradle'), '');
    const result = detectTechStack(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('jvm');
  });

  it('detects iOS project with Podfile', () => {
    fs.writeFileSync(path.join(tmpDir, 'Podfile'), '');
    const result = detectTechStack(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ios');
    expect(result[0].name).toBe('iOS');
  });

  it('detects iOS project with Package.swift', () => {
    fs.writeFileSync(path.join(tmpDir, 'Package.swift'), '');
    const result = detectTechStack(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ios');
  });

  it('detects iOS workspace name', () => {
    fs.writeFileSync(path.join(tmpDir, 'Podfile'), '');
    fs.mkdirSync(path.join(tmpDir, 'MyApp.xcworkspace'));
    const result = detectTechStack(tmpDir);
    expect(result[0].detail).toContain('MyApp.xcworkspace');
  });

  it('detects Node.js project', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test' }));
    const result = detectTechStack(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('node');
    expect(result[0].name).toBe('JavaScript');
    expect(result[0].detail).toBe('Node.js');
  });

  it('detects TypeScript project', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test' }));
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
    const result = detectTechStack(tmpDir);
    expect(result[0].name).toBe('TypeScript');
  });

  it('detects Next.js framework', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test',
      dependencies: { next: '15.0.0' }
    }));
    const result = detectTechStack(tmpDir);
    expect(result[0].detail).toBe('Next.js');
  });

  it('detects React framework', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test',
      dependencies: { react: '18.0.0' }
    }));
    const result = detectTechStack(tmpDir);
    expect(result[0].detail).toBe('React');
  });

  it('detects Express framework', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test',
      dependencies: { express: '4.0.0' }
    }));
    const result = detectTechStack(tmpDir);
    expect(result[0].detail).toBe('Express');
  });

  it('detects Fastify framework', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test',
      dependencies: { fastify: '5.0.0' }
    }));
    const result = detectTechStack(tmpDir);
    expect(result[0].detail).toBe('Fastify');
  });

  it('detects Python (pyproject.toml)', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].id).toBe('python');
  });

  it('detects Python (requirements.txt)', () => {
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].id).toBe('python');
  });

  it('detects Django framework', () => {
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), '');
    fs.writeFileSync(path.join(tmpDir, 'manage.py'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].detail).toBe('Django');
  });

  it('detects FastAPI framework', () => {
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), '');
    fs.mkdirSync(path.join(tmpDir, 'app'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'app/main.py'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].detail).toBe('FastAPI');
  });

  it('detects Ruby project', () => {
    fs.writeFileSync(path.join(tmpDir, 'Gemfile'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].id).toBe('ruby');
    expect(result[0].detail).toBe('Ruby');
  });

  it('detects Rails framework', () => {
    fs.writeFileSync(path.join(tmpDir, 'Gemfile'), '');
    fs.mkdirSync(path.join(tmpDir, 'config'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'config/routes.rb'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].detail).toBe('Rails');
  });

  it('detects Go project', () => {
    fs.writeFileSync(path.join(tmpDir, 'go.mod'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].id).toBe('go');
  });

  it('detects Rust project', () => {
    fs.writeFileSync(path.join(tmpDir, 'Cargo.toml'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].id).toBe('rust');
  });

  it('detects .NET project', () => {
    fs.writeFileSync(path.join(tmpDir, 'MyApp.csproj'), '');
    const result = detectTechStack(tmpDir);
    expect(result[0].id).toBe('dotnet');
  });

  it('detects multiple stacks simultaneously', () => {
    fs.writeFileSync(path.join(tmpDir, 'Podfile'), '');
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), '');
    const result = detectTechStack(tmpDir);
    expect(result.length).toBe(2);
    const ids = result.map(s => s.id);
    expect(ids).toContain('ios');
    expect(ids).toContain('python');
  });

  it('does not double-detect Node when Gradle is present', () => {
    fs.writeFileSync(path.join(tmpDir, 'build.gradle'), '');
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'mobile-android-app' }));
    const result = detectTechStack(tmpDir);
    const nodeDetections = result.filter(s => s.id === 'node');
    expect(nodeDetections).toHaveLength(0);
  });
});

describe('generateProjectConfig', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  it('generates valid YAML config', () => {
    const config = generateProjectConfig(tmpDir, []);
    expect(config).toContain('project:');
    expect(config).toContain('quality_gates:');
    expect(config).toContain('bounded_context:');
  });

  it('writes config file to .ai/project-config.yaml', () => {
    generateProjectConfig(tmpDir, []);
    expect(fs.existsSync(path.join(tmpDir, '.ai/project-config.yaml'))).toBe(true);
  });

  it('sets Python coverage to 95%', () => {
    const config = generateProjectConfig(tmpDir, [{ id: 'python', name: 'Python', detail: 'Python' }]);
    expect(config).toContain('coverage_threshold: 95');
    expect(config).toContain('ruff + mypy');
    expect(config).toContain('pytest');
  });

  it('sets Node coverage to 90%', () => {
    const config = generateProjectConfig(tmpDir, [{ id: 'node', name: 'JavaScript', detail: 'Node.js' }]);
    expect(config).toContain('coverage_threshold: 90');
    expect(config).toContain('eslint + prettier');
  });

  it('sets Android coverage to 80% with extras', () => {
    const config = generateProjectConfig(tmpDir, [{ id: 'android', name: 'Android', detail: 'Kotlin' }]);
    expect(config).toContain('coverage_threshold: 80');
    expect(config).toContain('ktlint + detekt');
    expect(config).toContain('min_sdk: 26');
    expect(config).toContain('backward_compatibility_months: 18');
  });

  it('sets iOS coverage with extras', () => {
    const config = generateProjectConfig(tmpDir, [{ id: 'ios', name: 'iOS', detail: 'Swift' }]);
    expect(config).toContain('swiftlint');
    expect(config).toContain('min_deployment_target');
    expect(config).toContain('cocoapods: true');
  });

  it('sets Go config', () => {
    const config = generateProjectConfig(tmpDir, [{ id: 'go', name: 'Go', detail: 'Go modules' }]);
    expect(config).toContain('golangci-lint');
    expect(config).toContain('go test');
  });

  it('sets Rust config', () => {
    const config = generateProjectConfig(tmpDir, [{ id: 'rust', name: 'Rust', detail: 'Cargo' }]);
    expect(config).toContain('clippy');
    expect(config).toContain('cargo test');
  });

  it('defaults to eslint/jest for empty stack', () => {
    const config = generateProjectConfig(tmpDir, []);
    expect(config).toContain('linter: "eslint"');
    expect(config).toContain('test_framework: "jest"');
    expect(config).toContain('coverage_threshold: 80');
  });

  it('sets bounded context defaults', () => {
    const config = generateProjectConfig(tmpDir, []);
    expect(config).toContain('now_md_max_tokens: 200');
    expect(config).toContain('history_rotation: true');
    expect(config).toContain('max_protocol_load: 3');
  });

  it('includes detected stack name in header comment', () => {
    const config = generateProjectConfig(tmpDir, [{ id: 'node', name: 'TypeScript', detail: 'Next.js' }]);
    expect(config).toContain('TypeScript (Next.js)');
  });
});

describe('copyDirRecursive', () => {
  let srcDir, destDir;

  beforeEach(() => {
    srcDir = createTempDir();
    destDir = path.join(createTempDir(), 'output');
  });

  afterEach(() => {
    cleanupDir(srcDir);
    cleanupDir(path.dirname(destDir));
  });

  it('copies flat files', () => {
    fs.writeFileSync(path.join(srcDir, 'a.txt'), 'hello');
    fs.writeFileSync(path.join(srcDir, 'b.txt'), 'world');
    copyDirRecursive(srcDir, destDir);
    expect(fs.readFileSync(path.join(destDir, 'a.txt'), 'utf8')).toBe('hello');
    expect(fs.readFileSync(path.join(destDir, 'b.txt'), 'utf8')).toBe('world');
  });

  it('copies nested directories', () => {
    fs.mkdirSync(path.join(srcDir, 'sub', 'deep'), { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'sub', 'deep', 'file.txt'), 'nested');
    copyDirRecursive(srcDir, destDir);
    expect(fs.readFileSync(path.join(destDir, 'sub', 'deep', 'file.txt'), 'utf8')).toBe('nested');
  });

  it('handles empty directories', () => {
    fs.mkdirSync(path.join(srcDir, 'empty'));
    copyDirRecursive(srcDir, destDir);
    expect(fs.existsSync(path.join(destDir, 'empty'))).toBe(true);
  });
});
