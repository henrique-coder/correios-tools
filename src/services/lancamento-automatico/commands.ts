import { DOM_IDS } from '../../shared/constants/dom-elements.js';
import type { DispatchState } from './state.js';
import { waitForElement } from '../../shared/utils/dom.js';

type CommandFn = (
  state: DispatchState,
  lastInducedValue: string | null
) => void;

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

    setTimeout(async () => {
      try {
        const txtNum = await waitForElement<HTMLInputElement>(
          `#${DOM_IDS.ADDRESS_NUMBER_INPUT}`,
          100,
          30
        );

        await new Promise((resolve) => setTimeout(resolve, 200));

        txtNum.blur();
        if (document.activeElement) {
          (document.activeElement as HTMLElement).blur();
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        if (!btnInc) return;
        setAutoInductionGuard(3000);
        btnInc.click();

        let observer: MutationObserver | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const cleanupAndFocus = () => {
          if (observer) {
            observer.disconnect();
            observer = null;
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          txtObj?.focus();
          setTimeout(clearAutoInductionGuard, 1500);
        };

        observer = new MutationObserver(() => {
          if (txtObj && txtObj.value === '') {
            cleanupAndFocus();
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });

        timeoutId = setTimeout(() => {
          cleanupAndFocus();
        }, 10000);
      } catch {}
    }, delay);
  }
};
