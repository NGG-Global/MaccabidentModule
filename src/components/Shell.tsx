import { useEffect, useRef, useState, type ReactNode } from 'react';
import { content, ui } from '../content';
import { resolveMedia } from '../media/resolveMedia';
import type { Screen } from '../content/schema';
import { DraftBadge } from './DraftBadge';
import { Icon } from './Icon';

export interface ChapterInfo {
  screenId: string;
  label: string;
  complete: boolean;
  current: boolean;
}

interface Props {
  screen: Screen;
  chapters: ChapterInfo[];
  canGoBack: boolean;
  /** null hides the button (end of the current build). */
  canGoNext: boolean | null;
  nextLabel: string;
  /** What to do now, or that this part is done. */
  hint?: string;
  /** The step is finished: the forward button draws attention to itself. */
  ready: boolean;
  hideFooter: boolean;
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
  /** Shown once at the top of the screen, e.g. after progress was restored. */
  notice?: ReactNode;
  children: ReactNode;
}

const logo = resolveMedia(content.media, 'LOGO-MACCABIDENT-01');
const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));

/**
 * The course frame. It is exactly one viewport tall and never scrolls as a
 * page: header with chapter progress, the screen, and a footer whose forward
 * button is always in the same place and says where it leads.
 */
export function Shell({ screen, chapters, canGoBack, canGoNext, nextLabel, hint, ready, hideFooter, onBack, onNext, onRestart, notice, children }: Props) {
  const [confirming, setConfirming] = useState(false);
  const restartButton = useRef<HTMLButtonElement>(null);
  const currentIndex = Math.max(0, chapters.findIndex((c) => c.current));
  const current = chapters[currentIndex];

  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirming(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirming]);

  const closeConfirm = () => {
    setConfirming(false);
    restartButton.current?.focus();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper font-sans text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">
        {ui.skipToContent}
      </a>

      <header className="shrink-0 border-b border-ink/10 bg-paper">
        <div className="mx-auto flex h-14 w-full max-w-6xl min-[1600px]:max-w-[88rem] items-center gap-4 px-4 sm:px-6">
          {logo.status === 'ready' && <img src={logo.url} alt={ui.brand} className="h-6 w-auto shrink-0" />}
          <p className="hidden shrink-0 border-s border-ink/15 ps-4 font-display text-lg font-semibold text-navy 2xl:block">{content.course.title}</p>

          <nav aria-label={ui.chapters} className="mx-auto hidden min-w-0 flex-1 md:block">
            <ol className="flex items-center justify-center">
              {chapters.map((c, i) => (
                <li key={c.screenId} className="flex items-center" aria-current={c.current ? 'step' : undefined}>
                  {i > 0 && <span aria-hidden className={`mx-1.5 h-px w-3 shrink-0 lg:mx-2 lg:w-5 ${c.complete || c.current ? 'bg-navy/60' : 'bg-ink/15'}`} />}
                  <span
                    aria-hidden
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      c.current ? 'bg-violet text-white' : c.complete ? 'bg-navy text-white' : 'border border-ink/25 text-ink/50'
                    }`}
                  >
                    {c.complete && !c.current ? <Icon name="check" className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`ms-1.5 whitespace-nowrap text-sm ${c.current ? 'font-semibold text-ink' : 'text-ink/55'}`}>
                    {c.label}
                    <span className="sr-only">
                      {' – '}
                      {c.complete ? ui.chapterStatus.done : c.current ? ui.chapterStatus.current : ui.chapterStatus.todo}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <div className="ms-auto flex shrink-0 items-center gap-2 md:ms-0">
            <DraftBadge status={screen.approvalStatus} />
            <button
              ref={restartButton}
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm text-ink/70 hover:bg-ink/5 hover:text-ink"
            >
              <Icon name="restart" className="size-4" />
              <span className="hidden sm:inline">{ui.restart}</span>
              <span className="sr-only sm:hidden">{ui.restart}</span>
            </button>
          </div>
        </div>
        {/* Phones: one line with the chapter name and a segmented bar. */}
        <div className="px-4 pb-2 md:hidden" data-testid="progress-label">
          <p className="mb-1 flex items-baseline justify-between text-xs">
            <span className="font-semibold">{current?.label}</span>
            <span className="text-ink/60">{fill(ui.chapterOf, { current: currentIndex + 1, total: chapters.length })}</span>
          </p>
          <div aria-hidden className="flex gap-1">
            {chapters.map((c) => (
              <span key={c.screenId} className={`h-1 flex-1 rounded-full ${c.current ? 'bg-violet' : c.complete ? 'bg-navy' : 'bg-ink/12'}`} />
            ))}
          </div>
        </div>
      </header>

      <main id="main" className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {notice}
        {children}
      </main>

      {!hideFooter && (
        <footer className="shrink-0 border-t border-ink/10 bg-paper">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl min-[1600px]:max-w-[88rem] items-center gap-3 px-4 py-2.5 sm:px-6">
            <button
              type="button"
              onClick={onBack}
              disabled={!canGoBack}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-ink/20 bg-white ps-3 pe-4 font-medium transition hover:border-ink/40 disabled:invisible"
            >
              <Icon name="backward" className="size-4" />
              {ui.back}
            </button>
            <p id="gate-hint" aria-live="polite" className="min-w-0 flex-1 text-center text-xs leading-snug text-ink/70 sm:text-sm" data-testid="footer-hint">
              {hint}
            </p>
            {canGoNext !== null && (
              <button
                type="button"
                onClick={onNext}
                disabled={!canGoNext}
                aria-describedby={hint ? 'gate-hint' : undefined}
                data-ready={ready && canGoNext ? 'true' : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-navy ps-5 pe-4 font-semibold text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-ink/25 ${
                  ready && canGoNext ? 'animate-[ready-pulse_2.2s_ease-out_infinite]' : ''
                }`}
              >
                {nextLabel}
                <Icon name="forward" className="size-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </footer>
      )}

      {confirming && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="restart-q" className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={closeConfirm}>
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p id="restart-q" className="text-lg font-semibold">
              {ui.restartConfirm}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white"
                onClick={() => {
                  setConfirming(false);
                  onRestart();
                }}
              >
                {ui.restartYes}
              </button>
              <button type="button" autoFocus className="min-h-11 rounded-full border border-ink/20 px-5" onClick={closeConfirm}>
                {ui.restartNo}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
