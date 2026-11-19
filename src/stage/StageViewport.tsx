import { Player, type PlayerRef } from '@remotion/player';
import { useCallback, useMemo, type ReactNode } from 'react';
import { content, ui } from '../content';
import type { Beat, CompositionRef } from '../content/schema';
import { resolveMedia } from '../media/resolveMedia';
import { compositions, FRAME, parseCompositionProps } from '../remotion/registry';
import { mediaIdsInProps } from '../remotion/props';
import { FPS } from '../remotion/theme';
import { Icon } from '../components/Icon';
import { StageStatusBar } from './CaptionLine';
import { StageControls } from './StageControls';
import { useStage } from './StageProvider';
import { StageVideo } from './StageVideo';
import { visualBeatIndex } from './sequencer';
import { useFrameOrientation, usePrefersReducedMotion } from './useFrameOrientation';

interface Props {
  /** Shown before any timed media has a picture (e.g. a poster). */
  fallback?: ReactNode;
  /** Videos the screen renders itself (e.g. a side-by-side comparison). */
  externalVideos?: string[];
  className?: string;
  label: string;
  /** Media controls under the frame (default). */
  controls?: boolean;
}

function durationFrames(beat: Beat): number {
  if (beat.kind === 'composition') return Math.max(1, Math.round(beat.durationSec * FPS));
  if (beat.kind === 'narration') {
    const d = content.media[beat.audioId]?.durationSec;
    // Narration not supplied: give the composition a reading-paced length.
    return Math.max(1, Math.ceil((d ?? 6) * FPS) + 2);
  }
  return 1;
}

function ComposedPlayer({ visual, beat, playerKey, extraProps, held }: { visual: CompositionRef; beat: Beat; playerKey: string; extraProps: Record<string, unknown>; held: boolean }) {
  const stage = useStage();
  const orientation = useFrameOrientation();
  const reducedMotion = usePrefersReducedMotion();
  const frame = FRAME[orientation];
  const duration = durationFrames(beat);
  const inputProps = useMemo(() => {
    const own = parseCompositionProps(visual.id, { ...visual.props, ...extraProps });
    const mediaUrls: Record<string, string> = {};
    for (const id of mediaIdsInProps(own)) {
      const media = resolveMedia(content.media, id);
      if (media.status === 'ready') mediaUrls[id] = media.url;
    }
    return { ...own, mediaUrls, reducedMotion };
  }, [visual, extraProps, reducedMotion]);
  const ref = useCallback((r: PlayerRef | null) => stage.registerPlayer(playerKey, r), [stage.registerPlayer, playerKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Player
      ref={ref}
      component={compositions[visual.id]}
      inputProps={inputProps}
      durationInFrames={duration}
      fps={FPS}
      compositionWidth={frame.width}
      compositionHeight={frame.height}
      controls={false}
      clickToPlay={false}
      spaceKeyToPlayOrPause={false}
      doubleClickToFullscreen={false}
      moveToBeginningWhenEnded={false}
      numberOfSharedAudioTags={0}
      initialFrame={held ? duration - 1 : 0}
      style={{ width: '100%', aspectRatio: `${frame.width} / ${frame.height}` }}
    />
  );
}

/** Height of the strip under the frame (h-12). */
const BAR = '3rem';

/**
 * The cinematic frame of a screen: whichever composition or video the running
 * sequence is on, with its caption strip and (optionally) the media controls.
 * It fills the space its parent gives it and keeps the frame's aspect ratio,
 * so the whole screen fits the window without scrolling.
 */
export function StageViewport({ fallback, externalVideos = [], className = '', label, controls = true }: Props) {
  const stage = useStage();
  const orientation = useFrameOrientation();
  const { state } = stage;
  const isExternal = useCallback((id: string) => externalVideos.includes(id), [externalVideos]);
  const vIndex = state.status === 'empty' ? -1 : visualBeatIndex(state, isExternal);
  const vBeat = vIndex >= 0 ? state.beats[vIndex] : undefined;
  const playerKey = `${state.runId}:${vIndex}`;
  const held = vIndex !== state.index || state.status === 'ended';
  const ratio = vBeat?.kind === 'video' || orientation === 'landscape' ? 16 / 9 : 4 / 5;
  // Space taken by everything except the frame: caption strip, gap and controls (two rows on phones).
  const chrome = controls ? 'max-sm:[--chrome:8.5rem] sm:[--chrome:6.75rem]' : '[--chrome:3.5rem]';
  const fit = `min(100cqw, calc((100cqh - var(--chrome)) * ${ratio}))`;

  return (
    <div className={`flex h-full min-h-56 w-full flex-col items-center gap-2 [container-type:size] ${chrome} ${className}`}>
      <section
        aria-label={label}
        data-testid="stage"
        className="relative overflow-hidden rounded-xl bg-ink shadow-[0_30px_80px_-40px_rgba(11,31,58,0.55)]"
        style={{ width: fit }}
      >
        <div className="relative w-full" style={{ aspectRatio: String(ratio) }}>
          {vBeat?.kind === 'video' ? (
            <StageVideo key={vBeat.mediaId} mediaId={vBeat.mediaId} label={vBeat.label} allowSoloPlay={false} />
          ) : vBeat?.visual ? (
            // The Player's scaling container must be laid out LTR; each composition sets RTL on its own root.
            <div dir="ltr" data-testid="composition" data-composition={vBeat.visual.id}>
              <ComposedPlayer key={playerKey} visual={vBeat.visual} beat={vBeat} playerKey={playerKey} extraProps={state.visualProps} held={held} />
            </div>
          ) : (
            (fallback ?? <div className="grid h-full place-items-center bg-paper-deep text-sm text-ink/50">{ui.stage.stageEmpty}</div>)
          )}
          {state.status === 'ready' && (
            <button
              type="button"
              onClick={stage.play}
              className="absolute inset-0 grid place-items-center bg-ink/35 text-white transition hover:bg-ink/45"
              data-testid="stage-play"
            >
              <span className="flex items-center gap-3 rounded-full bg-paper px-6 py-3 text-lg font-semibold text-navy shadow-xl">
                <Icon name="play" className="size-5" />
                {ui.stage.play}
              </span>
            </button>
          )}
        </div>
        <div style={{ height: BAR }}>
          <StageStatusBar />
        </div>
      </section>
      {controls && (
        // As wide as the frame, but never so narrow that the controls wrap.
        <div style={{ width: `max(${fit}, min(100cqw, 21rem))` }}>
          <StageControls />
        </div>
      )}
    </div>
  );
}
