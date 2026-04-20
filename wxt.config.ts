import { execSync } from 'node:child_process';
import { defineConfig, type ConfigEnv, type WxtViteConfig } from 'wxt';
import { RUNTIME_DEFAULTS } from './src/config/defaults.js';

function sortedUnique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.toLowerCase()))).sort();
}

function parseHostname(url: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Config invalida em ${label}: URL invalida (${url}).`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `Config invalida em ${label}: apenas HTTPS e permitido (${url}).`
    );
  }

  return parsed.hostname.toLowerCase();
}

function buildVersion(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();

  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  let dailyCount = 0;
  try {
    const count = execSync(
      `git rev-list --count --since="${isoDate}T00:00:00Z" HEAD`,
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }
    ).trim();
    const parsedCount = Number.parseInt(count, 10);
    dailyCount = parsedCount > 0 ? parsedCount - 1 : 0;
  } catch {
    dailyCount = 0;
  }

  return `${year}.${month}.${day}.${dailyCount}`;
}

function validateRuntimeDefaults(): { hostPermissions: string[] } {
  const allowedHosts = sortedUnique(
    RUNTIME_DEFAULTS.SECURITY.ALLOWED_PROXY_HOSTS
  );

  const urlHosts = sortedUnique([
    parseHostname(
      RUNTIME_DEFAULTS.URLS.SROWEB_ORIGIN,
      'RUNTIME_DEFAULTS.URLS.SROWEB_ORIGIN'
    ),
    parseHostname(
      RUNTIME_DEFAULTS.URLS.SROINTRANET_ORIGIN,
      'RUNTIME_DEFAULTS.URLS.SROINTRANET_ORIGIN'
    ),
    parseHostname(
      RUNTIME_DEFAULTS.URLS.SROMONITOR_ORIGIN,
      'RUNTIME_DEFAULTS.URLS.SROMONITOR_ORIGIN'
    )
  ]);

  if (
    allowedHosts.length !== urlHosts.length ||
    allowedHosts.some((host, index) => host !== urlHosts[index])
  ) {
    throw new Error(
      'Config invalida: SECURITY.ALLOWED_PROXY_HOSTS deve ser identico aos hosts de URLS.'
    );
  }

  return {
    hostPermissions: allowedHosts.map((host) => `https://${host}/*`)
  };
}

function createViteConfig(_env: ConfigEnv): WxtViteConfig {
  return {
    esbuild: {
      legalComments: 'none'
    },
    build: {
      target: 'es2020',
      minify: 'terser' as const,
      reportCompressedSize: false,
      terserOptions: {
        compress: {
          passes: 2,
          drop_debugger: true,
          pure_getters: true
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false,
          ascii_only: true
        }
      }
    }
  };
}

const version = buildVersion();
const runtimeValidation = validateRuntimeDefaults();

export default defineConfig({
  srcDir: 'src',
  manifestVersion: 3,
  targetBrowsers: ['chrome', 'edge', 'firefox'],
  vite: createViteConfig,
  modules: ['@wxt-dev/module-vue'],
  zip: {
    artifactTemplate: 'correios-wizard-{{browser}}.zip',
    sourcesTemplate: 'correios-wizard-{{browser}}-sources.zip'
  },
  manifest: ({ browser }) => {
    const manifest = {
      name: 'Correios Wizard',
      version,
      description:
        'Conjunto de ferramentas internas para otimizar tarefas operacionais nos Correios',
      author: 'Henrique Moreira',
      homepage_url: 'https://github.com/henrique-coder/correios-wizard',
      icons: {
        16: '/icons/icon16.png',
        32: '/icons/icon32.png',
        48: '/icons/icon48.png',
        128: '/icons/icon128.png'
      },
      action: {
        default_title: 'Correios Wizard',
        default_icon: {
          16: '/icons/icon16.png',
          32: '/icons/icon32.png',
          48: '/icons/icon48.png'
        }
      },
      permissions: [] as string[],
      host_permissions: runtimeValidation.hostPermissions,
      web_accessible_resources: [
        {
          resources: ['injected.js'],
          matches: ['https://*.correios.com.br/*']
        }
      ]
    };

    if (browser === 'chrome' || browser === 'edge') {
      return {
        ...manifest,
        minimum_chrome_version: '102'
      };
    }

    if (browser === 'firefox') {
      return {
        ...manifest,
        browser_specific_settings: {
          gecko: {
            id: '@correios-wizard.henriquecoder',
            strict_min_version: '121.0',
            update_url:
              'https://github.com/henrique-coder/correios-wizard/releases/latest/download/firefox_updates.json'
          }
        }
      };
    }

    return manifest;
  }
});
