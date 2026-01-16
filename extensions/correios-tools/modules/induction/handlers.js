import { STRINGS, URL_PATTERNS } from "../../src/constants.js";
import { InductionState } from "./state.js";

export function handleApiResponse(url, data) {
  const urlLower = url.toLowerCase();

  if (shouldResetState(urlLower, data)) {
    const code = extractObjectCode(url);
    if (code) {
      InductionState.resetForNewObject(code, STRINGS.WAIT);
    }
  }

  if (urlLower.includes(URL_PATTERNS.VALIDATE_ACTION)) {
    handleValidation(data);
  } else if (urlLower.includes(URL_PATTERNS.ADDRESS_CONTROLLER)) {
    handleAddress(data);
  } else if (urlLower.includes(URL_PATTERNS.DISTRICT_CONTROLLER)) {
    handleDistrict(data);
  } else if (urlLower.includes("acao=pesquisarloecobjeto")) {
    handleLoecSearch(data);
  } else if (urlLower.includes(URL_PATTERNS.LIST_ACTION) && !urlLower.includes("loecobjeto")) {
    handleListUpdate(data);
  } else if (urlLower.includes(URL_PATTERNS.SAVE_ACTION)) {
    handleSave(data);
  } else if (urlLower.includes(URL_PATTERNS.DELETE_ACTION)) {
    handleDelete();
  }
}

export function handleSaveRequest(url, data) {
  if (data && data.distrito) {
    InductionState.setField("pendingDist", data.distrito);
  }
}

function shouldResetState(urlLower, data) {
  const code = extractObjectCodeFromUrl(urlLower);
  const currentCode = InductionState.getField("code");

  return (
    code &&
    code !== currentCode &&
    (urlLower.includes(URL_PATTERNS.VALIDATE_ACTION) ||
      urlLower.includes(URL_PATTERNS.SEARCH_ACTION))
  );
}

function extractObjectCode(url) {
  try {
    const urlObj = new URL(url, window.location.origin);
    return (
      urlObj.searchParams.get("codigo") ||
      urlObj.searchParams.get("id") ||
      urlObj.searchParams.get("objeto")
    );
  } catch {
    return null;
  }
}

function extractObjectCodeFromUrl(urlLower) {
  try {
    const url = new URL(urlLower, window.location.origin);
    return (
      url.searchParams.get("codigo") || url.searchParams.get("id") || url.searchParams.get("objeto")
    );
  } catch {
    return null;
  }
}

function handleValidation(data) {
  const state = InductionState.get();

  InductionState.set({
    validation: data.validacao || STRINGS.EMPTY,
    exception: data.excecao || STRINGS.EMPTY,
    lastEvent: data.ultimoEventoDescricao || STRINGS.EMPTY,
  });

  if (data.validacao) {
    const currentMode = state.mode;
    const currentStatus = state.status;

    InductionState.set({
      mode:
        currentMode !== STRINGS.SUCCESS && currentMode !== STRINGS.ERROR
          ? STRINGS.INFO
          : currentMode,
      status:
        currentStatus !== STRINGS.SUCCESS && currentStatus !== STRINGS.ERROR
          ? "PRONTO P/ INDUZIR"
          : currentStatus,
      date: data.previsaoEntrega?.data || STRINGS.DATE_EMPTY,
    });
  } else {
    InductionState.set({
      mode: STRINGS.ERROR,
      status: "NÃO INDUZIDO",
      date: STRINGS.DATE_EMPTY,
    });
  }
}

function handleAddress(data) {
  if (data.endereco) {
    InductionState.set({
      address: {
        street: data.endereco.logradouro || STRINGS.EMPTY,
        number: data.endereco.numeroLogradouro || STRINGS.EMPTY,
        complement: data.endereco.complementoLogradouro || STRINGS.EMPTY,
        neighborhood: data.endereco.bairro || STRINGS.EMPTY,
        city: data.endereco.municipio || STRINGS.EMPTY,
        state: data.endereco.uf || STRINGS.EMPTY,
        zipCode: data.endereco.cep || STRINGS.EMPTY,
      },
    });
  }

  if (data.servico) {
    InductionState.set({
      services: {
        ar: data.servico.ar || "N",
        mp: data.servico.mp || "N",
        dd: data.servico.dd || "N",
      },
    });
  }

  if (data.telefone) {
    InductionState.setField("contact.phone", `(${data.telefone.ddd}) ${data.telefone.numero}`);
  }

  if (data.email) {
    InductionState.setField("contact.email", data.email);
  }
}

function handleDistrict(data) {
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    const districtLabel = `${first.rotuloDistrito} ${first.areaDistrito || ""}`.trim();

    InductionState.set({
      district: districtLabel,
    });

    InductionState.setField("operation.order", first.ordemPercorrida);
    InductionState.setField("operation.side", first.lado);
  }
}

function handleLoecSearch(data) {
  if (data.id) {
    const districtLabel = `${data.numeroDistrito} ${data.distritoComplemento || ""}`.trim();

    InductionState.set({
      mode: STRINGS.SUCCESS,
      status: "JÁ INDUZIDO",
      initialDist: districtLabel,
      district: districtLabel,
      domDist: districtLabel,
    });

    InductionState.setField("operation.list", data.idLancamento);
    InductionState.setField("operation.user", data.carteiro?.nome || STRINGS.EMPTY);
    InductionState.setField("operation.postman", data.carteiro?.nome || STRINGS.EMPTY);
  }
}

function handleListUpdate(data) {
  const state = InductionState.get();

  if (Array.isArray(data) && state.operation.list) {
    const found = data.find((item) => item.idLancamento === state.operation.list);
    if (found && found.nomeCarteiro) {
      InductionState.setField("operation.postman", found.nomeCarteiro);
    }
  }
}

function handleSave(data) {
  if (data.idLancamento) {
    InductionState.set({
      mode: STRINGS.SUCCESS,
      status: "OBJETO INDUZIDO",
    });

    InductionState.setField("operation.list", data.numeroLista);
    InductionState.setField("operation.user", data.usuario);
    InductionState.setField("operation.station", data.estacao);
    InductionState.setField("operation.timestamp", data.carimbo);

    if (data.dataPrevista) {
      InductionState.setField("date", data.dataPrevista);
    }
  }

  const state = InductionState.get();
  if (state.pendingDist) {
    InductionState.set({
      district: state.pendingDist,
      initialDist: state.pendingDist,
      domDist: state.pendingDist,
      pendingDist: null,
    });
  }

  if (data.distrito) {
    InductionState.set({
      initialDist: data.distrito,
      domDist: data.distrito,
    });
  }
}

function handleDelete() {
  InductionState.set({
    mode: STRINGS.ERROR,
    status: "EXCLUÍDO",
    district: STRINGS.EMPTY,
    domDist: null,
    date: STRINGS.DATE_EMPTY,
    initialDist: null,
    pendingDist: null,
  });
}
