import { CONFIG } from "../src/config.js";

const PREFIX = "[Correios Tools]";

const LEVELS = {
  debug: { priority: 0, style: "color: #888; font-style: italic;" },
  info: { priority: 1, style: "color: #3b82f6; font-weight: bold;" },
  warn: { priority: 2, style: "color: #f59e0b; font-weight: bold;" },
  error: { priority: 3, style: "color: #dc2626; font-weight: bold;" },
  success: { priority: 4, style: "color: #10b981; font-weight: bold;" },
};

function log(level, ...args) {
  if (!CONFIG.features.debugMode && level === "debug") return;

  const levelConfig = LEVELS[level] || LEVELS.info;
  const timestamp = new Date().toISOString().slice(11, 19);

  console.log(`%c${PREFIX} [${timestamp}]`, levelConfig.style, ...args);
}

export const Logger = {
  debug: (...args) => log("debug", ...args),
  info: (...args) => log("info", ...args),
  warn: (...args) => log("warn", ...args),
  error: (...args) => log("error", ...args),
  success: (...args) => log("success", ...args),

  group(label) {
    if (!CONFIG.features.debugMode) return;
    console.group(`${PREFIX} ${label}`);
  },

  groupEnd() {
    if (!CONFIG.features.debugMode) return;
    console.groupEnd();
  },

  table(data) {
    if (!CONFIG.features.debugMode) return;
    console.table(data);
  },

  time(label) {
    if (!CONFIG.features.debugMode) return;
    console.time(`${PREFIX} ${label}`);
  },

  timeEnd(label) {
    if (!CONFIG.features.debugMode) return;
    console.timeEnd(`${PREFIX} ${label}`);
  },
};
