import { motion } from 'motion/react';
import { content, ui } from '../content';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { StageViewport } from '../stage/StageViewport';
import { ScreenFrame, ScreenHeading } from './ScreenHeading';
import { sidePane, split, stagePane } from './layout';
import { useEnterSequence } from './useEnterSequence';
import type { ScreenProps } from './types';

/**
 * S09. Yossi's farewell, then the closing sequence, a reply to the opening.
 * Beside it, the real completion status: "complete" only with a passed
 * assessment; otherwise what is missing and a way back to the assessment.
 */
export function ConclusionScreen({ screen, state, dispatch }: ScreenProps) {
  // The ending plays once on arrival; on later visits it waits behind a play button.
  useEnterSequence(false);
  const latest = state.attempts.at(-1);
  const passed = latest?.passed === true;
  const complete = Boolean(state.completedAt);
  const role = content.roles.find((r) => r.id === state.role);
  useScreenNav(screen.screenId, { ready: complete, hint: ui.conclusion.localNote });

  return (
    <ScreenFrame heading={<ScreenHeading screen={screen} lead={screen.onScreenText[0]} />}>
      <div className={split('lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,1fr)]')}>
        <div className={stagePane}>
          <StageViewport label={screen.title} />
        </div>
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`${sidePane} gap-4 rounded-2xl p-5 sm:p-6 ${complete ? 'bg-ink text-white' : 'bg-white'}`}
          data-testid="completion-status"
          data-complete={complete}
          aria-live="polite"
        >
          <p className="flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl">
            <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-full ${complete ? 'bg-violet text-white' : 'border-2 border-ink/30 text-ink/60'}`}>
              <Icon name={complete ? 'check' : 'restart'} className="size-5" strokeWidth={3} />
            </span>
            {complete ? ui.conclusion.statusComplete : ui.conclusion.statusIncomplete}
          </p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className={complete ? 'text-mist' : 'text-ink/60'}>{ui.conclusion.role}</dt>
              <dd className="font-semibold">{role?.label ?? '—'}</dd>
            </div>
            <div>
              <dt className={complete ? 'text-mist' : 'text-ink/60'}>{ui.conclusion.score}</dt>
              <dd className="font-semibold" data-testid="final-score">
                <bdi>{latest ? `${latest.percent}` : '—'}</bdi>
              </dd>
            </div>
            {state.completedAt && (
              <div className="col-span-2">
                <dt className="text-mist">{ui.conclusion.completedOn}</dt>
                <dd className="font-semibold">{new Date(state.completedAt).toLocaleDateString('he-IL')}</dd>
              </div>
            )}
          </dl>
          {!passed && (
            <div className="space-y-3">
              <p className="leading-relaxed">{ui.conclusion.needAssessment}</p>
              <button type="button" onClick={() => dispatch({ type: 'GOTO', screenId: 'S08' })} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 font-semibold text-white" data-testid="back-to-assessment">
                <Icon name="backward" className="size-4" />
                {ui.conclusion.toAssessment}
              </button>
            </div>
          )}
          <div>
            <p className={`mb-2 text-xs font-semibold ${complete ? 'text-mist' : 'text-violet'}`}>{ui.conclusion.values}</p>
            <ul className="flex flex-wrap gap-2">
              {content.values.values.map((v) => (
                <li key={v.id} className={`rounded-full px-3 py-1 text-sm font-medium ${complete ? 'bg-white/10' : 'bg-paper'}`}>
                  {v.name}
                </li>
              ))}
            </ul>
          </div>
        </motion.aside>
      </div>
    </ScreenFrame>
  );
}
