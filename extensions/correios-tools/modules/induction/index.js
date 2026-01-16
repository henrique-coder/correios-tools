import { NetworkInterceptor } from "../../lib/network.js";
import { URL_PATTERNS } from "../../src/constants.js";
import { handleApiResponse, handleSaveRequest } from "./handlers.js";
import { initUI } from "./ui.js";

export function init() {
  NetworkInterceptor.init();

  NetworkInterceptor.on(URL_PATTERNS.VALIDATE_ACTION, handleApiResponse);
  NetworkInterceptor.on(URL_PATTERNS.ADDRESS_CONTROLLER, handleApiResponse);
  NetworkInterceptor.on(URL_PATTERNS.DISTRICT_CONTROLLER, handleApiResponse);
  NetworkInterceptor.on("acao=pesquisarloecobjeto", handleApiResponse);
  NetworkInterceptor.on(URL_PATTERNS.LIST_ACTION, handleApiResponse);
  NetworkInterceptor.on(URL_PATTERNS.SAVE_ACTION, handleApiResponse);
  NetworkInterceptor.on(URL_PATTERNS.DELETE_ACTION, handleApiResponse);

  NetworkInterceptor.on(URL_PATTERNS.SAVE_ACTION, (url, data, options) => {
    if (options.type === "request") {
      handleSaveRequest(url, data);
    }
  });

  NetworkInterceptor.on("listar-impressoras-disponiveis", () => {
    autoDismissPrintDialog();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
}

function autoDismissPrintDialog() {
  let attempts = 0;
  const interval = setInterval(() => {
    const button = document.getElementById("btnImprimirEtiquetaNao");
    if (button) {
      button.click();
      clearInterval(interval);
      autoDismissAlert();
      return;
    }
    if (++attempts >= 100) {
      clearInterval(interval);
    }
  }, 50);
}

function autoDismissAlert() {
  let attempts = 0;
  const interval = setInterval(() => {
    const okButton = document.querySelector("#alerta.aberto .act a");
    if (okButton && okButton.innerText === "OK") {
      okButton.click();
      clearInterval(interval);
      return;
    }
    if (++attempts >= 100) {
      clearInterval(interval);
    }
  }, 50);
}
