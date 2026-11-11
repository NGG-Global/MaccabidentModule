import { useState } from 'react';
import { content, ui } from '../content';
import { env } from '../config/env';
import { resolveMedia } from './resolveMedia';

interface Props {
  mediaId: string;
}

/**
 * Renders a visual asset, or a described placeholder while the asset is
 * missing or fails to load. A broken image is never shown.
 */
export function MediaSlot({ mediaId }: Props) {
  const media = resolveMedia(content.media, mediaId);
  const [failed, setFailed] = useState(false);

  if (media.status === 'placeholder' || failed) {
    const kind = media.kind === 'unknown' ? '' : ui.media.kinds[media.kind];
    return (
      <div
        role="img"
        aria-label={media.alt}
        data-testid="media-placeholder"
        className="flex aspect-video max-h-72 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-slate-700"
      >
        <span className="text-sm font-semibold">{media.alt}</span>
        {env.isDev && (
          <span className="text-xs text-slate-600" dir="ltr">
            {ui.media.placeholder} · {kind} · {media.id}
          </span>
        )}
      </div>
    );
  }

  if (media.kind === 'video' || media.kind === 'animation') {
    return (
      <video
        className="aspect-video max-h-72 w-full rounded-xl bg-black"
        src={media.url}
        controls
        playsInline
        preload="metadata"
        aria-label={media.alt}
        onError={() => setFailed(true)}
      >
        {media.captionsUrl && <track kind="captions" src={media.captionsUrl} srcLang="he" label="עברית" default />}
      </video>
    );
  }

  return (
    <img
      className="aspect-video max-h-72 w-full rounded-xl object-cover"
      src={media.url}
      alt={media.alt}
      onError={() => setFailed(true)}
    />
  );
}
