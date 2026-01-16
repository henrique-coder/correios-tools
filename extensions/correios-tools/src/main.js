import { URL_PATTERNS } from "./constants.js";

const ROUTES = {
  [URL_PATTERNS.INDUCTION]: () => import("../modules/induction/index.js"),
  [URL_PATTERNS.LOEC_SUSPENSA]: () => import("../modules/loec-hud/index.js"),
};

export function initializeModules() {
  const path = window.location.pathname;

  for (const [pattern, loader] of Object.entries(ROUTES)) {
    if (path.includes(pattern)) {
      loader()
        .then((module) => {
          if (module && typeof module.init === "function") {
            module.init();
          }
        })
        .catch(() => {
          // Module loading error
        });
    }
  }
}

export function isValidPage() {
  const path = window.location.pathname;
  return Object.keys(ROUTES).some((pattern) => path.includes(pattern));
}
