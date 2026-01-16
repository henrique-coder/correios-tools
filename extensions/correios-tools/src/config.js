export const CONFIG = {
  features: {
    panorama360Enabled: true,
    loecDashboardEnabled: true,
    debugMode: false,
  },

  panorama: {
    defaultHfov: 100,
    defaultPitch: 0,
    defaultYaw: 0,
    backgroundColor: [240, 240, 240],
    showControls: true,
    mouseZoom: true,
    autoLoad: true,
    compass: false,
  },

  ui: {
    cardWidth: 360,
    snapAnimationDuration: 300,
  },
};

export function getConfig(path) {
  const keys = path.split(".");
  let value = CONFIG;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
}

export function setConfig(path, newValue) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  let target = CONFIG;

  for (const key of keys) {
    if (target && typeof target === "object" && key in target) {
      target = target[key];
    } else {
      return false;
    }
  }

  if (target && typeof target === "object") {
    target[lastKey] = newValue;
    return true;
  }

  return false;
}
