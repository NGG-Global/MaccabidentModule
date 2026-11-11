import { ui } from '../content';
import type { OptionRating } from '../content/schema';

const styles: Record<OptionRating, { box: string; icon: string }> = {
  preferred: { box: 'border-green-700 bg-green-50 text-green-950', icon: '✓' },
  partial: { box: 'border-amber-700 bg-amber-50 text-amber-950', icon: '◐' },
  undesirable: { box: 'border-red-700 bg-red-50 text-red-950', icon: '✕' },
};

/** Immediate, choice-specific feedback. Status is carried by icon and wording, not by colour alone. */
export function FeedbackPanel({ rating, text }: { rating: OptionRating; text: string }) {
  const style = styles[rating];
  return (
    <div role="status" data-testid="feedback" data-rating={rating} className={`rounded-xl border-2 p-4 ${style.box}`}>
      <p className="flex items-center gap-2 font-bold">
        <span aria-hidden="true">{style.icon}</span>
        <span>
          {ui.scenario.feedbackTitle}: {ui.scenario.ratings[rating]}
        </span>
      </p>
      <p className="mt-2 leading-relaxed">{text}</p>
    </div>
  );
}
