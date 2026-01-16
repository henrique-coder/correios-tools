import { STRINGS } from "../../src/constants.js";

const DEFAULT_STATE = {
  code: STRINGS.EMPTY,
  status: STRINGS.WAIT,
  mode: STRINGS.LOADING,
  district: STRINGS.EMPTY,
  domDist: null,
  initialDist: null,
  pendingDist: null,
  date: STRINGS.DATE_EMPTY,
  exception: STRINGS.EMPTY,
  validation: STRINGS.EMPTY,
  lastEvent: STRINGS.EMPTY,
  address: {
    street: STRINGS.EMPTY,
    number: STRINGS.EMPTY,
    complement: STRINGS.EMPTY,
    neighborhood: STRINGS.EMPTY,
    city: STRINGS.EMPTY,
    state: STRINGS.EMPTY,
    zipCode: STRINGS.EMPTY,
  },
  services: {
    ar: "N",
    mp: "N",
    dd: "N",
  },
  contact: {
    phone: STRINGS.EMPTY,
    email: STRINGS.EMPTY,
  },
  operation: {
    list: STRINGS.EMPTY,
    user: STRINGS.EMPTY,
    postman: STRINGS.EMPTY,
    station: STRINGS.EMPTY,
    timestamp: STRINGS.EMPTY,
    order: STRINGS.EMPTY,
    side: STRINGS.EMPTY,
  },
};

let state = { ...DEFAULT_STATE };
let lastErrorValue = null;
let onStateChangeCallbacks = [];

export const InductionState = {
  get() {
    return { ...state };
  },

  getField(path) {
    const keys = path.split(".");
    let value = state;
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  },

  set(updates) {
    const oldState = { ...state };
    state = { ...state, ...updates };
    this.notifyChange(oldState, state);
  },

  setField(path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    let target = state;

    for (const key of keys) {
      if (target && typeof target === "object" && key in target) {
        target = target[key];
      } else {
        return false;
      }
    }

    if (target && typeof target === "object") {
      const oldState = { ...state };
      target[lastKey] = value;
      this.notifyChange(oldState, state);
      return true;
    }
    return false;
  },

  reset(status = STRINGS.WAIT) {
    const oldState = { ...state };
    state = {
      ...DEFAULT_STATE,
      status,
      address: { ...DEFAULT_STATE.address },
      services: { ...DEFAULT_STATE.services },
      contact: { ...DEFAULT_STATE.contact },
      operation: { ...DEFAULT_STATE.operation },
    };
    this.notifyChange(oldState, state);
  },

  resetForNewObject(code, status) {
    this.reset(status);
    state.code = code;
  },

  onChange(callback) {
    onStateChangeCallbacks.push(callback);
    return () => {
      const index = onStateChangeCallbacks.indexOf(callback);
      if (index > -1) onStateChangeCallbacks.splice(index, 1);
    };
  },

  notifyChange(oldState, newState) {
    onStateChangeCallbacks.forEach((callback) => {
      try {
        callback(newState, oldState);
      } catch {
        // Callback error
      }
    });
  },

  getLastErrorValue() {
    return lastErrorValue;
  },

  setLastErrorValue(value) {
    lastErrorValue = value;
  },

  getVisualDistrict() {
    let dist = state.domDist && state.domDist !== "" ? state.domDist : state.district;
    if (dist) dist = dist.trim();

    if (
      state.initialDist &&
      state.initialDist !== STRINGS.EMPTY &&
      dist &&
      dist !== STRINGS.EMPTY &&
      dist !== state.initialDist
    ) {
      return {
        type: "changed",
        old: state.initialDist,
        new: dist,
      };
    }

    return {
      type: "single",
      value: dist || STRINGS.EMPTY,
    };
  },

  getFullAddress() {
    const addr = state.address;
    if (addr.street === STRINGS.EMPTY) return null;

    const complement = addr.complement ? ` - ${addr.complement}` : "";
    return `${addr.street}, ${addr.number}${complement} - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
  },
};
