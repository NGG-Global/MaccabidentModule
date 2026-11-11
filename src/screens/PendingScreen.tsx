import { ui } from '../content';
import { useNarrationClip } from '../narration/NarrationProvider';
import type { ScreenProps } from './types';

/** Stand-in for interaction types that are defined in the content model but not built yet. */
export function PendingScreen({ screen }: ScreenProps) {
  useNarrationClip(screen.narration);
  return <p className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-4">{ui.pendingScreen}</p>;
}
