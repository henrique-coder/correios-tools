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
import path from 'path';
import { parse } from 'smol-toml';

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
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

checkTool('terser');
checkTool('csso');

console.log(`🔨  Building for: ${browsers.join(', ')}`);

const configRaw = fs.readFileSync('extension.config.toml', 'utf8');
const config = parse(configRaw);
const overrides = config.browser_overrides || {};
delete config.browser_overrides;

const version = generateVersion();
config.version = version;
console.log(`📦  Version: ${version}`);

for (const browser of browsers) {
  console.log(`\n🌐  Building ${browser}...`);

  const manifest = JSON.parse(JSON.stringify(config));
  if (overrides[browser]) {
    mergeDeep(manifest, overrides[browser]);
  }

  manifest.version = version;

  const outDir = path.join('build', isZip ? 'temp' : 'unpacked', browser);
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
        `pnpm exec terser "${src}" --compress --mangle --output "${dest}"`
      );
      console.log(`  ✔ ${file} (minified)`);
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
    const releasesDir = path.join('build', 'releases');
    if (!fs.existsSync(releasesDir)) fs.mkdirSync(releasesDir, { recursive: true });
    const zipPath = path.join(releasesDir, `${browser}-${version}.zip`);
    if (fs.existsSync(zipPath)) {
      fs.rmSync(zipPath);
    }
    try {
      execSync(`cd "${outDir}" && zip -9 -r "../../releases/${browser}-${version}.zip" .`);
      console.log(`  ✔ packaged to releases/${browser}-${version}.zip`);
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`❌  Failed to create zip: ${e.message}`);
    }
  }
}

console.log(`\n✅  Build complete → ./build/`);
