import { useEffect, useRef, useState, type ReactNode } from 'react';
import { content, ui } from '../content';
import { resolveMedia } from '../media/resolveMedia';
import type { Screen } from '../content/schema';
import { DraftBadge } from './DraftBadge';

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
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
  children: ReactNode;
}

const logo = resolveMedia(content.media, 'LOGO-MACCABIDENT-01');

export function Shell({ screen, chapters, canGoBack, canGoNext, onBack, onNext, onRestart, children }: Props) {
  const focusedFor = useRef(screen.screenId);
  const [confirming, setConfirming] = useState(false);

  // Scroll to the top on a new screen. Focus moves to the new heading once the
  // outgoing screen has left (see onScreenEntered in App), so it never lands on the old one.
  useEffect(() => {
    if (focusedFor.current === screen.screenId) return;
    focusedFor.current = screen.screenId;
    window.scrollTo({ top: 0 });
  }, [screen.screenId]);

  const currentIndex = chapters.findIndex((c) => c.current);

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-sans text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">
        {ui.skipToContent}
      </a>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          {logo.status === 'ready' && <img src={logo.url} alt={ui.brand} className="h-6 w-auto sm:h-7" />}
          <span aria-hidden className="hidden h-6 w-px bg-ink/15 sm:block" />
          <p className="hidden font-display text-lg font-semibold text-navy sm:block">{content.course.title}</p>
          <div className="ms-auto flex items-center gap-3">
            <DraftBadge status={screen.approvalStatus} />
            <button type="button" onClick={() => setConfirming(true)} className="min-h-10 rounded-full px-3 text-sm text-ink/70 underline-offset-4 hover:text-ink hover:underline">
              {ui.restart}
            </button>
          </div>
        </div>
        <nav aria-label={ui.chapters} className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6">
          <ol className="flex gap-1.5">
            {chapters.map((c, i) => (
              <li key={c.screenId} className="min-w-0 flex-1" aria-current={c.current ? 'step' : undefined}>
                <div className={`h-1.5 rounded-full ${c.complete ? 'bg-navy' : c.current ? 'bg-violet' : 'bg-ink/12'}`} />
                <span className={`mt-1.5 hidden truncate text-xs md:block ${c.current ? 'font-semibold text-ink' : 'text-ink/55'}`}>
                  {c.label}
                  <span className="sr-only">
                    {' – '}
                    {c.complete ? ui.chapterStatus.done : c.current ? ui.chapterStatus.current : ui.chapterStatus.todo}
                  </span>
                </span>
                {i === currentIndex && (
                  <span className="mt-1.5 block text-xs font-semibold md:hidden" data-testid="progress-label">
                    {c.label} · {i + 1}/{chapters.length}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </header>

      {confirming && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="restart-q" className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <p id="restart-q" className="text-lg font-semibold">
              {ui.restartConfirm}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                autoFocus
                className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white"
                onClick={() => {
                  setConfirming(false);
                  onRestart();
                }}
              >
                {ui.restartYes}
              </button>
              <button type="button" className="min-h-11 rounded-full border border-ink/20 px-5" onClick={() => setConfirming(false)}>
                {ui.restartNo}
              </button>
            </div>
          </div>
        </div>
      )}

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
        {children}
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-ink/10 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="min-h-11 rounded-full border border-ink/20 bg-white px-5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ui.back}
          </button>
          {canGoNext === false && (
            <p id="gate-hint" className="order-last w-full text-sm text-ink/70 sm:order-none sm:w-auto">
              {ui.gateHint}
            </p>
          )}
          {canGoNext !== null && (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              aria-describedby={canGoNext ? undefined : 'gate-hint'}
              className="min-h-11 rounded-full bg-navy px-7 font-semibold text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-ink/25"
            >
              {ui.next}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
