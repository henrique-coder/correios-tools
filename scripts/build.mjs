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

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
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

  const srcFiles = fs.readdirSync('src').filter((f) => f.endsWith('.js'));
  for (const file of srcFiles) {
    const src = path.join('src', file);
    const dest = path.join(outDir, file);
    if (file.endsWith('.min.js')) {
      fs.copyFileSync(src, dest);
      console.log(`  ✔ ${file} (copied)`);
    } else {
      execSync(
        `pnpm exec google-closure-compiler --compilation_level=SIMPLE_OPTIMIZATIONS --language_in=ECMASCRIPT_NEXT --language_out=ECMASCRIPT_2019 --rewrite_polyfills=false --assume_function_wrapper --isolation_mode=IIFE --js="${src}" --js_output_file="${dest}"`
      );
      console.log(`  ✔ ${file} (minified)`);
    }
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
