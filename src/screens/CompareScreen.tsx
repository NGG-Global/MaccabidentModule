import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { content, ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { resolveMedia } from '../media/resolveMedia';
import { useMediaPrefs } from '../stage/prefs';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { ScreenFrame, ScreenHeading, type StepInfo } from './ScreenHeading';
import { elapsedMs, nowMs } from './timing';
import { useEnterSequence } from './useEnterSequence';
import { useSteps } from './useSteps';
import type { ScreenProps } from './types';

type Step = 'watch' | 'question' | 'explain';
const ORDER: Step[] = ['watch', 'question', 'explain'];

/**
 * S02. Yossi's arrival, two ways, in three steps: watch both versions in the
 * frame (each labelled while it plays), answer the question while its
 * narration asks it, then the narrated, animated explanation.
 */
export function CompareScreen({ screen, state, dispatch, done }: ScreenProps) {
  const stage = useStage();
  const track = useTrack();
  const prefs = useMediaPrefs();
  const interaction = screen.interaction?.type === 'compare' ? screen.interaction : null;
  const question = interaction ? content.questions[interaction.questionId] : undefined;
  const history = (question && state.answers[question.questionId]) || [];
  const answered = history.length > 0;
  const [step, setStep] = useSteps<Step>(answered ? 'question' : 'watch');
  useEnterSequence(done);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(history.at(-1) ?? null);
  const shownAt = useRef(0);

  // The question narration is the first narration after the videos. Reaching it in playback opens the question.
  const enter = screen.sequences.enter ?? [];
  const questionBeat = enter.findIndex((b, i) => i > 0 && b.kind === 'narration' && enter[i - 1]?.kind === 'video');
  const atQuestionBeat = stage.state.key === 'enter' && stage.state.index === questionBeat && questionBeat >= 0;
  useEffect(() => {
    if (step === 'watch' && atQuestionBeat && stage.state.status === 'playing') setStep('question');
  }, [step, atQuestionBeat, stage.state.status, setStep]);

  useEffect(() => {
    if (step === 'question' && submitted === null) shownAt.current = nowMs();
  }, [step, submitted]);

  const watchEnded = stage.state.status === 'ended' && (stage.state.key === 'enter' || Boolean(stage.state.key?.startsWith('replay:')));
  const explainEnded = stage.state.key === question?.feedbackSequence && stage.state.status === 'ended';

  const goQuestion = () => {
    setStep('question');
    // Ask the question aloud, unless it is already being asked or the learner has answered before.
    if (!answered && !atQuestionBeat && questionBeat >= 0) stage.run('enter', { startIndex: questionBeat, autoplay: true });
    else if (stage.state.status === 'playing' && !atQuestionBeat) stage.pause();
  };
  const goWatch = () => {
    setStep('watch');
    // Start the film over rather than land on the question narration.
    if (stage.state.key !== 'enter' || atQuestionBeat || stage.state.status === 'ended') stage.run('enter', { autoplay: false });
  };
  const goExplain = () => {
    setStep('explain');
    if (question?.feedbackSequence) stage.run(question.feedbackSequence, { autoplay: true });
  };
  const backToQuestion = () => {
    setStep('question');
    if (stage.state.status === 'playing') stage.pause();
  };
  const rewatch = (mediaId: string, label: string) => {
    setStep('watch');
    stage.runBeats(`replay:${mediaId}`, [{ kind: 'video', mediaId, label }], { autoplay: true });
  };

  const steps: StepInfo[] = [
    { label: ui.compare.steps[0]!, reachable: true, done: answered || watchEnded },
    { label: ui.compare.steps[1]!, reachable: true, done: answered },
    { label: ui.compare.steps[2]!, reachable: answered, done: explainEnded },
  ];

  useScreenNav(
    screen.screenId,
    step === 'watch'
      ? { next: { label: ui.nav.toQuestion, enabled: true, run: goQuestion }, ready: watchEnded, hint: watchEnded ? ui.nav.watchEnded : ui.nav.canSkipWatch }
      : step === 'question'
        ? { next: { label: ui.nav.toExplanation, enabled: answered, run: goExplain }, back: goWatch, ready: answered, hint: answered ? undefined : ui.nav.answerQuestion }
        : { back: backToQuestion, ready: explainEnded, hint: explainEnded ? ui.nav.activityDone : undefined },
  );

  if (!interaction || !question) return null;
  const option = question.options.find((o) => o.id === submitted);
  const versionLabel = (mediaId: string) => interaction.versions.find((v) => v.mediaId === mediaId)?.label;

  const check = () => {
    const chosen = question.options.find((o) => o.id === selected);
    if (!chosen) return;
    dispatch({ type: 'ANSWER_QUESTION', questionId: question.questionId, optionId: chosen.id });
    track('question_answered', {
      questionId: question.questionId,
      answerId: chosen.id,
      isCorrect: chosen.correct,
      attemptNumber: history.length + 1,
      responseTimeMs: elapsedMs(shownAt.current),
    });
    setSubmitted(chosen.id);
    // The question narration has done its job once an answer is in.
    if (atQuestionBeat && stage.state.status === 'playing') stage.pause();
  };

  const onStep = (i: number) => {
    const target = ORDER[i]!;
    if (target === 'watch') goWatch();
    else if (target === 'question') goQuestion();
    else goExplain();
  };

  const asking = atQuestionBeat && (stage.state.status === 'playing' || stage.state.status === 'paused');

  return (
    <ScreenFrame heading={<ScreenHeading screen={screen} lead={screen.learningObjective} steps={steps} step={ORDER.indexOf(step)} onStep={onStep} />}>
      <h2 tabIndex={-1} data-step-heading className="sr-only">
        {steps[ORDER.indexOf(step)]!.label}
      </h2>
      {step !== 'question' ? (
        <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-0 flex-1 flex-col">
          <StageViewport label={screen.title} />
        </motion.div>
      ) : (
        <motion.section
          key="question"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 160 }}
          aria-labelledby="question-heading"
          className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl bg-white p-3.5 shadow-[0_20px_60px_-40px_rgba(11,31,58,0.5)] sm:p-6 sm:[@media(max-height:42rem)]:p-4"
          data-testid="question"
        >
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2" data-testid="rewatch">
              <span className="text-ink/65 max-[380px]:sr-only">{ui.compare.rewatch}</span>
              {interaction.versions.map((v) => {
                const poster = content.media[v.mediaId]?.posterId ? resolveMedia(content.media, content.media[v.mediaId]!.posterId!) : undefined;
                return (
                  <button
                    key={v.mediaId}
                    type="button"
                    data-testid={`version-${v.mediaId}`}
                    onClick={() => rewatch(v.mediaId, v.label)}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-ink/15 bg-paper py-1 ps-1 pe-3 font-medium hover:border-ink/35"
                  >
                    {poster?.status === 'ready' ? (
                      <img src={poster.url} alt="" className="h-7 w-11 rounded-full object-cover max-sm:w-7" />
                    ) : (
                      <Icon name="play" className="size-4" />
                    )}
                    {versionLabel(v.mediaId)}
                  </button>
                );
              })}
            </div>
            {asking ? (
              <button
                type="button"
                onClick={stage.state.status === 'playing' ? stage.pause : stage.play}
                className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-full px-2.5 text-ink/70 hover:bg-ink/5"
                aria-label={`${ui.compare.questionNarration}: ${stage.state.status === 'playing' ? ui.stage.pause : ui.stage.play}`}
              >
                <Icon name={stage.state.status === 'playing' ? 'pause' : 'play'} className="size-4" />
                <span className="max-sm:hidden">{ui.compare.questionNarration}</span>
                <span aria-hidden className="sm:hidden">{ui.compare.narrationShort}</span>
              </button>
            ) : (
              questionBeat >= 0 && (
                <button
                  type="button"
                  onClick={() => stage.run('enter', { startIndex: questionBeat, autoplay: true })}
                  className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-full px-2.5 text-ink/70 hover:bg-ink/5"
                >
                  <Icon name={prefs.muted ? 'muted' : 'volume'} className="size-4" />
                  <span className="max-sm:sr-only">{ui.compare.listenQuestion}</span>
                  <span aria-hidden className="sm:hidden">{ui.compare.narrationShort}</span>
                </button>
              )
            )}
          </div>

          <fieldset disabled={submitted !== null && option?.correct}>
            <legend id="question-heading" className="mb-2.5 font-display text-xl font-semibold leading-snug sm:mb-3 sm:text-2xl">
              {question.prompt}
            </legend>
            <div className="space-y-2">
              {question.options.map((o) => {
                const isSelected = (submitted ?? selected) === o.id;
                const resolved = submitted === o.id;
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3.5 py-2.5 transition sm:px-4 ${submitted !== null && !resolved ? 'max-sm:hidden' : ''} has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${
                      resolved ? (o.correct ? 'border-navy bg-brand-50' : 'border-ink/40 bg-paper') : isSelected ? 'border-violet bg-paper' : 'border-ink/12 hover:border-ink/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="compare"
                      value={o.id}
                      checked={isSelected}
                      disabled={submitted !== null}
                      onChange={() => setSelected(o.id)}
                      className="mt-1 size-5 shrink-0 accent-[var(--color-navy)]"
                    />
                    <span className="text-base leading-snug sm:text-lg">{o.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <AnimatePresence mode="wait" initial={false}>
            {option ? (
              <motion.div key={`fb-${option.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5" role="status" data-testid="feedback" data-correct={option.correct}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-bold sm:text-lg">
                    <span aria-hidden className={`grid size-6 place-items-center rounded-full text-white ${option.correct ? 'bg-navy' : 'bg-ink/60'}`}>
                      <Icon name={option.correct ? 'check' : 'close'} className="size-3.5" strokeWidth={3} />
                    </span>
                    {option.correct ? ui.compare.correct : ui.compare.incorrect}
                  </p>
                  {!option.correct && (
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ink/20 px-4 text-sm font-medium hover:border-ink/40"
                      onClick={() => {
                        setSubmitted(null);
                        setSelected(null);
                      }}
                    >
                      <Icon name="replay" className="size-4" />
                      {ui.compare.retry}
                    </button>
                  )}
                </div>
                <p className="leading-relaxed sm:text-lg">{option.feedback}</p>
              </motion.div>
            ) : (
              <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button type="button" onClick={check} disabled={selected === null} className="min-h-12 rounded-full bg-navy px-8 font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/25">
                  {ui.compare.check}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </ScreenFrame>
  );
}
