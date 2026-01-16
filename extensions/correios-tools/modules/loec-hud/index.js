import { NetworkInterceptor } from "../../lib/network.js";
import { TIMEOUTS } from "../../src/constants.js";
import { initStyles, renderDashboard } from "./dashboard.js";
import { calculateMetrics } from "./metrics.js";

export function init() {
  NetworkInterceptor.init();

  NetworkInterceptor.on("lancamentoController.php?acao=listar", handleLoecData);

  initStyles();
}

function handleLoecData(url, data) {
  if (!url.includes("lancamentoController.php?acao=listar")) return;

  try {
    const parsedData = typeof data === "string" ? JSON.parse(data) : data;

    if (Array.isArray(parsedData)) {
      const metrics = calculateMetrics(parsedData);
      setTimeout(() => renderDashboard(metrics), TIMEOUTS.DASHBOARD_RENDER_DELAY);
    }
  } catch {
    // Invalid data format
  }
}
