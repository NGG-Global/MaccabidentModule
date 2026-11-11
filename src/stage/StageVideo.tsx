import { useCallback } from 'react';
import { content, ui } from '../content';
import { resolveMedia } from '../media/resolveMedia';
import { CaptionLine } from './CaptionLine';
import { useStage } from './StageProvider';

interface Props {
  mediaId: string;
  label?: string;
  /** Plays this video on its own when the learner chooses it outside the running sequence. */
  allowSoloPlay?: boolean;
  className?: string;
}

/**
 * A video owned by the stage controller: no native controls, captions drawn
 * by the course, never more than one source of sound at a time.
 */
export function StageVideo({ mediaId, label, allowSoloPlay = true, className = '' }: Props) {
  const stage = useStage();
  const media = resolveMedia(content.media, mediaId);
  const asset = content.media[mediaId];
  const poster = asset?.posterId ? resolveMedia(content.media, asset.posterId) : undefined;
  const register = useCallback((el: HTMLVideoElement | null) => stage.registerVideo(mediaId, el), [stage.registerVideo, mediaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = stage.state.beats[stage.state.index];
  const isCurrent = stage.state.status !== 'empty' && current?.kind === 'video' && current.mediaId === mediaId;
  const playing = isCurrent && stage.state.status === 'playing';

  if (media.status !== 'ready') {
    return (
      <div className={`grid aspect-video place-items-center rounded-lg border border-dashed border-ink/30 bg-ink/5 p-4 text-center text-sm ${className}`} role="img" aria-label={media.alt}>
        <span>
          <strong className="block">{ui.media.missingVideo}</strong>
          {media.alt}
        </span>
      </div>
    );
  }

  return (
    <figure className={`relative overflow-hidden rounded-lg bg-ink ${className}`} data-testid={`video-${mediaId}`} data-active={isCurrent}>
      <video
        ref={register}
        src={media.url}
        poster={poster?.status === 'ready' ? poster.url : undefined}
        playsInline
        preload="metadata"
        className="aspect-video w-full object-cover"
        aria-label={media.alt}
      />
      {isCurrent && <CaptionLine overlay />}
      {label && (
        <figcaption className="absolute start-3 top-3 rounded-full bg-paper/95 px-3 py-1 text-sm font-semibold text-navy">{label}</figcaption>
      )}
      {allowSoloPlay && !playing && (
        <button
          type="button"
          onClick={() => stage.runBeats(`replay:${mediaId}`, [{ kind: 'video', mediaId }], { autoplay: true })}
          className="absolute inset-0 grid place-items-center bg-ink/10 transition hover:bg-ink/25 focus-visible:bg-ink/25"
          aria-label={`${ui.stage.watch}: ${label ?? media.alt}`}
        >
          <span className="grid size-16 place-items-center rounded-full bg-paper/95 text-2xl text-navy shadow-lg" aria-hidden>
            ▶
          </span>
        </button>
      )}
    </figure>
  );
}
