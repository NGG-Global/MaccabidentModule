import { ui } from '../content';
import { ScreenHeading } from './ScreenHeading';
import type { ScreenProps } from './types';

/** Stand-in for interaction types that are defined in the content model but not built yet (S05–S09). */
export function PendingScreen({ screen }: ScreenProps) {
  return (
    <div className="space-y-6">
      <ScreenHeading screen={screen} />
      <p className="rounded-xl border-2 border-dashed border-ink/20 bg-white p-4">{ui.pendingScreen}</p>
    </div>
  );
}
