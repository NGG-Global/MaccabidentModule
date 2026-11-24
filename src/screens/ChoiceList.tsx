import { useId } from 'react';

export type ChoiceMark = 'none' | 'chosen' | 'correct' | 'incorrect';

interface Props {
  legend: string;
  legendId?: string;
  options: { id: string; text: string }[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
  /** How each option is shown after an answer; defaults to "none". */
  mark?: (id: string) => ChoiceMark;
  size?: 'md' | 'lg';
}

/**
 * Single-choice answers on native radio inputs (keyboard and screen readers for free).
 * Status after an answer is shown by border and icon text, never by colour alone.
 */
export function ChoiceList({ legend, legendId, options, value, onChange, disabled, mark = () => 'none', size = 'lg' }: Props) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend id={legendId} className={`mb-2.5 font-display font-semibold leading-snug sm:mb-3 ${size === 'lg' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
        {legend}
      </legend>
      <div className="space-y-2">
        {options.map((o) => {
          const m = mark(o.id);
          const checked = value === o.id;
          const tone =
            m === 'correct'
              ? 'border-navy bg-brand-50'
              : m === 'incorrect'
                ? 'border-ink/45 bg-paper'
                : checked
                  ? 'border-violet bg-paper'
                  : 'border-ink/12 hover:border-ink/30';
          return (
            <label
              key={o.id}
              data-option={o.id}
              data-mark={m}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3.5 py-2.5 transition sm:px-4 has-[:disabled]:cursor-default has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${tone}`}
            >
              <input type="radio" name={name} value={o.id} checked={checked} onChange={() => onChange(o.id)} className="mt-1 size-5 shrink-0 accent-[var(--color-navy)]" />
              <span className={`leading-snug ${size === 'lg' ? 'text-base sm:text-lg' : 'text-base'}`}>{o.text}</span>
              {m === 'correct' && <span className="ms-auto shrink-0 rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">✓</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
