import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { content } from './content';
import { TrackContext, type TrackFn } from './analytics/TrackContext';
import type { Tracker } from './analytics/tracker';
import { ErrorBoundary } from './components/ErrorBoundary';
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
    if (!flow.canAdvance(state)) return;
    // Reported on leaving the screen, so changing one's mind before continuing yields a single event.
    if (screen.interactionType === 'roleSelect' && state.role) track('role_selected', { role: state.role });
    setDirection(1);
    dispatch({ type: 'NEXT' });
  };
  const back = () => {
    setDirection(-1);
    dispatch({ type: 'BACK' });
  };
  const restart = () => {
    store.clear();
    setDirection(-1);
    lastViewed.current = null;
    dispatch({ type: 'RESET' });
  };

  const isEnd = state.currentScreenId === content.course.flow.end;
  const done = flow.isScreenComplete(state, screen.screenId);

  return (
    <ErrorBoundary onError={() => undefined}>
      <MotionConfig reducedMotion="user">
        <TrackContext.Provider value={track}>
          <MediaPrefsProvider>
            <Shell
              screen={screen}
              chapters={flow.chapters(state)}
              canGoBack={flow.previousOf(state) !== null}
              canGoNext={isEnd ? null : flow.canAdvance(state)}
              onBack={back}
              onNext={next}
              onRestart={restart}
            >
              <AnimatePresence mode="wait" initial={false} custom={direction} onExitComplete={focusNewHeading}>
                <motion.div
                  key={screen.screenId}
                  custom={direction}
                  initial={{ opacity: 0, x: -28 * direction }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 28 * direction }}
                  transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <StageProvider screen={screen}>
                    <ScreenRenderer screen={screen} state={state} dispatch={dispatch} done={done} />
                  </StageProvider>
                </motion.div>
              </AnimatePresence>
            </Shell>
          </MediaPrefsProvider>
        </TrackContext.Provider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
