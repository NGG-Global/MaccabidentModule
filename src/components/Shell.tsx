import { useEffect, useRef, type ReactNode } from 'react';
import { content, ui } from '../content';
import type { Screen } from '../content/schema';
import { NarrationPlayer } from '../narration/NarrationPlayer';
import { DraftBadge } from './DraftBadge';

interface Props {
  screen: Screen;
  progress: { current: number; total: number };
  canGoBack: boolean;
  /** null when the screen has no successor (the summary). */
  canGoNext: boolean | null;
  onBack: () => void;
  onNext: () => void;
  children: ReactNode;
}

const fill = (template: string, values: Record<string, number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export function Shell({ screen, progress, canGoBack, canGoNext, onBack, onNext, children }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusedFor = useRef(screen.screenId);

  // Move focus to the new screen's heading so keyboard and screen-reader users land on the new content.
  // Comparing ids (rather than a "first render" flag) leaves focus alone on initial load, including under StrictMode.
  useEffect(() => {
    if (focusedFor.current === screen.screenId) return;
    focusedFor.current = screen.screenId;
    headingRef.current?.focus();
  }, [screen.screenId]);

  const progressLabel = fill(ui.progress, progress);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100 text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-10 focus:rounded-lg focus:bg-white focus:p-2"
      >
        {ui.skipToContent}
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
          <p className="text-lg font-bold text-brand-700">{content.course.title}</p>
          <div className="flex items-center gap-3">
            <DraftBadge status={screen.approvalStatus} />
            <span className="text-sm text-slate-700" data-testid="progress-label">
              {progressLabel}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={1}
            aria-valuemax={progress.total}
            aria-valuenow={progress.current}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none sm:text-3xl">
          {screen.title}
        </h1>
        {children}
        <NarrationPlayer />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <nav className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3" aria-label="ניווט">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ui.back}
          </button>
          {canGoNext === false && (
            <p id="gate-hint" className="order-last w-full text-sm text-slate-700 sm:order-none sm:w-auto">
              {ui.gateHint}
            </p>
          )}
          {canGoNext !== null && (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              aria-describedby={canGoNext ? undefined : 'gate-hint'}
              className="min-h-11 rounded-lg bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {ui.next}
            </button>
          )}
        </nav>
      </footer>
    </div>
  );
}
