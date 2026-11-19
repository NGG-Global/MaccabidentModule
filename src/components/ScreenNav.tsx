import { createContext, useContext, useEffect, useLayoutEffect, useRef, type Dispatch, type SetStateAction } from 'react';

/**
 * What the footer does on the current screen. A screen with several steps
 * (watch, question, explanation) moves through them with the same footer
 * button the learner uses between screens, so "continue" is always in one place.
 */
export interface ScreenNav {
  /** Screen that set this; the footer ignores a value left by a screen that is leaving. */
  owner: string;
  /** Forward step inside the screen. Absent: the footer moves to the next screen. */
  next?: { label: string; enabled: boolean; run: () => void };
  /** Back step inside the screen. Absent: the footer returns to the previous screen. */
  back?: () => void;
  /** One line under the buttons' row: what to do now, or that this part is done. */
  hint?: string;
  /** The current step is finished: the forward button draws attention to itself. */
  ready?: boolean;
  /** Hides the footer, e.g. on the opening cover where "Start" is the only action. */
  hidden?: boolean;
}

type NavInput = Omit<ScreenNav, 'owner'>;

const SetNavContext = createContext<Dispatch<SetStateAction<ScreenNav | null>> | null>(null);
export const ScreenNavProvider = SetNavContext.Provider;

/** Publishes a screen's footer behaviour. Handlers always call the latest render's functions. */
export function useScreenNav(owner: string, nav: NavInput) {
  const set = useContext(SetNavContext);
  const latest = useRef(nav);
  useLayoutEffect(() => {
    latest.current = nav;
  });
  const hasNext = nav.next !== undefined;
  const hasBack = nav.back !== undefined;
  const { hint, ready, hidden } = nav;
  const label = nav.next?.label;
  const enabled = nav.next?.enabled;
  useEffect(() => {
    if (!set) return;
    set({
      owner,
      hint,
      ready,
      hidden,
      next: hasNext ? { label: label ?? '', enabled: enabled ?? false, run: () => latest.current.next?.run() } : undefined,
      back: hasBack ? () => latest.current.back?.() : undefined,
    });
  }, [set, owner, hint, ready, hidden, hasNext, hasBack, label, enabled]);
  useEffect(() => () => set?.((current) => (current?.owner === owner ? null : current)), [set, owner]);
}
