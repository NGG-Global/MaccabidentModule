import { content } from '../content';
import type { Beat, Cue } from '../content/schema';

/** Caption cues for a beat, if any were produced. */
export function cuesFor(beat: Beat | undefined): Cue[] {
  if (!beat || beat.kind === 'composition') return [];
  const id = beat.kind === 'narration' ? beat.audioId : beat.mediaId;
  const captionsId = content.media[id]?.captionsId;
  return (captionsId && content.captions[captionsId]?.cues) || [];
}

export function cueAt(cues: Cue[], time: number): Cue | undefined {
  return cues.find((c) => time >= c.start - 0.05 && time < c.end + 0.35);
}

/** Readable text of a beat for the transcript panel. */
export function transcriptOf(beat: Beat): string | null {
  if (beat.kind === 'composition') return null;
  const cues = cuesFor(beat);
  if (cues.length) return cues.map((c) => c.text).join(' ');
  return beat.kind === 'narration' ? (beat.transcript ?? null) : null;
}
