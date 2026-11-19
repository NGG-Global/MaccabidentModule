import { ui } from '../content';
import { Icon } from '../components/Icon';
import { useLiveCaption } from '../stage/CaptionLine';
import { useMediaPrefs } from '../stage/prefs';
import { useStage } from '../stage/StageProvider';

/**
 * For narration without a picture: a quiet panel that shows the spoken line
 * as it is said (when captions are on), with a play button before the first play.
 */
export function NarrationPanel({ className = '' }: { className?: string }) {
  const stage = useStage();
  const { captions } = useMediaPrefs();
  const text = useLiveCaption();
  const { status, missing } = stage.state;
  const playing = status === 'playing';
  return (
    <div className={`relative overflow-hidden rounded-xl bg-ink px-4 py-3 text-white sm:p-6 ${className}`}>
      <div className="flex items-center gap-3 text-sm text-mist">
        <span className="flex h-4 items-end gap-0.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`w-1 rounded-full bg-violet ${playing ? 'animate-pulse' : ''}`} style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 120}ms` }} />
          ))}
        </span>
        {ui.stage.narration}
        {status === 'ended' && (
          <span className="ms-auto flex items-center gap-1 text-xs">
            <Icon name="check" className="size-3.5 text-violet" strokeWidth={3} />
            {ui.stage.ended}
          </span>
        )}
        {status === 'ready' && (
          <button type="button" onClick={stage.play} data-testid="stage-play" className="ms-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-paper px-4 font-semibold text-navy">
            <Icon name="play" className="size-4" />
            {ui.stage.play}
          </button>
        )}
      </div>
      <p className="mt-2 min-h-[3.25rem] font-display text-lg leading-snug sm:mt-3 sm:min-h-[4.5rem] sm:text-2xl" data-testid="narration-line" aria-hidden={!captions}>
        {captions ? text : ''}
      </p>
      {missing.length > 0 && (
        <p className="mt-2 flex items-start gap-2 text-sm text-white/85" data-testid="missing-narration">
          <span aria-hidden className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-amber-400" />
          <span>
            {ui.stage.missingNarration}{' '}
            <button type="button" className="underline underline-offset-4" onClick={() => stage.setTranscriptOpen(true)}>
              {ui.stage.transcript}
            </button>
          </span>
        </p>
      )}
    </div>
  );
}
