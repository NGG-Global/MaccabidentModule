import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { content, ui } from '../content';
import { scenarioIdsFor, type Beat, type Scenario } from '../content/schema';
import { useTrack } from '../analytics/TrackContext';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { optionOrder } from '../engine/assessment';
import { isPlaybackUnlocked } from '../stage/session';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { ChoiceList } from './ChoiceList';
import { ScreenFrame, ScreenHeading, type StepInfo } from './ScreenHeading';
import { elapsedMs, nowMs } from './timing';
import { sidePane, split, stagePane } from './layout';
import { useSteps } from './useSteps';
import type { ScreenProps } from './types';

type Step = 'situation' | 'decide' | 'feedback';
const ORDER: Step[] = ['situation', 'decide', 'feedback'];
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));

/**
 * S05 and S06: practice scenarios. Each case runs situation → decision →
 * answer-specific feedback. The situation is narrated (with video where
 * suitable footage exists); the question opens as it is asked; the chosen
 * answer plays its own narrated feedback and, for the preferred response, a
 * clip of what it looks like. The preferred answer is never shown before the
 * learner answers, and another answer can always be tried.
 * S06 shows only the cases for the role chosen in S01.
 */
export function ScenarioScreen({ screen, state, dispatch, done }: ScreenProps) {
  const stage = useStage();
  const track = useTrack();
  const ids = scenarioIdsFor(screen, state.role);
  const cases = ids.map((id) => content.scenarios[id]).filter((s): s is Scenario => Boolean(s));
  const answeredCase = (s: Scenario) => (state.answers[s.scenarioId]?.length ?? 0) > 0;
  const firstOpen = cases.findIndex((s) => !answeredCase(s));
  const [caseIndex, setCaseIndex] = useState(firstOpen === -1 ? Math.max(cases.length - 1, 0) : firstOpen);
  const sc = cases[caseIndex];
  const history = (sc && state.answers[sc.scenarioId]) || [];
  const [step, setStep] = useSteps<Step>(history.length ? 'feedback' : 'situation');
  const [selected, setSelected] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(history.at(-1) ?? null);
  const shownAt = useRef(0);

  const enterBeats = useMemo(() => screen.sequences.enter ?? [], [screen.sequences.enter]);
  const situationBeats = (s: Scenario, withChapter: boolean): Beat[] => [...(withChapter ? enterBeats : []), ...s.situation, ...(s.ask ?? [])];
  const situationKey = sc ? `situation:${sc.scenarioId}` : '';
  const askIndex = sc?.ask ? (caseIndex === 0 ? enterBeats.length : 0) + sc.situation.length : -1;

  // Play the situation when a case opens: by itself if the learner has already interacted and not
  // finished this case; otherwise it waits behind a play button. The chapter card precedes the first case.
  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (!sc || opened.current === sc.scenarioId) return;
    opened.current = sc.scenarioId;
    const fresh = !answeredCase(sc);
    if (fresh) stage.runBeats(situationKey, situationBeats(sc, caseIndex === 0 && !done), { autoplay: isPlaybackUnlocked() });
    else {
      const last = sc.options.find((o) => o.id === history.at(-1));
      if (last) stage.runBeats(`fb:${sc.scenarioId}:${last.id}`, last.feedbackBeats, { autoplay: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc?.scenarioId]);

  // The decision opens while the question is asked (or when a situation that ends with its question is over).
  const onSituation = stage.state.key === situationKey;
  const atAsk = onSituation && askIndex >= 0 && stage.state.index === askIndex && stage.state.status === 'playing';
  const situationEnded = onSituation && stage.state.status === 'ended';
  useEffect(() => {
    if (step !== 'situation' || history.length) return;
    if (atAsk || (situationEnded && askIndex < 0)) setStep('decide');
  }, [step, atAsk, situationEnded, askIndex, history.length, setStep]);

  useEffect(() => {
    if (step === 'decide') shownAt.current = nowMs();
  }, [step, caseIndex]);

  const answered = history.length > 0;
  const option = sc?.options.find((o) => o.id === shown);
  const feedbackKey = sc && option ? `fb:${sc.scenarioId}:${option.id}` : '';
  const feedbackEnded = stage.state.key === feedbackKey && stage.state.status === 'ended';
  const isLast = caseIndex === cases.length - 1;
  const order = sc ? optionOrder(sc.options, `${sc.scenarioId}:${history.length}`) : [];

  const goSituation = () => {
    if (!sc) return;
    setStep('situation');
    stage.runBeats(situationKey, situationBeats(sc, false), { autoplay: true });
  };
  const goDecide = () => {
    if (!sc) return;
    setStep('decide');
    // Ask the question aloud, unless it is being asked already.
    if (sc.ask && !atAsk) stage.runBeats(`ask:${sc.scenarioId}`, sc.ask, { autoplay: true });
    else if (!sc.ask && stage.state.status === 'playing' && !onSituation) stage.pause();
  };
  const tryAgain = () => {
    setSelected(null);
    setShown(null);
    setStep('decide');
    if (stage.state.status === 'playing') stage.pause();
  };
  const goFeedback = () => {
    if (!option) return;
    setStep('feedback');
    stage.runBeats(feedbackKey, option.feedbackBeats, { autoplay: true });
  };
  const prevCase = () => {
    const prev = cases[caseIndex - 1];
    if (!prev) return;
    setCaseIndex(caseIndex - 1);
    setSelected(null);
    setShown(state.answers[prev.scenarioId]?.at(-1) ?? null);
    setStep('feedback');
  };
  const nextCase = () => {
    setCaseIndex((i) => i + 1);
    setSelected(null);
    setShown(null);
    setStep('situation');
  };

  const check = () => {
    if (!sc) return;
    const chosen = sc.options.find((o) => o.id === selected);
    if (!chosen) return;
    dispatch({ type: 'ANSWER_PRACTICE', scenarioId: sc.scenarioId, optionId: chosen.id });
    track(
      'question_answered',
      { questionId: sc.scenarioId, answerId: chosen.id, isCorrect: chosen.rating === 'preferred', attemptNumber: history.length + 1, responseTimeMs: elapsedMs(shownAt.current), mode: 'practice' },
      { scenarioId: sc.scenarioId },
    );
    setShown(chosen.id);
    setStep('feedback');
    // The answer's own narrated feedback replaces whatever was playing.
    stage.runBeats(`fb:${sc.scenarioId}:${chosen.id}`, chosen.feedbackBeats, { autoplay: true });
  };

  const steps: StepInfo[] = [
    { label: ui.scenario.steps[0]!, reachable: true, done: answered || situationEnded },
    { label: ui.scenario.steps[1]!, reachable: true, done: answered },
    { label: ui.scenario.steps[2]!, reachable: Boolean(option), done: feedbackEnded },
  ];

  useScreenNav(
    screen.screenId,
    step === 'situation'
      ? { next: { label: ui.nav.toDecision, enabled: true, run: goDecide }, back: caseIndex > 0 ? prevCase : undefined, ready: situationEnded }
      : step === 'decide'
        ? { next: { label: ui.nav.toFeedback, enabled: Boolean(option), run: goFeedback }, back: goSituation, ready: Boolean(option), hint: option ? undefined : ui.nav.decide }
        : isLast
          ? { back: tryAgain, ready: true, hint: ui.nav.casesDone }
          : { next: { label: ui.nav.nextCase, enabled: answered, run: nextCase }, back: tryAgain, ready: feedbackEnded, hint: feedbackEnded ? ui.nav.caseDone : undefined },
  );

  if (!sc) return null;

  const onStep = (i: number) => {
    const target = ORDER[i]!;
    if (target === 'situation') goSituation();
    else if (target === 'decide') goDecide();
    else goFeedback();
  };

  const caseChip =
    cases.length > 1 ? (
      <p className="text-sm font-semibold text-ink/65" data-testid="case-counter">
        {fill(ui.scenario.caseOf, { current: caseIndex + 1, total: cases.length })} · {sc.title}
      </p>
    ) : null;

  return (
    <ScreenFrame heading={<ScreenHeading screen={screen} lead={screen.learningObjective} steps={steps} step={ORDER.indexOf(step)} onStep={onStep} />}>
      <h2 tabIndex={-1} data-step-heading className="sr-only">
        {sc.title}: {steps[ORDER.indexOf(step)]!.label}
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-2" data-testid="scenario" data-scenario-id={sc.scenarioId}>
        {caseChip}
        {step === 'situation' && (
          <motion.div key={`s-${sc.scenarioId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-0 flex-1 flex-col">
            <StageViewport label={sc.title} />
          </motion.div>
        )}

        {step === 'decide' && (
          <motion.section
            key={`d-${sc.scenarioId}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 160 }}
            className="mx-auto flex w-full max-w-3xl min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-white p-3.5 shadow-[0_20px_60px_-40px_rgba(11,31,58,0.5)] sm:p-6"
            data-testid="decision"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-ink/70">
                <span className="font-semibold text-violet-ink">{sc.place}</span> · {sc.scene}
              </p>
              <div className="flex gap-1.5">
                <button type="button" onClick={goSituation} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-ink/70 hover:bg-ink/5">
                  <Icon name="replay" className="size-4" />
                  <span className="max-sm:sr-only">{ui.scenario.replaySituation}</span>
                </button>
                {sc.ask && (
                  <button type="button" onClick={() => stage.runBeats(`ask:${sc.scenarioId}`, sc.ask!, { autoplay: true })} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-ink/70 hover:bg-ink/5">
                    <Icon name="volume" className="size-4" />
                    <span className="max-sm:sr-only">{ui.scenario.listen}</span>
                  </button>
                )}
              </div>
            </div>
            {sc.patientLine && (
              <blockquote className="rounded-xl border-s-4 border-violet bg-paper px-4 py-2.5" data-testid="patient-line">
                <p className="text-sm text-ink/60">{fill(ui.scenario.patientSays, { speaker: sc.patientLine.speaker })}</p>
                <p className="font-display text-lg leading-snug sm:text-xl">{sc.patientLine.text}</p>
              </blockquote>
            )}
            <ChoiceList legend={sc.question} options={order} value={selected} onChange={setSelected} />
            <div>
              <button type="button" onClick={check} disabled={selected === null} className="min-h-12 rounded-full bg-navy px-8 font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/25">
                {ui.scenario.check}
              </button>
              <span className="ms-3 text-sm text-ink/60">{ui.scenario.practiceNote}</span>
            </div>
          </motion.section>
        )}

        {step === 'feedback' && option && (
          <motion.div
            key={`f-${sc.scenarioId}-${option.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={split('lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]')}
          >
            <div className={stagePane}>
              <StageViewport label={`${sc.title}: ${ui.scenario.steps[2]}`} />
            </div>
            <AnimatePresence mode="wait">
              <motion.aside
                key={option.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${sidePane} rounded-2xl bg-white p-4 sm:p-5`}
                data-testid="scenario-feedback"
                data-rating={option.rating}
                role="status"
              >
                <p className="flex items-center gap-2 text-lg font-bold">
                  <span aria-hidden className={`grid size-7 place-items-center rounded-full text-white ${option.rating === 'preferred' ? 'bg-navy' : 'bg-ink/55'}`}>
                    <Icon name={option.rating === 'preferred' ? 'check' : 'replay'} className="size-4" strokeWidth={3} />
                  </span>
                  {ui.scenario.verdict[option.rating]}
                </p>
                <div>
                  <p className="text-xs font-semibold text-ink/55">{ui.scenario.yourAnswer}</p>
                  <p className="leading-snug text-ink/80">{option.text}</p>
                </div>
                <p className="leading-relaxed sm:text-lg">{option.feedback}</p>
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs font-semibold text-violet-ink">{ui.scenario.principle}</p>
                  <p className="font-semibold leading-snug text-navy">{sc.principle}</p>
                </div>
                {option.rating !== 'preferred' && (
                  <button type="button" onClick={tryAgain} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-ink/20 px-4 font-medium hover:border-ink/40" data-testid="try-again">
                    <Icon name="replay" className="size-4" />
                    {ui.scenario.retry}
                  </button>
                )}
              </motion.aside>
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </ScreenFrame>
  );
}
