import { useId, useState } from 'react';
import { content, ui } from '../content';
import { transcriptOf } from './captions';
import { PLAYBACK_RATES, useMediaPrefs } from './prefs';
import { useStage } from './StageProvider';

const base = 'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45';
const btn = `${base} border-ink/15 bg-white text-ink hover:border-ink/35`;
const primary = `${base} border-navy bg-navy text-white hover:bg-navy/90`;

/**
 * Learner controls for the screen's timed media: play/pause, replay, mute,
 * captions, transcript and speed. Missing narration is named, not hidden.
 */
export function StageControls() {
  const stage = useStage();
  const prefs = useMediaPrefs();
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const transcriptId = useId();
  const speedId = useId();
  const { state } = stage;
  if (state.status === 'empty') return null;

  const playing = state.status === 'playing';
  const missing = state.missing.length > 0 || state.beats.some((b) => b.kind === 'narration' && content.media[b.audioId]?.status !== 'ready');
  const lines = state.beats
    .map((beat, i) => ({ beat, i, text: transcriptOf(beat) }))
    .filter((x) => x.text !== null || (x.beat.kind === 'narration' && content.media[x.beat.audioId]?.status !== 'ready'));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={ui.stage.controls}>
        <button type="button" className={primary} onClick={playing ? stage.pause : stage.play} data-testid="stage-toggle">
          <span aria-hidden>{playing ? '❚❚' : '▶'}</span>
          {playing ? ui.stage.pause : state.status === 'ended' ? ui.stage.replayAll : ui.stage.play}
        </button>
        <button type="button" className={btn} onClick={stage.replayBeat} disabled={state.status === 'ready'}>
          <span aria-hidden>↺</span>
          {ui.stage.replay}
        </button>
        <button type="button" className={btn} aria-pressed={prefs.muted} onClick={() => prefs.update({ muted: !prefs.muted })}>
          <span aria-hidden>{prefs.muted ? '🔇' : '🔊'}</span>
          {prefs.muted ? ui.stage.unmute : ui.stage.mute}
        </button>
        <button type="button" className={btn} aria-pressed={prefs.captions} onClick={() => prefs.update({ captions: !prefs.captions })}>
          <span aria-hidden className="rounded border border-current px-1 text-[10px] leading-4">CC</span>
          {ui.stage.captions}
        </button>
        <button type="button" className={btn} aria-expanded={transcriptOpen} aria-controls={transcriptId} onClick={() => setTranscriptOpen((v) => !v)}>
          {ui.stage.transcript}
        </button>
        <label className="sr-only" htmlFor={speedId}>
          {ui.stage.speed}
        </label>
        <select id={speedId} className={`${btn} pe-8`} value={prefs.rate} onChange={(e) => prefs.update({ rate: Number(e.target.value) })} title={ui.stage.speed}>
          {PLAYBACK_RATES.map((r) => (
            <option key={r} value={r}>
              ×{r}
            </option>
          ))}
        </select>
      </div>

      {missing && (
        <p className="flex items-start gap-2 text-sm text-ink/75" data-testid="missing-narration">
          <span aria-hidden className="mt-0.5 inline-block size-2 shrink-0 rounded-full bg-amber-600" />
          {ui.stage.missingNarration}
        </p>
      )}

      <div id={transcriptId} hidden={!transcriptOpen} className="rounded-lg border border-ink/10 bg-white p-4" data-testid="transcript">
        <h2 className="mb-2 text-sm font-semibold text-ink/70">{ui.stage.transcriptTitle}</h2>
        <ol className="space-y-2 leading-relaxed">
          {lines.map(({ beat, i, text }) => (
            <li key={i} className={i === state.index ? 'text-ink' : 'text-ink/70'}>
              {beat.kind === 'video' && <span className="me-1 font-semibold text-violet">{ui.stage.inVideo}</span>}
              {text ?? <em className="text-ink/60">{ui.stage.narrationNotSupplied}</em>}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink/55">{ui.stage.machineTranscript}</p>
      </div>
    </div>
  );
}
