import { useMemo, useSyncExternalStore } from 'react';
import { ui } from '../content';
import { Icon } from '../components/Icon';
import { cueAt, cuesFor } from './captions';
import { useMediaPrefs } from './prefs';
import { useStage } from './StageProvider';

/** The spoken line of the active beat at the current playback time ('' when silent or captions are off). */
export function useLiveCaption(): string {
  const stage = useStage();
  const beat = stage.state.status === 'empty' ? undefined : stage.state.beats[stage.state.index];
  const cues = useMemo(() => cuesFor(beat), [beat]);
  return useSyncExternalStore(
    stage.clock.subscribe,
    () => {
      const snap = stage.clock.get();
      return snap.token === stage.token ? (cueAt(cues, snap.time)?.text ?? '') : '';
    },
    () => '',
  );
}

/**
 * The strip under the stage frame, always the same height so the frame never
 * jumps: live captions while media plays, and when the sequence has ended a
 * plain statement of that with a replay action. Missing narration is named here.
 */
export function StageStatusBar() {
  const stage = useStage();
  const { captions } = useMediaPrefs();
  const text = useLiveCaption();
  const { status, missing } = stage.state;
  const base = 'flex h-12 items-center justify-center gap-3 bg-ink px-4 text-center text-white';

  if (status === 'ended') {
    return (
      <div className={base} data-testid="stage-ended">
        {missing.length > 0 ? (
          <MissingNotice />
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-mist">
            <Icon name="check" className="size-4 text-violet" strokeWidth={3} />
            {ui.stage.ended}
          </span>
        )}
        <button type="button" onClick={stage.play} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-medium hover:bg-white/20">
          <Icon name="replay" className="size-4" />
          {ui.stage.replayAll}
        </button>
      </div>
    );
  }
  if (missing.length > 0 && !text) return <div className={base}><MissingNotice /></div>;
  return (
    <div aria-hidden="true" data-testid={captions && status !== 'ready' ? 'caption' : undefined} className={`${base} text-sm leading-snug sm:text-base md:text-lg`}>
      <span className="line-clamp-2">{captions && status !== 'ready' ? text : ''}</span>
    </div>
  );
}

function MissingNotice() {
  const stage = useStage();
  return (
    <span className="flex items-center gap-2 text-sm text-white/90" data-testid="missing-narration">
      <span aria-hidden className="inline-block size-2 shrink-0 rounded-full bg-amber-400" />
      {ui.stage.missingNarration}
      <button type="button" className="underline underline-offset-4" onClick={() => stage.setTranscriptOpen(true)}>
        {ui.stage.transcript}
      </button>
    </span>
  );
}
