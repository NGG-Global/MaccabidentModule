import { content, ui } from '../content';
import { env } from '../config/env';
import { DraftBadge } from '../components/DraftBadge';
import { useNarrationClip } from '../narration/NarrationProvider';
import type { ScreenProps } from './types';

/**
 * The three service values, shown as cards in this slice. The matching
 * exercise from the learning design is added in the content stage.
 */
export function ValuesScreen({ screen }: ScreenProps) {
  useNarrationClip(screen.narration);
  const { values, approvalStatus } = content.values;

  if (approvalStatus === 'DRAFT' && !env.showDraftContent) return <p>{ui.draftHidden}</p>;

  return (
    <div className="space-y-3">
      <DraftBadge status={approvalStatus} />
      <ol className="grid gap-4 sm:grid-cols-3">
        {values.map((value, index) => (
          <li key={value.id} className="rounded-xl border border-slate-200 bg-white p-4" data-testid="value-card">
            <h2 className="text-lg font-bold text-brand-700">
              <span aria-hidden="true">{index + 1}. </span>
              {value.name}
            </h2>
            <p className="mt-2 leading-relaxed">{value.description}</p>
            <h3 className="mt-3 text-sm font-semibold text-slate-700">{ui.valuesSubLabel}</h3>
            <ul className="mt-1 flex flex-wrap gap-2">
              {value.subValues.map((sub) => (
                <li key={sub} className="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700">
                  {sub}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
