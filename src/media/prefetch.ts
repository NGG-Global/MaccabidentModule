import { content } from '../content';
import { resolveMedia } from './resolveMedia';

const done = new Set<string>();

/**
 * Hints the browser to fetch the first media of the screen after this one, at
 * low priority, so it starts promptly. Only one screen ahead, never everything.
 */
export function prefetchScreen(screenId: string | null) {
  if (!screenId || typeof document === 'undefined') return;
  const screen = content.screens[screenId];
  const first = screen?.sequences.enter?.find((b) => b.kind !== 'composition');
  const id = first?.kind === 'narration' ? first.audioId : first?.kind === 'video' ? first.mediaId : null;
  if (!id || done.has(id)) return;
  const media = resolveMedia(content.media, id);
  if (media.status !== 'ready') return;
  done.add(id);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = media.url;
  link.as = media.kind === 'video' ? 'video' : 'audio';
  document.head.appendChild(link);
}
