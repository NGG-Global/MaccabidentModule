import { useState } from 'react';
import { content, ui } from '../content';
import { resolvePath } from '../engine/flow';
import { useNarrationClip } from '../narration/NarrationProvider';
import type { ScreenProps } from './types';

/** Personal recap. States plainly that progress is device-local and not an organisational record. */
export function SummaryScreen({ screen, state, dispatch }: ScreenProps) {
  useNarrationClip(screen.narration);
  const [confirming, setConfirming] = useState(false);

  const role = content.roles.find((r) => r.id === state.role);
  const path = resolvePath(content.course, state.role).filter((id) => id !== content.course.flow.summary);
  const done = path.filter((id) => state.completed.includes(id)).length;
  const practised = Object.entries(state.practiceAnswers).filter(([, answers]) => answers.length > 0);

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-700">{ui.summary.role}</dt>
          <dd className="font-semibold" data-testid="summary-role">
            {role?.label ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-700">{ui.summary.screens}</dt>
          <dd className="font-semibold">
            <bdi dir="ltr">
              {done} / {path.length}
            </bdi>
          </dd>
        </div>
      </dl>

      <section className="rounded-xl bg-white p-4" aria-labelledby="practice-heading">
        <h2 id="practice-heading" className="text-lg font-bold">
          {ui.summary.practice}
        </h2>
        {practised.length === 0 ? (
          <p className="mt-2">{ui.summary.noPractice}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {practised.map(([scenarioId, answers]) => {
              const scenario = content.scenarios[scenarioId];
              const last = scenario?.options.find((o) => o.id === answers[answers.length - 1]);
              return (
                <li key={scenarioId} data-testid="summary-practice">
                  <span className="font-semibold">{scenario?.title ?? scenarioId}</span>
                  <span className="block text-sm text-slate-700">
                    {ui.summary.attempts.replace('{count}', String(answers.length))} ·{' '}
                    {last?.rating === 'preferred' ? ui.summary.lastPreferred : ui.summary.lastNotPreferred}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-sm text-slate-700">{ui.summary.localNote}</p>

      {confirming ? (
        <div role="alertdialog" aria-labelledby="restart-question" className="space-y-3 rounded-xl border-2 border-slate-300 bg-white p-4">
          <p id="restart-question" className="font-medium">
            {ui.summary.restartConfirm}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg bg-brand-600 px-5 font-semibold text-white"
              onClick={() => dispatch({ type: 'RESET' })}
            >
              {ui.summary.restartYes}
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 font-medium"
              onClick={() => setConfirming(false)}
            >
              {ui.summary.restartNo}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 font-medium"
          onClick={() => setConfirming(true)}
        >
          {ui.summary.restart}
        </button>
      )}
    </div>
  );
}
