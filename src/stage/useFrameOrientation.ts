import { useSyncExternalStore } from 'react';

const query = '(max-width: 640px)';
const subscribe = (cb: () => void) => {
  const mql = window.matchMedia?.(query);
  mql?.addEventListener?.('change', cb);
  return () => mql?.removeEventListener?.('change', cb);
};

/** Compositions render portrait (4:5) on narrow screens and wide (16:9) elsewhere. */
export function useFrameOrientation(): 'portrait' | 'landscape' {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia?.(query).matches ? 'portrait' : 'landscape'),
    () => 'landscape',
  );
}

export function usePrefersReducedMotion(): boolean {
  const q = '(prefers-reduced-motion: reduce)';
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia?.(q);
      mql?.addEventListener?.('change', cb);
      return () => mql?.removeEventListener?.('change', cb);
    },
    () => Boolean(window.matchMedia?.(q).matches),
    () => false,
  );
}
