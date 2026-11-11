import { useEffect, useRef, useState } from 'react';
import { content, ui } from '../content';
import { env } from '../config/env';
import { scenarioIdsFor } from '../content/schema';
import { useTrack } from '../analytics/TrackContext';
import { DraftBadge } from '../components/DraftBadge';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { OptionList } from '../components/OptionList';
import { elapsedMs, nowMs } from './timing';
import type { ScreenProps } from './types';

const fill = (template: string, values: Record<string, number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

/**
 * Practice scenarios: three options, immediate feedback specific to the
 * choice, and unlimited retries without penalty. Works for one shared
 * scenario or a list of role scenarios. Not in the S00–S04 flow yet;
 * kept for S05–S06. Narration for scenarios will run through the stage.
 */
export function ScenarioScreen({ screen, state, dispatch }: ScreenProps) {
  const track = useTrack();
  const ids = scenarioIdsFor(screen, state.role);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const shownAt = useRef(0);

  const scenario = content.scenarios[ids[index] ?? ''];
  const submittedOption = scenario?.options.find((o) => o.id === submitted);

  // Response time is measured from the moment the options are (re)presented.
  useEffect(() => {
    if (submitted === null) shownAt.current = nowMs();
  }, [index, submitted]);


  if (!scenario) return <p>{ui.pendingScreen}</p>;
  if (scenario.approvalStatus === 'DRAFT' && !env.showDraftContent) return <p>{ui.draftHidden}</p>;

  const check = () => {
    const option = scenario.options.find((o) => o.id === selected);
    if (!option) return;
    const attemptNumber = (state.answers[scenario.scenarioId]?.length ?? 0) + 1;
    dispatch({ type: 'ANSWER_PRACTICE', scenarioId: scenario.scenarioId, optionId: option.id });
    setSubmitted(option.id);
    track(
      'question_answered',
      {
        questionId: scenario.scenarioId,
        answerId: option.id,
        isCorrect: option.rating === 'preferred',
        attemptNumber,
        responseTimeMs: elapsedMs(shownAt.current),
      },
      { scenarioId: scenario.scenarioId },
    );
  };

  const reset = (nextIndex: number) => {
    setIndex(nextIndex);
    setSelected(null);
    setSubmitted(null);
  };

  const secondary = 'min-h-11 rounded-lg border border-slate-300 bg-white px-5 font-medium';

  return (
    <div className="space-y-4" data-testid="scenario" data-scenario-id={scenario.scenarioId}>
      <div className="flex flex-wrap items-center gap-3">
        {ids.length > 1 && (
          <span className="text-sm text-slate-700">{fill(ui.scenario.counter, { current: index + 1, total: ids.length })}</span>
        )}
        <DraftBadge status={scenario.approvalStatus} />
      </div>
      <p className="rounded-xl bg-white p-4 text-lg leading-relaxed">{scenario.scene}</p>

      <OptionList
        legend={scenario.question}
        value={selected}
        onChange={setSelected}
        disabled={submitted !== null}
        options={scenario.options.map((o) => ({ id: o.id, label: o.text }))}
      />

      {submittedOption ? (
        <>
          <FeedbackPanel rating={submittedOption.rating} text={submittedOption.feedback} />
          <p className="text-sm text-slate-700">{ui.scenario.practiceNote}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={secondary} onClick={() => reset(index)}>
              {ui.scenario.retry}
            </button>
            {index < ids.length - 1 && (
              <button type="button" className={secondary} onClick={() => reset(index + 1)}>
                {ui.scenario.nextScenario}
              </button>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={check}
          disabled={selected === null}
          className="min-h-11 rounded-lg bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {ui.scenario.check}
        </button>
      )}
    </div>
  );
}
