import { useMemo, useSyncExternalStore } from 'react';
import { cueAt, cuesFor } from './captions';
import { useMediaPrefs } from './prefs';
import { useStage } from './StageProvider';

/** Live caption for the active beat, timed by the playback clock. */
export function CaptionLine({ overlay = false, bar = false }: { overlay?: boolean; bar?: boolean }) {
  const stage = useStage();
  const { captions } = useMediaPrefs();
  const beat = stage.state.status === 'empty' ? undefined : stage.state.beats[stage.state.index];
  const cues = useMemo(() => cuesFor(beat), [beat]);
  const text = useSyncExternalStore(
    stage.clock.subscribe,
    () => {
      const snap = stage.clock.get();
      return snap.token === stage.token ? (cueAt(cues, snap.time)?.text ?? '') : '';
    },
    () => '',
  );
  if (!captions || !cues.length || stage.state.status === 'ready') return null;
  if (bar) {
    // Under a composition: a fixed-height strip, so the frame does not jump as lines change.
    return (
      <div aria-hidden="true" data-testid="caption" className="flex min-h-14 items-center justify-center bg-ink px-4 py-2 text-center text-base leading-snug text-white/95 sm:text-lg">
        {text}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      data-testid="caption"
      className={
        overlay
          ? 'pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-5'
          : 'pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-6'
      }
    >
      {text && (
        <p className="max-w-[90%] rounded-md bg-ink/85 px-3 py-1.5 text-center text-base leading-snug text-white sm:text-lg md:text-xl">{text}</p>
      )}
    </div>
  );
}
