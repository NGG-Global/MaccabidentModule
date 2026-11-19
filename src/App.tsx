import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { content, ui } from './content';
import { TrackContext, type TrackFn } from './analytics/TrackContext';
import type { Tracker } from './analytics/tracker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Icon } from './components/Icon';
import { ScreenNavProvider, type ScreenNav } from './components/ScreenNav';
import { Shell } from './components/Shell';
import { createFlow } from './engine/flow';
import type { ProgressStore } from './engine/progress';
import { ScreenRenderer } from './screens/ScreenRenderer';
import { StageProvider } from './stage/StageProvider';
import { MediaPrefsProvider } from './stage/prefs';

export const flow = createFlow(content);

/** Keyboard and screen-reader users land on the new screen's heading once it has entered. */
const focusNewHeading = () => document.querySelector<HTMLElement>('#main h1')?.focus({ preventScroll: true });

interface Props {
  store: ProgressStore;
  tracker: Tracker;
}

export function App({ store, tracker }: Props) {
  const [boot] = useState(() => {
    const restored = store.load();
    return { initial: restored ?? flow.initialState(), resumed: restored?.startedAt != null };
  });
  const [state, dispatch] = useReducer(flow.reducer, boot.initial);
  const screen = flow.screenOf(state.currentScreenId);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [nav, setNav] = useState<ScreenNav | null>(null);
  // A value left by a screen that is still animating out does not apply to the new one.
  const screenNav = nav?.owner === screen.screenId ? nav : null;
  const [resumeNotice, setResumeNotice] = useState(boot.resumed && boot.initial.currentScreenId !== content.course.flow.start);
  useEffect(() => {
    if (!resumeNotice) return;
    const timer = setTimeout(() => setResumeNotice(false), 7000);
    return () => clearTimeout(timer);
  }, [resumeNotice]);

  const track = useCallback<TrackFn>(
    (eventName, payload, extra) => {
      tracker.track(eventName, payload, { role: state.role, screenId: state.currentScreenId, ...extra });
    },
    [tracker, state.role, state.currentScreenId],
  );

  useEffect(() => store.save(state), [store, state]);

  // Refs make each event fire once per real occurrence, not once per render or effect re-run.
  const lastViewed = useRef<string | null>(null);
  useEffect(() => {
    if (lastViewed.current === screen.screenId) return;
    const resumed = lastViewed.current === null && boot.resumed;
    lastViewed.current = screen.screenId;
    track('screen_viewed', { interactionType: screen.interactionType, resumed });
  }, [screen, track, boot.resumed]);

  const completionSeen = useRef(boot.initial.completedAt);
  useEffect(() => {
    if (state.completedAt === completionSeen.current) return;
    completionSeen.current = state.completedAt;
    if (state.completedAt) track('prototype_completed', { rule: content.course.completionRule });
  }, [state.completedAt, track]);

  const next = () => {
    setResumeNotice(false);
    if (screenNav?.next) {
      if (screenNav.next.enabled) screenNav.next.run();
      return;
    }
    if (!flow.canAdvance(state)) return;
    // Reported on leaving the screen, so changing one's mind before continuing yields a single event.
    if (screen.interactionType === 'roleSelect' && state.role) track('role_selected', { role: state.role });
    setDirection(1);
    dispatch({ type: 'NEXT' });
  };
  const back = () => {
    setResumeNotice(false);
    if (screenNav?.back) {
      screenNav.back();
      return;
    }
    setDirection(-1);
    dispatch({ type: 'BACK' });
  };
  const restart = () => {
    setResumeNotice(false);
    store.clear();
    setDirection(-1);
    lastViewed.current = null;
    dispatch({ type: 'RESET' });
  };

  const isEnd = state.currentScreenId === content.course.flow.end;
  const done = flow.isScreenComplete(state, screen.screenId);
  const canGoNext = screenNav?.next ? screenNav.next.enabled : isEnd ? null : flow.canAdvance(state);
  const canGoBack = Boolean(screenNav?.back) || flow.previousOf(state) !== null;
  const hint = screenNav?.hint ?? (canGoNext === false ? ui.gateHint : undefined);

  return (
    <ErrorBoundary onError={() => undefined}>
      <MotionConfig reducedMotion="user">
        <TrackContext.Provider value={track}>
          <MediaPrefsProvider>
            <ScreenNavProvider value={setNav}>
            <Shell
              screen={screen}
              chapters={flow.chapters(state)}
              canGoBack={canGoBack}
              canGoNext={canGoNext}
              nextLabel={screenNav?.next?.label ?? ui.next}
              hint={hint}
              ready={Boolean(screenNav?.ready)}
              hideFooter={Boolean(screenNav?.hidden)}
              onBack={back}
              onNext={next}
              onRestart={restart}
              notice={
                resumeNotice && (
                  <div role="status" className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center px-4" data-testid="resume-notice">
                    <p className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-1.5 ps-4 pe-1.5 text-sm text-white shadow-lg">
                      {ui.resumeNote}
                      <button type="button" onClick={() => setResumeNotice(false)} className="grid size-8 place-items-center rounded-full hover:bg-white/15" aria-label={ui.close}>
                        <Icon name="close" className="size-4" />
                      </button>
                    </p>
                  </div>
                )
              }
            >
              <AnimatePresence mode="wait" initial={false} custom={direction} onExitComplete={focusNewHeading}>
                <motion.div
                  key={screen.screenId}
                  custom={direction}
                  initial={{ opacity: 0, x: -28 * direction }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 28 * direction }}
                  transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                  className="h-full"
                >
                  <StageProvider screen={screen}>
                    <ScreenRenderer screen={screen} state={state} dispatch={dispatch} done={done} />
                  </StageProvider>
                </motion.div>
              </AnimatePresence>
            </Shell>
            </ScreenNavProvider>
          </MediaPrefsProvider>
        </TrackContext.Provider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
