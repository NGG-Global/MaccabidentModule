import { useEffect, useRef, useState } from 'react';

/**
 * The current step of a multi-step screen. After a change of step, focus moves
 * to the new step's heading (marked data-step-heading), so keyboard and
 * screen-reader users land in the new content rather than on a button that has gone.
 */
export function useSteps<T extends string>(initial: T) {
  const [step, setStep] = useState<T>(initial);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    requestAnimationFrame(() => document.querySelector<HTMLElement>('#main [data-step-heading]')?.focus({ preventScroll: true }));
  }, [step]);
  return [step, setStep] as const;
}
