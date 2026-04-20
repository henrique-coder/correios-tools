#!/usr/bin/env node

/**
 * Local build script — mirrors the GitHub Actions deploy workflow.
 * Outputs to ./build/{browser}/ for one or all browsers.
 *
 * Usage:
 *   node scripts/build.mjs              → builds all browsers
 *   node scripts/build.mjs chrome       → builds Chrome only
 *   node scripts/build.mjs edge         → builds Edge only
 *   node scripts/build.mjs firefox      → builds Firefox only
 */

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parse } from 'smol-toml';

const SOURCE_ROOT = 'src';
const RUNTIME_DEFAULTS_PATH = path.join(SOURCE_ROOT, 'config', 'defaults.json');

const JS_BUNDLE_ENTRIES = [
  {
    outputFile: 'background.js',
    partFiles: [path.join(SOURCE_ROOT, 'background.js')]
  },
  {
    outputFile: 'content.js',
    partFiles: [path.join(SOURCE_ROOT, 'content.js')]
  },
  {
    outputFile: 'injected.js',
    partFiles: [
      path.join(SOURCE_ROOT, 'injected', 'shared', 'core.js'),
      path.join(
        SOURCE_ROOT,
        'injected',
        'services',
        'lancamentoautomatico',
        'runtime',
        'main.js'
      ),
      path.join(
        SOURCE_ROOT,
        'injected',
        'services',
        'lancamentoautomatico',
        'index.js'
      ),
      path.join(
        SOURCE_ROOT,
        'injected',
        'services',
        'loecsuspensa',
        'runtime',
        'main.js'
      ),
      path.join(
        SOURCE_ROOT,
        'injected',
        'services',
        'loecsuspensa',
        'index.js'
      ),
      path.join(SOURCE_ROOT, 'injected', 'index.js')
    ]
  }
];

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`❌  ${label} deve ser uma string não vazia.`);
  }
  return value.trim();
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`❌  ${label} deve ser inteiro positivo.`);
  }
  return value;
}

