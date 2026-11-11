import { useId } from 'react';

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface Props {
  legend: string;
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}

/** Single-choice list built on native radio inputs, so keyboard and screen-reader behaviour come for free. */
export function OptionList({ legend, options, value, onChange, disabled }: Props) {
  const name = useId();
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="mb-2 font-semibold text-slate-900">{legend}</legend>
      {options.map((option) => {
        const checked = value === option.id;
        return (
          <label
            key={option.id}
            className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600 ${
              checked ? 'border-brand-600 bg-brand-50' : 'border-slate-300 bg-white hover:border-slate-400'
            } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            <input
              type="radio"
              className="mt-1 size-5 shrink-0 accent-brand-600"
              name={name}
              value={option.id}
              checked={checked}
              onChange={() => onChange(option.id)}
            />
            <span>
              <span className="block font-medium text-slate-900">{option.label}</span>
              {option.description && <span className="block text-sm text-slate-700">{option.description}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
