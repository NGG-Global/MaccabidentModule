import type { ReactNode } from 'react';
import { ui } from '../content';
import type { Screen } from '../content/schema';
import { Icon } from '../components/Icon';

export interface StepInfo {
  label: string;
  /** May the learner jump to this step now? */
  reachable: boolean;
  done: boolean;
}

/** Compact heading block: eyebrow and title, the screen's steps beside it, an optional lead under it. */
export function ScreenHeading({
  screen,
  lead,
  steps,
  step,
  onStep,
  brand,
  className = '',
}: {
  screen: Screen;
  lead?: string;
  steps?: StepInfo[];
  step?: number;
  onStep?: (index: number) => void;
  /** Optional brand mark shown beside the title (e.g. the service-concept logo). */
  brand?: ReactNode;
  className?: string;
}) {
  // Phones: the steps share the first row with the eyebrow, so the heading stays two rows tall.
  return (
    <div className={`grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:gap-x-6 ${className}`}>
      <p className="col-start-1 row-start-1 min-h-5 whitespace-nowrap text-xs font-semibold tracking-wide text-violet-ink sm:text-sm">{screen.eyebrow}</p>
      <div className="col-span-2 row-start-2 flex items-center gap-3 sm:col-span-1 sm:gap-4">
        {brand}
        <h1 tabIndex={-1} className="min-w-0 font-display text-2xl font-bold leading-tight text-navy outline-none sm:text-3xl lg:text-4xl lg:[@media(max-height:42rem)]:text-3xl">
          {screen.title}
        </h1>
      </div>
      {lead && <p className="col-start-1 row-start-3 hidden max-w-2xl pt-1 text-base leading-snug text-ink/70 lg:[@media(min-height:46rem)]:block">{lead}</p>}
      {steps && step !== undefined && (
        <div className="col-start-2 row-start-1 justify-self-end sm:row-span-3 sm:self-end">
          <StepTracker steps={steps} step={step} onStep={onStep} />
        </div>
      )}
    </div>
  );
}

/** Where the learner is inside the screen. Steps already reachable can be revisited. */
export function StepTracker({ steps, step, onStep }: { steps: StepInfo[]; step: number; onStep?: (index: number) => void }) {
  return (
    <ol aria-label={ui.stepsLabel} className="flex items-center" data-testid="step-tracker">
      {steps.map((s, i) => {
        const current = i === step;
        const status = current ? ui.stepStatus.current : s.done ? ui.stepStatus.done : ui.stepStatus.todo;
        const body: ReactNode = (
          <>
            <span
              aria-hidden
              className={`grid size-6 place-items-center rounded-full text-xs font-bold ${
                current ? 'bg-navy text-white' : s.done ? 'bg-brand-100 text-navy' : 'border border-ink/25 text-ink/50'
              }`}
            >
              {s.done && !current ? <Icon name="check" className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={`text-sm ${current ? 'font-semibold text-ink' : `max-[420px]:sr-only ${s.reachable ? 'text-ink/75' : 'text-ink/45'}`}`}>{s.label}</span>
            <span className="sr-only"> – {status}</span>
          </>
        );
        return (
          <li key={s.label} className="flex items-center" aria-current={current ? 'step' : undefined}>
            {i > 0 && <span aria-hidden className="mx-1.5 h-px w-3 bg-ink/20 sm:mx-2 sm:w-5" />}
            {onStep && s.reachable && !current ? (
              <button type="button" onClick={() => onStep(i)} className="flex min-h-9 items-center gap-1.5 rounded-full pe-2 hover:bg-ink/5" data-testid={`step-${i}`}>
                {body}
              </button>
            ) : (
              <span className="flex min-h-9 items-center gap-1.5 pe-2" data-testid={`step-${i}`}>
                {body}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Standard screen layout: heading on top, the body takes all remaining height. */
export function ScreenFrame({ heading, children, className = '' }: { heading?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col min-[1600px]:max-w-[88rem] gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-5 sm:[@media(max-height:42rem)]:gap-3 sm:[@media(max-height:42rem)]:py-3 ${className}`}>
      {heading}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
