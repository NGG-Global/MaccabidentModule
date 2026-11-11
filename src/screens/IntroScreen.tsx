import { ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { useNarration, useNarrationClip } from '../narration/NarrationProvider';
import type { ScreenProps } from './types';

/**
 * Opening screen. "Start" is the learner's first interaction: only after it
 * may narration play, which keeps the course free of sound on load.
 */
export function IntroScreen({ screen, state, dispatch }: ScreenProps) {
  const track = useTrack();
  const { unlock } = useNarration();
  const started = state.startedAt !== null;
  useNarrationClip(started ? screen.narration : null);

  if (started) return null;

  const start = () => {
    unlock();
    dispatch({ type: 'START', at: new Date().toISOString() });
    track('course_started', {});
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">{ui.startHint}</p>
      <button
        type="button"
        onClick={start}
        className="min-h-12 rounded-lg bg-brand-600 px-8 text-lg font-semibold text-white hover:bg-brand-700"
      >
        {ui.start}
      </button>
    </div>
  );
}
