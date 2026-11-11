import { useId, useState } from 'react';
import { ui } from '../content';
import { PLAYBACK_RATES, useNarration } from './NarrationProvider';

const button =
  'min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Narration controls and transcript. When the audio is muted or not available
 * the transcript opens by itself, so the course can be completed without sound.
 */
export function NarrationPlayer() {
  const { clip, status, muted, rate, play, pause, replay, toggleMute, setRate } = useNarration();
  const [transcriptChoice, setTranscriptChoice] = useState<boolean | null>(null);
  const transcriptId = useId();
  const speedId = useId();

  if (!clip) return null;

  const available = status !== 'unavailable';
  const hasTranscript = clip.transcript.length > 0;
  // Nothing to play and nothing extra to read: the on-screen text already says it all.
  if (!available && !hasTranscript) return null;
  const transcriptOpen = transcriptChoice ?? (!available || muted);
  const playing = status === 'playing';

  return (
    <section aria-label={ui.player.region} className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={button} onClick={playing ? pause : play} disabled={!available}>
          {playing ? ui.player.pause : ui.player.play}
        </button>
        <button type="button" className={button} onClick={replay} disabled={!available}>
          {ui.player.replay}
        </button>
        <button type="button" className={button} onClick={toggleMute} aria-pressed={muted}>
          {muted ? ui.player.unmute : ui.player.mute}
        </button>
        <label htmlFor={speedId} className="text-sm text-slate-700">
          {ui.player.speed}
        </label>
        <select
          id={speedId}
          className={button}
          value={rate}
          disabled={!available}
          onChange={(e) => setRate(Number(e.target.value))}
        >
          {PLAYBACK_RATES.map((r) => (
            <option key={r} value={r}>
              ×{r}
            </option>
          ))}
        </select>
        {hasTranscript && (
          <button
            type="button"
            className={button}
            aria-expanded={transcriptOpen}
            aria-controls={transcriptId}
            onClick={() => setTranscriptChoice(!transcriptOpen)}
          >
            {ui.player.transcript}
          </button>
        )}
      </div>
      {!available && <p className="mt-2 text-sm text-slate-700">{ui.player.unavailable}</p>}
      {hasTranscript && (
        <p
          id={transcriptId}
          hidden={!transcriptOpen}
          data-testid="transcript"
          className="mt-3 border-s-4 border-brand-600 ps-3 leading-relaxed text-slate-800"
        >
          {clip.transcript}
        </p>
      )}
    </section>
  );
}