function assertHttpsUrl(value, label) {
  const raw = assertNonEmptyString(value, label);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`❌  ${label} não é uma URL válida: ${raw}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`❌  ${label} deve usar HTTPS: ${raw}`);
  }
  return parsed;
}

function normalizeHostList(hosts, label) {
  if (!Array.isArray(hosts)) {
    throw new Error(`❌  ${label} deve ser uma lista de hosts.`);
  }

  const normalized = hosts.map((host, index) => {
    const value = assertNonEmptyString(
      host,
      `${label}[${index}]`
    ).toLowerCase();
    if (value.includes('*')) {
      throw new Error(
        `❌  ${label}[${index}] não pode conter wildcard ('*') por segurança: ${host}`
      );
    }
    return value;
  });

  return Array.from(new Set(normalized)).sort();
}

function getHostsFromPermissions(permissions, label = 'host_permissions') {
  if (!Array.isArray(permissions)) {
    throw new Error(`❌  ${label} deve ser uma lista.`);
  }

  const hosts = permissions.map((permission, index) => {
    const pattern = assertNonEmptyString(permission, `${label}[${index}]`);
    const match = pattern.match(/^https:\/\/([^/*]+)\/\*$/i);
    if (!match) {
      throw new Error(
        `❌  ${label}[${index}] inválido: "${pattern}". Use o formato "https://host/*".`
      );
    }

    const host = match[1].toLowerCase();
    if (host.includes('*')) {
      throw new Error(
        `❌  ${label}[${index}] usa wildcard não permitido para proxy seguro: "${pattern}".`
      );
    }
    return host;
  });

  return Array.from(new Set(hosts)).sort();
}

function sameStringSet(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function readRequiredFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌  Arquivo obrigatório não encontrado: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function buildRuntimeDefaults(baseConfig) {
  let rawDefaults;
  try {
    rawDefaults = JSON.parse(readRequiredFile(RUNTIME_DEFAULTS_PATH));
  } catch (err) {
    throw new Error(
      `❌  Falha ao ler ${RUNTIME_DEFAULTS_PATH}: ${err.message}`
    );
  }

  const projectCode = assertNonEmptyString(
    rawDefaults?.projectCode,
    'defaults.projectCode'
  );

  const fetchProxyAction = assertNonEmptyString(
    rawDefaults?.actions?.fetchProxy,
    'defaults.actions.fetchProxy'
  );

  const fetchReqEvent = assertNonEmptyString(
    rawDefaults?.events?.fetchReq,
    'defaults.events.fetchReq'
  );

  const fetchResEvent = assertNonEmptyString(
    rawDefaults?.events?.fetchRes,
    'defaults.events.fetchRes'
  );

  const fetchTimeoutMs = assertPositiveInteger(
    rawDefaults?.limits?.fetchTimeoutMs,
    'defaults.limits.fetchTimeoutMs'
  );

  const remoteStatusTimeoutMs = assertPositiveInteger(
    rawDefaults?.limits?.remoteStatusTimeoutMs,
    'defaults.limits.remoteStatusTimeoutMs'
  );

  const remoteStatusCacheTtlMs = assertPositiveInteger(
    rawDefaults?.limits?.remoteStatusCacheTtlMs,
    'defaults.limits.remoteStatusCacheTtlMs'
  );

  const srowebOrigin = assertHttpsUrl(
    rawDefaults?.urls?.srowebOrigin,
    'defaults.urls.srowebOrigin'
  );

  const srointranetOrigin = assertHttpsUrl(
    rawDefaults?.urls?.srointranetOrigin,
    'defaults.urls.srointranetOrigin'
  );

  const sromonitorOrigin = assertHttpsUrl(
    rawDefaults?.urls?.sromonitorOrigin,
    'defaults.urls.sromonitorOrigin'
  );

  const srowebIndex = assertHttpsUrl(
    rawDefaults?.urls?.srowebIndex,
    'defaults.urls.srowebIndex'
  );

  const remoteStatus = assertHttpsUrl(
    rawDefaults?.urls?.remoteStatus,
    'defaults.urls.remoteStatus'
  );

  if (!srowebIndex.href.startsWith(`${srowebOrigin.origin}/`)) {
    throw new Error(
      '❌  defaults.urls.srowebIndex deve apontar para o mesmo host de defaults.urls.srowebOrigin.'
    );
  }

  const allowedProxyHosts = normalizeHostList(
    rawDefaults?.security?.allowedProxyHosts,
    'defaults.security.allowedProxyHosts'
  );

  const hostsFromUrls = [
    srowebOrigin.hostname,
    srointranetOrigin.hostname,
    sromonitorOrigin.hostname
  ]
    .map((host) => host.toLowerCase())
    .sort();

  if (!sameStringSet(allowedProxyHosts, hostsFromUrls)) {
    throw new Error(
      `❌  defaults.security.allowedProxyHosts (${allowedProxyHosts.join(', ')}) ` +
        `deve ser idêntico aos hosts declarados em defaults.urls (sroweb/srointranet/sromonitor).`
    );
  }

  const manifestHosts = getHostsFromPermissions(
    baseConfig.host_permissions || []
  );
  if (!sameStringSet(allowedProxyHosts, manifestHosts)) {
    throw new Error(
      `❌  defaults.security.allowedProxyHosts (${allowedProxyHosts.join(', ')}) ` +
        `não está em sincronia com extension.config.toml host_permissions (${manifestHosts.join(', ')}).`
    );
  }

  return {
    PROJECT_CODE: projectCode,
    ACTIONS: {
      FETCH_PROXY: fetchProxyAction
    },
    EVENTS: {
      FETCH_REQ: fetchReqEvent,
      FETCH_RES: fetchResEvent
    },
    LIMITS: {
      FETCH_TIMEOUT_MS: fetchTimeoutMs,
      REMOTE_STATUS_TIMEOUT_MS: remoteStatusTimeoutMs,
      REMOTE_STATUS_CACHE_TTL_MS: remoteStatusCacheTtlMs
    },
    URLS: {
      SROWEB_ORIGIN: srowebOrigin.origin,
      SROINTRANET_ORIGIN: srointranetOrigin.origin,
      SROMONITOR_ORIGIN: sromonitorOrigin.origin,
      SROWEB_INDEX: srowebIndex.href,
      REMOTE_STATUS: remoteStatus.href
    },
    SECURITY: {
      ALLOWED_PROXY_HOSTS: allowedProxyHosts
    }
  };
}

function validateManifestSecuritySync(manifest, browserName, runtimeDefaults) {
  const manifestHosts = getHostsFromPermissions(
    manifest.host_permissions || [],
    `${browserName}.host_permissions`
  );

  const expectedHosts = runtimeDefaults.SECURITY.ALLOWED_PROXY_HOSTS;
  if (!sameStringSet(manifestHosts, expectedHosts)) {
    throw new Error(
      `❌  ${browserName}: host_permissions (${manifestHosts.join(', ')}) ` +
        `não bate com defaults.security.allowedProxyHosts (${expectedHosts.join(', ')}).`
    );
  }
}

function buildRuntimeDefaultsPrelude(runtimeDefaults) {
  return [
    `const CW_DEFAULTS = Object.freeze(${JSON.stringify(runtimeDefaults)});`,
    "if (typeof globalThis !== 'undefined') {",
    '  globalThis.CW_DEFAULTS = CW_DEFAULTS;',
    '}'
  ].join('\n');
}

function compileBundledJs(parts, outputFilePath) {
  const tempFilePath = path.join(
    os.tmpdir(),
    `cw-build-${Date.now()}-${Math.random().toString(16).slice(2)}.js`
  );

  fs.writeFileSync(tempFilePath, parts.join('\n\n'), 'utf8');

  try {
    execSync(
      `pnpm exec google-closure-compiler --compilation_level=SIMPLE_OPTIMIZATIONS --language_in=ECMASCRIPT_NEXT --language_out=ECMASCRIPT_2019 --rewrite_polyfills=false --assume_function_wrapper --isolation_mode=IIFE --js="${tempFilePath}" --js_output_file="${outputFilePath}"`
    );
  } finally {
    fs.rmSync(tempFilePath, { force: true });
  }
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

function generateVersion() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();

  let n = 0;
  try {
    const todayStr = `${yyyy}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const count = execSync(
      `git log --oneline --after="${todayStr} 00:00:00" 2>/dev/null | wc -l`,
      { encoding: 'utf8' }
    ).trim();
    const parsed = parseInt(count, 10);
    n = parsed > 0 ? parsed - 1 : 0;
  } catch {}

  return `${yyyy}.${m}.${d}.${n}`;
}

