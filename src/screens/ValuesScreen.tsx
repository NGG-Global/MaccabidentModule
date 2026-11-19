import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { content, ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { itemKey } from '../engine/flow';
import { useLiveCaption } from '../stage/CaptionLine';
import { useMediaPrefs } from '../stage/prefs';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { ScreenFrame, ScreenHeading, type StepInfo } from './ScreenHeading';
import { elapsedMs, nowMs } from './timing';
import { useEnterSequence } from './useEnterSequence';
import { useSteps } from './useSteps';
import type { ScreenProps } from './types';

const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));
type Step = 'watch' | 'exercise';

/**
 * S03. Two steps: the three values, each with its own narrated animation and
 * an index to jump between them; then a short exercise, matching each action
 * to its value. Wrong tries are allowed and recorded; the screen is complete
 * when every action is matched correctly, and the exercise summary is then spoken.
 */
export function ValuesScreen({ screen, state, dispatch, done }: ScreenProps) {
  const stage = useStage();
  const track = useTrack();
  const shownAt = useRef(0);
  const interaction = screen.interaction?.type === 'valuesMatch' ? screen.interaction : null;
  const solvedAll = interaction ? interaction.items.every((item) => state.answers[itemKey(screen.screenId, item.id)]?.includes(item.valueId)) : false;
  const [step, setStep] = useSteps<Step>(solvedAll ? 'exercise' : 'watch');
  const [lastItem, setLastItem] = useState<string | null>(null);
  useEnterSequence(done);

  useEffect(() => {
    if (step === 'exercise') shownAt.current = nowMs();
  }, [step]);

  const feedbackKey = interaction?.feedbackSequence;
  const feedbackPlayed = useRef(done);
  // The exercise summary is spoken once every action is matched. It waits for narration that is
  // actually playing; a value narration the learner paused by moving to the exercise does not hold it back.
  useEffect(() => {
    if (step !== 'exercise' || !feedbackKey || feedbackPlayed.current || !solvedAll) return;
    if (stage.state.status === 'playing') return;
    feedbackPlayed.current = true;
    stage.run(feedbackKey, { autoplay: true });
  }, [step, solvedAll, feedbackKey, stage]);

  const onEnter = stage.state.key === 'enter';
  const watchEnded = onEnter && stage.state.status === 'ended';
  const goExercise = () => {
    setStep('exercise');
    if (stage.state.status === 'playing') stage.pause();
  };
  const goWatch = () => {
    setStep('watch');
    if (!onEnter) stage.run('enter', { autoplay: false });
  };

  const steps: StepInfo[] = [
    { label: ui.values.steps[0]!, reachable: true, done: watchEnded || solvedAll },
    { label: ui.values.steps[1]!, reachable: true, done: solvedAll },
  ];

  useScreenNav(
    screen.screenId,
    step === 'watch'
      ? { next: { label: ui.nav.toExercise, enabled: true, run: goExercise }, ready: watchEnded, hint: watchEnded ? ui.nav.watchEnded : undefined }
      : { back: goWatch, ready: solvedAll, hint: solvedAll ? ui.nav.activityDone : ui.nav.matchAll },
  );

  if (!interaction) return null;
  const values = content.values.values;
  const nameOf = (id: string) => values.find((v) => v.id === id)?.name ?? id;
  const matched = interaction.items.filter((item) => state.answers[itemKey(screen.screenId, item.id)]?.includes(item.valueId)).length;

  const choose = (itemId: string, valueId: string, correctId: string) => {
    const key = itemKey(screen.screenId, itemId);
    const attempts = state.answers[key]?.length ?? 0;
    dispatch({ type: 'MATCH_VALUE', itemId, valueId });
    setLastItem(itemId);
    track('question_answered', {
      questionId: key,
      answerId: valueId,
      isCorrect: valueId === correctId,
      attemptNumber: attempts + 1,
      responseTimeMs: elapsedMs(shownAt.current),
    });
  };

  return (
    <ScreenFrame
      heading={<ScreenHeading screen={screen} lead={screen.learningObjective} steps={steps} step={step === 'watch' ? 0 : 1} onStep={(i) => (i === 0 ? goWatch() : goExercise())} />}
    >
      <h2 tabIndex={-1} data-step-heading className="sr-only">
        {steps[step === 'watch' ? 0 : 1]!.label}
      </h2>
      {step === 'watch' ? (
        <motion.div key="watch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_15rem] lg:gap-6">
          <StageViewport label={screen.title} />
          <nav aria-label={ui.values.index} className="hidden lg:block">
            <h3 className="mb-2 text-sm font-semibold text-ink/60">{ui.values.index}</h3>
            <ol className="space-y-1">
              {interaction.chapters.map((chapter, i) => {
                const current = onEnter && stage.state.index === chapter.beatIndex && stage.state.status !== 'ended';
                const passed = onEnter && (stage.state.index > chapter.beatIndex || stage.state.status === 'ended');
                return (
                  <li key={chapter.valueId}>
                    <button
                      type="button"
                      aria-current={current ? 'true' : undefined}
                      onClick={() => (onEnter ? stage.goToBeat(chapter.beatIndex) : stage.run('enter', { autoplay: true, startIndex: chapter.beatIndex }))}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${current ? 'bg-ink text-white' : 'hover:bg-white'}`}
                    >
                      <span className={`font-display text-2xl tabular-nums ${current ? 'text-violet' : 'text-ink/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex-1">
                        <span className="block font-display text-lg font-semibold leading-tight">{nameOf(chapter.valueId)}</span>
                        <span className={`flex items-center gap-1 text-sm ${current ? 'text-mist' : 'text-ink/55'}`}>
                          {passed && !current && <Icon name="check" className="size-3.5" strokeWidth={3} />}
                          {current ? ui.stage.nowPlaying : ui.values.play}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </motion.div>
      ) : (
        <motion.section
          key="exercise"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 160 }}
          aria-labelledby="exercise-heading"
          className="mx-auto flex w-full max-w-4xl flex-col gap-2.5 rounded-2xl bg-white p-3.5 shadow-[0_20px_60px_-40px_rgba(11,31,58,0.5)] sm:gap-3 sm:p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-violet sm:text-sm">{ui.values.exercise}</p>
              <h3 id="exercise-heading" className="font-display text-xl font-semibold sm:text-2xl">
                {interaction.prompt}
              </h3>
            </div>
            <p className="flex items-center gap-2 text-sm text-ink/65" data-testid="match-progress" aria-live="polite">
              <span aria-hidden className="flex gap-1">
                {interaction.items.map((item) => (
                  <span key={item.id} className={`size-2 rounded-full ${state.answers[itemKey(screen.screenId, item.id)]?.includes(item.valueId) ? 'bg-navy' : 'bg-ink/15'}`} />
                ))}
              </span>
              {fill(ui.values.progress, { done: matched, total: interaction.items.length })}
            </p>
          </div>

          <ol className="space-y-2">
            {interaction.items.map((item, i) => {
              const history = state.answers[itemKey(screen.screenId, item.id)] ?? [];
              const solved = history.includes(item.valueId);
              const last = history.at(-1);
              const showFeedback = last !== undefined && lastItem === item.id;
              return (
                <li key={item.id} className={`rounded-xl border px-3 py-1.5 sm:px-4 sm:py-2.5 ${solved ? 'border-navy/20 bg-brand-50/60' : 'border-ink/10'}`} data-testid={`match-${item.id}`}>
                  <div>
                    <div className={`flex gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${solved ? 'flex-wrap items-center justify-between gap-y-1' : 'flex-col'}`}>
                      <p id={`item-${item.id}`} className="flex items-baseline gap-2 text-[15px] font-semibold leading-snug sm:text-lg">
                        <span aria-hidden className="font-display text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                        {item.text}
                      </p>
                      {solved ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-sm font-semibold text-white">
                          <Icon name="check" className="size-4" strokeWidth={3} />
                          {nameOf(item.valueId)}
                        </span>
                      ) : (
                        <div className="grid shrink-0 grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:justify-end" role="group" aria-labelledby={`item-${item.id}`} aria-describedby={`choose-${item.id}`}>
                          <span id={`choose-${item.id}`} className="sr-only">{ui.values.choose}</span>
                          {values.map((v) => {
                            const wrong = history.includes(v.id);
                            return (
                              <button
                                key={v.id}
                                type="button"
                                aria-pressed={last === v.id}
                                onClick={() => choose(item.id, v.id, item.valueId)}
                                className={`min-h-11 rounded-lg border-2 px-1.5 py-1 text-[13px] font-medium leading-tight transition sm:rounded-full sm:px-4 sm:text-sm ${
                                  wrong ? 'border-ink/30 bg-paper text-ink/55 line-through decoration-ink/40' : 'border-ink/15 hover:border-navy/50 hover:bg-brand-50'
                                }`}
                              >
                                {v.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      {showFeedback && (
                        <motion.p
                          key={`${last}-${history.length}`}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          role="status"
                          className={`pt-2 text-sm leading-relaxed sm:text-base ${solved ? 'text-navy' : 'text-ink/75'}`}
                        >
                          <strong>{solved ? ui.values.correct : ui.values.incorrect}</strong>
                          {solved && <> {item.feedback}</>}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ol>

          {solvedAll && <ExerciseSummary feedbackKey={feedbackKey} onListen={() => (feedbackPlayed.current = true)} />}
        </motion.section>
      )}
    </ScreenFrame>
  );
}

/** Once all actions are matched: a short statement and the spoken summary with its live caption. */
function ExerciseSummary({ feedbackKey, onListen }: { feedbackKey?: string; onListen: () => void }) {
  const stage = useStage();
  const { captions } = useMediaPrefs();
  const text = useLiveCaption();
  const speaking = stage.state.key === feedbackKey && (stage.state.status === 'playing' || stage.state.status === 'paused');
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-ink px-4 py-2.5 text-white" data-testid="exercise-summary">
      <p className="flex min-w-0 flex-1 items-start gap-2">
        <Icon name="check" className="mt-0.5 size-5 text-violet" strokeWidth={3} />
        <span className="min-w-0">
          <strong className="block">{ui.values.allDone}</strong>
          {speaking && captions && (
            <span aria-hidden className="line-clamp-2 text-sm text-mist">
              {text}
            </span>
          )}
        </span>
      </p>
      {feedbackKey && (
        <button
          type="button"
          onClick={() => {
            onListen();
            if (speaking) {
              if (stage.state.status === 'playing') stage.pause();
              else stage.play();
            } else stage.run(feedbackKey, { autoplay: true });
          }}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-paper px-4 text-sm font-semibold text-navy"
        >
          <Icon name={speaking && stage.state.status === 'playing' ? 'pause' : 'play'} className="size-4" />
          {speaking && stage.state.status === 'playing' ? (
            ui.stage.pause
          ) : (
            <>
              <span className="max-sm:hidden">{ui.values.listen}</span>
              <span className="sm:hidden" aria-hidden>
                {ui.values.listenShort}
              </span>
              <span className="sr-only sm:hidden">{ui.values.listen}</span>
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
