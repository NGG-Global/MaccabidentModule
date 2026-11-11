import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { content } from './content';
import { TrackContext, type TrackFn } from './analytics/TrackContext';
import type { Tracker } from './analytics/tracker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Shell } from './components/Shell';
import { createFlow } from './engine/flow';
import type { ProgressStore } from './engine/progress';
import { NarrationProvider } from './narration/NarrationProvider';
import { ScreenRenderer } from './screens/ScreenRenderer';

export const flow = createFlow(content);

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

  const track = useCallback<TrackFn>(
    (eventName, payload, extra) => {
      tracker.track(eventName, payload, { role: state.role, screenId: state.currentScreenId, ...extra });
    },
    [tracker, state.role, state.currentScreenId],
  );

  useEffect(() => store.save(state), [store, state]);

  // The refs below make each event fire once per real occurrence, not once per render or effect re-run.
  const resumeTracked = useRef(false);
  useEffect(() => {
    if (!boot.resumed || resumeTracked.current) return;
    resumeTracked.current = true;
    track('course_resumed', { resumedScreenId: boot.initial.currentScreenId });
  }, [boot, track]);

  const lastViewed = useRef<string | null>(null);
  useEffect(() => {
    if (lastViewed.current === screen.screenId) return;
    lastViewed.current = screen.screenId;
    track('screen_viewed', { interactionType: screen.interactionType });
  }, [screen, track]);

  const completionSeen = useRef(boot.initial.completedAt);
  useEffect(() => {
    if (state.completedAt === completionSeen.current) return;
    completionSeen.current = state.completedAt;
    if (state.completedAt) track('course_completed', { rule: content.course.completionRule });
  }, [state.completedAt, track]);

  const trackRef = useRef(track);
  useEffect(() => {
    trackRef.current = track;
  }, [track]);
  const reportError = useCallback((kind: 'error' | 'unhandledrejection' | 'render', message: string) => {
    trackRef.current('client_error', { kind, message: message.slice(0, 200) });
  }, []);
  useEffect(() => {
    const onError = (event: ErrorEvent) => reportError('error', event.message);
    const onRejection = (event: PromiseRejectionEvent) => reportError('unhandledrejection', String(event.reason));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [reportError]);

  const next = () => {
    if (!flow.canAdvance(state)) return;
    // Reported on leaving the screen, so changing one's mind before continuing yields a single event.
    if (screen.interactionType === 'roleSelect' && state.role) track('role_selected', { role: state.role });
    dispatch({ type: 'NEXT', at: new Date().toISOString() });
  };

  const hasNext = state.currentScreenId !== content.course.flow.summary;

  return (
    <ErrorBoundary onError={(message) => reportError('render', message)}>
      <TrackContext.Provider value={track}>
        <NarrationProvider onMediaEvent={(name, audioId) => track(name, { mediaId: audioId, kind: 'audio' })}>
          <Shell
            screen={screen}
            progress={flow.progress(state)}
            canGoBack={flow.previousOf(state) !== null}
            canGoNext={hasNext ? flow.canAdvance(state) : null}
            onBack={() => dispatch({ type: 'BACK' })}
            onNext={next}
          >
            <ScreenRenderer screen={screen} state={state} dispatch={dispatch} />
          </Shell>
        </NarrationProvider>
      </TrackContext.Provider>
    </ErrorBoundary>
  );
}