function checkTool(name) {
  try {
    execSync(`pnpm exec ${name} --version`, { stdio: 'ignore' });
  } catch {
    console.error(`❌  '${name}' not found. Make sure you ran 'pnpm install'.`);
    process.exit(1);
  }
}

function checkSystemTool(name) {
  try {
    execSync(`${name} --help`, { stdio: 'ignore' });
  } catch {
    console.error(`❌  '${name}' not found in system PATH.`);
    process.exit(1);
  }
}

const ALL_BROWSERS = ['chrome', 'edge', 'firefox'];
const args = process.argv.slice(2);
const isZip = args.includes('--zip');
const targetArg = args.find((a) => !a.startsWith('--'));

const browsers = targetArg ? [targetArg] : ALL_BROWSERS;

if (browsers.some((b) => !ALL_BROWSERS.includes(b))) {
  console.error(
    `❌  Unknown browser: '${targetArg}'. Valid options: ${ALL_BROWSERS.join(', ')}`
  );
  process.exit(1);
}

checkTool('google-closure-compiler');
checkTool('csso');
if (isZip) checkSystemTool('7z');

console.log(`🔨  Building for: ${browsers.join(', ')}`);

let config;
try {
  const configRaw = fs.readFileSync('extension.config.toml', 'utf8');
  config = parse(configRaw);
} catch (err) {
  console.error(`❌  Failed to parse extension.config.toml: ${err.message}`);
  process.exit(1);
}

