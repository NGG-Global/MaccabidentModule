import { ui } from '../content';
import { env } from '../config/env';
import type { ApprovalStatus } from '../content/schema';

/** Marks content that has not been professionally approved. Only rendered where drafts are visible at all. */
export function DraftBadge({ status }: { status: ApprovalStatus }) {
  if (status !== 'DRAFT' || !env.showDraftContent) return null;
  return (
    <span
      data-testid="draft-badge"
      title={ui.draftBadgeHint}
      className="inline-flex items-center rounded-full border border-amber-700 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
    >
      {ui.draftBadge}
    </span>
  );
}
