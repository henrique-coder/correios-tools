import { TIMEOUTS } from "../src/constants.js";

export function waitForElement(selector, maxAttempts = TIMEOUTS.DOM_OBSERVER_MAX_ATTEMPTS) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
        return;
      }
      if (++attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(null);
      }
    }, TIMEOUTS.DOM_OBSERVER_INTERVAL);
  });
}

export function observeElement(element, callback, options = {}) {
  const config = {
    childList: true,
    subtree: true,
    characterData: true,
    ...options,
  };

  const observer = new MutationObserver(callback);
  observer.observe(element, config);

  return observer;
}

export function injectAfter(targetSelector, content) {
  return new Promise((resolve) => {
    const tryInject = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        if (typeof content === "string") {
          target.insertAdjacentHTML("afterend", content);
          resolve(target.nextElementSibling);
        } else if (content instanceof HTMLElement) {
          target.insertAdjacentElement("afterend", content);
          resolve(content);
        }
      } else {
        setTimeout(tryInject, TIMEOUTS.INJECT_TABLE_DELAY);
      }
    };
    tryInject();
  });
}

export function injectBefore(targetSelector, content) {
  return new Promise((resolve) => {
    const tryInject = () => {
      const target = document.querySelector(targetSelector);
      if (target && target.parentNode) {
        if (typeof content === "string") {
          target.insertAdjacentHTML("beforebegin", content);
          resolve(target.previousElementSibling);
        } else if (content instanceof HTMLElement) {
          target.parentNode.insertBefore(content, target);
          resolve(content);
        }
      } else {
        setTimeout(tryInject, TIMEOUTS.INJECT_TABLE_DELAY);
      }
    };
    tryInject();
  });
}

export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else if (key === "className") {
      element.className = value;
    } else if (key === "innerHTML") {
      element.innerHTML = value;
    } else if (key === "innerText") {
      element.innerText = value;
    } else if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  }

  return element;
}

export function applyStyles(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

export function removeElement(selectorOrElement) {
  const element =
    typeof selectorOrElement === "string"
      ? document.querySelector(selectorOrElement)
      : selectorOrElement;

  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
    return true;
  }
  return false;
}

export function injectStylesheet(id, css) {
  if (document.getElementById(id)) return false;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);

  return true;
}

export function loadExternalScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function loadExternalStylesheet(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}
