import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { content, ui } from '../content';
import type { Beat } from '../content/schema';
import { Icon } from '../components/Icon';
import { transcriptOf } from './captions';
import { PLAYBACK_RATES, useMediaPrefs } from './prefs';
import { useStage } from './StageProvider';

const base = 'inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45';
const btn = `${base} border-ink/15 bg-white text-ink hover:border-ink/35 aria-pressed:border-navy/40 aria-pressed:bg-brand-50`;
const primary = `${base} border-navy bg-navy text-white hover:bg-navy/90 sm:px-4`;
const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));

/** Planned length of a beat, from the media manifest (narration, video) or the content (silent animation). */
export function beatDuration(beat: Beat): number {
  if (beat.kind === 'composition') return beat.durationSec;
  const id = beat.kind === 'narration' ? beat.audioId : beat.mediaId;
  return content.media[id]?.durationSec ?? 6;
}

/**
 * Learner controls for the screen's timed media, on one row: play/pause, a
 * segment timeline (where am I, how much is left, jump to a part), replay,
 * mute, captions, transcript and speed.
 */
export function StageControls() {
  const stage = useStage();
  const prefs = useMediaPrefs();
  const speedId = useId();
  const { state } = stage;
  if (state.status === 'empty') return null;

  const playing = state.status === 'playing';
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:flex-nowrap sm:gap-2" role="group" aria-label={ui.stage.controls} data-testid="stage-controls">
      <button type="button" className={primary} onClick={playing ? stage.pause : stage.play} data-testid="stage-toggle">
        <Icon name={playing ? 'pause' : 'play'} className="size-4" />
        <span className="max-sm:sr-only">{playing ? ui.stage.pause : state.status === 'ended' ? ui.stage.replayAll : ui.stage.play}</span>
      </button>
      <Timeline />
      <button type="button" className={btn} onClick={stage.replayBeat} disabled={state.status === 'ready'} title={ui.stage.replay}>
        <Icon name="replay" className="size-5" />
        <span className="sr-only">{ui.stage.replay}</span>
      </button>
      <button type="button" className={btn} aria-pressed={prefs.muted} onClick={() => prefs.update({ muted: !prefs.muted })} title={prefs.muted ? ui.stage.unmute : ui.stage.mute}>
        <Icon name={prefs.muted ? 'muted' : 'volume'} className="size-5" />
        <span className="sr-only">{prefs.muted ? ui.stage.unmute : ui.stage.mute}</span>
      </button>
      <button type="button" className={btn} aria-pressed={prefs.captions} onClick={() => prefs.update({ captions: !prefs.captions })} title={ui.stage.captions}>
        <Icon name="captions" className="size-5" />
        <span className="sr-only">{ui.stage.captions}</span>
      </button>
      <button type="button" className={`${btn} sm:px-3`} aria-haspopup="dialog" aria-expanded={stage.transcriptOpen} onClick={() => stage.setTranscriptOpen(true)} title={ui.stage.transcript}>
        <Icon name="transcript" className="size-5" />
        <span className="max-sm:sr-only">{ui.stage.transcript}</span>
      </button>
      <label className="sr-only" htmlFor={speedId}>
        {ui.stage.speed}
      </label>
      <select id={speedId} className={`${btn} w-16 px-2 text-center`} value={prefs.rate} onChange={(e) => prefs.update({ rate: Number(e.target.value) })} title={ui.stage.speed}>
        {PLAYBACK_RATES.map((r) => (
          <option key={r} value={r}>
            ×{r}
          </option>
        ))}
      </select>
      {stage.transcriptOpen && <TranscriptDialog />}
    </div>
  );
}

/** Segments of the running sequence, sized by length; the current one fills as it plays. */
function Timeline() {
  const stage = useStage();
  const { state } = stage;
  const durations = state.beats.map(beatDuration);
  const currentDuration = durations[state.index] ?? 1;
  const fraction = useSyncExternalStore(
    stage.clock.subscribe,
    () => {
      const snap = stage.clock.get();
      if (snap.token !== stage.token) return 0;
      return Math.min(1, Math.round((snap.time / currentDuration) * 200) / 200);
    },
    () => 0,
  );
  const total = state.beats.length;
  const filled = (i: number) => (state.status === 'ended' || i < state.index ? 1 : i === state.index ? fraction : 0);
  const track = (i: number) => (
    <span className="absolute inset-x-0 top-1/2 block h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-ink/12">
      <span className={`block h-full rounded-full ${i === state.index && state.status !== 'ended' ? 'bg-violet' : 'bg-navy'}`} style={{ width: `${filled(i) * 100}%` }} />
    </span>
  );

  return (
    <div className="order-first flex h-6 basis-full items-center gap-1 sm:order-none sm:mx-1 sm:h-11 sm:flex-1 sm:basis-auto" data-testid="timeline">
      {total === 1 ? (
        <div
          role="progressbar"
          aria-label={state.beats[0]?.label ?? ui.stage.timeline}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(filled(0) * 100)}
          className="relative h-6 flex-1"
        >
          {track(0)}
        </div>
      ) : (
        state.beats.map((beat, i) => {
          const name = beat.label ?? fill(ui.stage.segment, { current: i + 1, total });
          return (
            <button
              key={i}
              type="button"
              title={name}
              aria-label={`${name} (${fill(ui.stage.segment, { current: i + 1, total })})`}
              aria-current={i === state.index ? 'step' : undefined}
              onClick={() => stage.goToBeat(i)}
              className="relative h-6 min-w-5 basis-0 rounded focus-visible:outline-offset-0 sm:h-11"
              style={{ flexGrow: durations[i] }}
            >
              {track(i)}
            </button>
          );
        })
      )}
    </div>
  );
}

/** The screen's spoken text, in a dialog so opening it never pushes the layout. */
function TranscriptDialog() {
  const stage = useStage();
  const { state } = stage;
  const titleId = useId();
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stage.setTranscriptOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
    // Once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = state.beats
    .map((beat, i) => ({ beat, i, text: transcriptOf(beat) }))
    .filter((x) => x.text !== null || (x.beat.kind === 'narration' && content.media[x.beat.audioId]?.status !== 'ready'));

  // Rendered at the document root: an animated ancestor must not become its positioning context.
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onClick={() => stage.setTranscriptOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[80dvh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="transcript"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
          <h2 id={titleId} className="font-semibold">
            {ui.stage.transcriptTitle}
          </h2>
          <button ref={close} type="button" onClick={() => stage.setTranscriptOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-ink/5" aria-label={ui.stage.transcriptClose}>
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <ol className="space-y-3 overflow-y-auto px-5 py-4 leading-relaxed">
          {lines.map(({ beat, i, text }) => (
            <li key={i} className={i === state.index ? 'text-ink' : 'text-ink/70'}>
              {beat.label && <span className="mb-0.5 block text-xs font-semibold text-violet-ink">{beat.label}</span>}
              {beat.kind === 'video' && <span className="me-1 font-semibold text-navy">{ui.stage.inVideo}</span>}
              {text ?? <em className="text-ink/60">{ui.stage.narrationNotSupplied}</em>}
            </li>
          ))}
        </ol>
        <p className="border-t border-ink/10 px-5 py-3 text-xs text-ink/55">{ui.stage.machineTranscript}</p>
      </div>
    </div>,
    document.body,
  );
}
