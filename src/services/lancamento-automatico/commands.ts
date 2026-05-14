import { DOM_IDS } from '../../shared/constants/dom-elements.js';
import type { DispatchState } from './state.js';

type CommandFn = (
  state: DispatchState,
  lastInducedValue: string | null
) => void;

export const COMMANDS: Record<string, CommandFn> = {
  'CT-INDUZIROBJETO': (state, _lastInducedValue) => {
    setAutoInductionGuard(4000);
    const btnInc = document.getElementById(
      DOM_IDS.INCLUDE_OBJECT_BUTTON
    ) as HTMLButtonElement | null;
    const txtObj = document.getElementById(
      DOM_IDS.OBJECT_INPUT
    ) as HTMLInputElement | null;

    if (!btnInc || btnInc.offsetParent === null) {
      txtObj?.focus();
      setAutoInductionGuard(1500);
      return;
    }

    if (document.activeElement) (document.activeElement as HTMLElement).blur();

    const modalA = document.getElementById(DOM_IDS.MODAL_A_BUTTON);
    const delay =
      modalA && modalA.offsetParent !== null ? (modalA.click(), 300) : 0;

    setTimeout(() => {
      let tries = 0;
      const poll = setInterval(() => {
        const txtNum = document.getElementById(
          DOM_IDS.ADDRESS_NUMBER_INPUT
        ) as HTMLInputElement | null;
        if (txtNum) {
          clearInterval(poll);
          setTimeout(() => {
            const v = txtNum.value.trim().toUpperCase();
            const isInvalid =
              v === '' || v === 'N/A' || v === 'S/A' || v === 'S/N';

            if (isInvalid && state.code !== '--') {
              txtNum.focus();
              txtNum.select();
              setAutoInductionGuard(3000);
              setTimeout(clearAutoInductionGuard, 3000);
              return;
            }

            txtNum.blur();
            if (document.activeElement)
              (document.activeElement as HTMLElement).blur();

            setTimeout(() => {
              if (!btnInc) return;
              setAutoInductionGuard(3000);
              btnInc.click();
              let waitTries = 0;
              const waitPoll = setInterval(() => {
                if (txtObj && txtObj.value === '') {
                  clearInterval(waitPoll);
                  txtObj.focus();
                  setTimeout(clearAutoInductionGuard, 1500);
                }
                if (++waitTries > 100) clearInterval(waitPoll);
              }, 100);
            }, 200);
          }, 200);
        }
        if (++tries > 60) clearInterval(poll);
      }, 50);
    }, delay);
  }
};

let autoInductionUntil = 0;

export function setAutoInductionGuard(durationMs: number): void {
  autoInductionUntil = Math.max(autoInductionUntil, Date.now() + durationMs);
}

export function clearAutoInductionGuard(): void {
  autoInductionUntil = 0;
}

export function isAutoInductionGuardActive(): boolean {
  return Date.now() < autoInductionUntil;
}
