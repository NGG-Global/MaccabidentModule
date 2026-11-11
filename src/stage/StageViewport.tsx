import { Player, type PlayerRef } from '@remotion/player';
import { useCallback, useMemo, type ReactNode } from 'react';
import { content, ui } from '../content';
import type { Beat, CompositionRef } from '../content/schema';
import { resolveMedia } from '../media/resolveMedia';
import { compositions, FRAME, parseCompositionProps } from '../remotion/registry';
import { mediaIdsInProps } from '../remotion/props';
import { FPS } from '../remotion/theme';
import { CaptionLine } from './CaptionLine';
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

/** The cinematic frame of a screen: whichever composition or video the running sequence is on. */
export function StageViewport({ fallback, externalVideos = [], className = '', label }: Props) {
  const stage = useStage();
  const orientation = useFrameOrientation();
  const { state } = stage;
  const isExternal = useCallback((id: string) => externalVideos.includes(id), [externalVideos]);
  const vIndex = state.status === 'empty' ? -1 : visualBeatIndex(state, isExternal);
  const vBeat = vIndex >= 0 ? state.beats[vIndex] : undefined;
  const playerKey = `${state.runId}:${vIndex}`;
  const held = vIndex !== state.index || state.status === 'ended';
  const aspect = vBeat?.kind === 'video' ? 'aspect-video' : orientation === 'portrait' ? 'aspect-[4/5]' : 'aspect-video';

  return (
    <section
      aria-label={label}
      data-testid="stage"
      className={`relative mx-auto w-full overflow-hidden rounded-xl shadow-[0_30px_80px_-40px_rgba(11,31,58,0.55)] ${className}`}
      // Keep the whole frame on screen: width is capped by the viewport height left after header and controls.
      style={{ maxWidth: `calc((100dvh - 15.5rem) * ${vBeat?.kind === 'video' || orientation === 'landscape' ? 16 / 9 : 4 / 5})` }}
    >
      <div className={`relative w-full ${vBeat ? '' : aspect}`}>
        {vBeat?.kind === 'video' ? (
          <StageVideo key={vBeat.mediaId} mediaId={vBeat.mediaId} allowSoloPlay={false} />
        ) : vBeat?.visual ? (
          // The Player's scaling container must be laid out LTR; each composition sets RTL on its own root.
          <div dir="ltr" data-testid="composition" data-composition={vBeat.visual.id}>
            <ComposedPlayer key={playerKey} visual={vBeat.visual} beat={vBeat} playerKey={playerKey} extraProps={state.visualProps} held={held} />
          </div>
        ) : (
          (fallback ?? null)
        )}
        {state.status === 'ready' && (
          <button
            type="button"
            onClick={stage.play}
            className="absolute inset-0 grid place-items-center bg-ink/35 text-white transition hover:bg-ink/45"
            data-testid="stage-play"
          >
            <span className="flex items-center gap-3 rounded-full bg-paper px-6 py-3 text-lg font-semibold text-navy shadow-xl">
              <span aria-hidden>▶</span>
              {ui.stage.play}
            </span>
          </button>
        )}
      </div>
      {vBeat?.kind !== 'video' && <CaptionLine bar />}
    </section>
  );
}
