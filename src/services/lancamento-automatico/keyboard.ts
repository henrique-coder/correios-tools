import type { DispatchState } from './state.js';
import { COMMANDS } from './commands.js';

const TRIGGER_KEY = '#';
const TIMEOUT_MS = 1000;

export function registerKeyboardCommands(stateRef: {
  current: DispatchState;
}): void {
  let active = false;
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  const reset = () => {
    active = false;
    buffer = '';
  };

  const execute = () => {
    const cmd = buffer.toUpperCase();
    if (COMMANDS[cmd]) COMMANDS[cmd](stateRef.current, null);
    buffer = '';
    if (timer) clearTimeout(timer);
    timer = setTimeout(reset, 200);
  };

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === TRIGGER_KEY) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (active) {
          execute();
          return;
        }
        active = true;
        buffer = '';
        if (timer) clearTimeout(timer);
        timer = setTimeout(reset, TIMEOUT_MS);
        return;
      }

      if (!active) return;
      e.preventDefault();
      e.stopImmediatePropagation();

      if (e.key === 'Enter') {
        execute();
        return;
      }
      if (e.key.length === 1) {
        buffer += e.key;
        if (timer) clearTimeout(timer);
        timer = setTimeout(reset, TIMEOUT_MS);
      }
    },
    true
  );
}
