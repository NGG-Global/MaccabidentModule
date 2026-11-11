import { useMemo, useSyncExternalStore } from 'react';
import { ui } from '../content';
import { cueAt, cuesFor } from '../stage/captions';
import { useMediaPrefs } from '../stage/prefs';
import { useStage } from '../stage/StageProvider';

/**
 * For narration without a picture: a quiet panel that shows the spoken line
 * as it is said (when captions are on), with a play button before the first play.
 */
export function NarrationPanel() {
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
  const playing = stage.state.status === 'playing';
  return (
    <div className="relative overflow-hidden rounded-xl bg-ink p-6 text-white sm:p-8" aria-hidden={!captions}>
      <div className="flex items-center gap-3 text-sm text-mist">
        <span className="flex h-4 items-end gap-0.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`w-1 rounded-full bg-violet ${playing ? 'animate-pulse' : ''}`} style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 120}ms` }} />
          ))}
        </span>
        {ui.stage.narration}
      </div>
      <p className="mt-4 min-h-[4.5rem] font-display text-2xl leading-snug sm:text-3xl" data-testid="narration-line">
        {captions ? text : ''}
      </p>
      {stage.state.status === 'ready' && (
        <button type="button" onClick={stage.play} data-testid="stage-play" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-5 font-semibold text-navy">
          <span aria-hidden>▶</span>
          {ui.stage.play}
        </button>
      )}
    </div>
  );
}
