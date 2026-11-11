import type { MediaAsset, MediaKind } from '../content/schema';

export type ResolvedMedia =
  | { status: 'ready'; id: string; kind: MediaKind; alt: string; url: string; captionsUrl?: string }
  | { status: 'placeholder'; id: string; kind: MediaKind | 'unknown'; alt: string };

const mediaUrl = (src: string) => `${import.meta.env.BASE_URL}media/${src}`;

/**
 * Looks an asset up in the manifest. Anything that is not explicitly "ready"
 * with a source resolves to a placeholder, so the UI never requests a file
 * that does not exist.
 */
export function resolveMedia(manifest: Record<string, MediaAsset>, id: string): ResolvedMedia {
  const asset = manifest[id];
  if (!asset) return { status: 'placeholder', id, kind: 'unknown', alt: id };
  if (asset.status !== 'ready' || !asset.src) return { status: 'placeholder', id, kind: asset.kind, alt: asset.alt };
  const captions = asset.captionsId ? manifest[asset.captionsId] : undefined;
  return {
    status: 'ready',
    id,
    kind: asset.kind,
    alt: asset.alt,
    url: mediaUrl(asset.src),
    ...(captions?.status === 'ready' && captions.src ? { captionsUrl: mediaUrl(captions.src) } : {}),
  };
}