if (!config || typeof config !== 'object') {
  console.error('❌  extension.config.toml is empty or invalid.');
  process.exit(1);
}

const overrides = config.browser_overrides || {};
delete config.browser_overrides;

let runtimeDefaults;
try {
  runtimeDefaults = buildRuntimeDefaults(config);
} catch (err) {
  console.error(err.message || String(err));
  process.exit(1);
}

const runtimeDefaultsPrelude = buildRuntimeDefaultsPrelude(runtimeDefaults);

const version = generateVersion();
config.version = version;
console.log(`📦  Version: ${version}`);
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync(path.join('build', 'version.txt'), version);

for (const browser of browsers) {
  console.log(`\n🌐  Building ${browser}...`);

  const manifest = JSON.parse(JSON.stringify(config));
  if (overrides[browser]) {
    mergeDeep(manifest, overrides[browser]);
  }

  manifest.version = version;

  try {
    validateManifestSecuritySync(manifest, browser, runtimeDefaults);
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
  }

  const folderName = `cw-${browser}`;
  const outDir = isZip
    ? path.join(os.tmpdir(), folderName)
    : path.join('build', 'unpacked', folderName);
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest)
  );
  console.log(`  ✔ manifest.json (minified)`);

  for (const entry of JS_BUNDLE_ENTRIES) {
    const destination = path.join(outDir, entry.outputFile);
    const sourceParts = [runtimeDefaultsPrelude];

    for (const partPath of entry.partFiles) {
      sourceParts.push(readRequiredFile(partPath));
    }

    compileBundledJs(sourceParts, destination);
    console.log(`  ✔ ${entry.outputFile} (bundled + minified)`);
  }

  const libsDir = path.join('src', 'libs');
  if (fs.existsSync(libsDir)) {
    const destLibs = path.join(outDir, 'libs');
    fs.mkdirSync(destLibs, { recursive: true });
    for (const lib of fs.readdirSync(libsDir)) {
      if (lib.endsWith('.js')) {
        fs.copyFileSync(path.join(libsDir, lib), path.join(destLibs, lib));
        console.log(`  ✔ libs/${lib} (copied)`);
      }
    }
  }

  const cssFiles = fs.readdirSync('src').filter((f) => f.endsWith('.css'));
  for (const file of cssFiles) {
    const src = path.join('src', file);
    const dest = path.join(outDir, file);
    execSync(`pnpm exec csso "${src}" --output "${dest}"`);
    console.log(`  ✔ ${file} (minified)`);
  }

  const iconsDir = path.join('src', 'icons');
  if (fs.existsSync(iconsDir)) {
    const destIcons = path.join(outDir, 'icons');
    fs.mkdirSync(destIcons, { recursive: true });
    for (const icon of fs.readdirSync(iconsDir)) {
      fs.copyFileSync(path.join(iconsDir, icon), path.join(destIcons, icon));
    }
    console.log(`  ✔ icons/`);
  }

  if (isZip) {
    const zipName = `cw-${browser}.zip`;
    const zipPath = path.join('build', zipName);
    if (fs.existsSync(zipPath)) {
      fs.rmSync(zipPath);
    }
    try {
      fs.mkdirSync('build', { recursive: true });
      const targetZip = path.resolve(zipPath);
      execSync(
        `cd "${outDir}" && 7z a -tzip -mx=9 "${targetZip}" . > /dev/null`
      );
      console.log(`  ✔ zipped to build/${zipName}`);
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`❌  Failed to create zip: ${e.message}`);
      process.exit(1);
    }
  }
}

console.log(`\n✅  Build complete → ./build/`);
