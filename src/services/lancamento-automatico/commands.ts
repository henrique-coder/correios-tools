import { DOM_IDS } from '../../shared/constants/dom-elements.js';
import type { DispatchState } from './state.js';

type CommandFn = (
  state: DispatchState,
  lastInducedValue: string | null
) => void;

export const COMMANDS: Record<string, CommandFn> = {
  'CT-INDUZIROBJETO': (state, _lastInducedValue) => {
    const btnInc = document.getElementById(
      DOM_IDS.INCLUDE_OBJECT_BUTTON
    ) as HTMLButtonElement | null;
    const txtObj = document.getElementById(
      DOM_IDS.OBJECT_INPUT
    ) as HTMLInputElement | null;

    if (!btnInc || btnInc.offsetParent === null) {
      txtObj?.focus();
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
              return;
            }

            txtNum.blur();
            if (document.activeElement)
              (document.activeElement as HTMLElement).blur();

            setTimeout(() => {
              if (!btnInc) return;
              btnInc.click();
              let waitTries = 0;
              const waitPoll = setInterval(() => {
                if (txtObj && txtObj.value === '') {
                  clearInterval(waitPoll);
                  txtObj.focus();
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
