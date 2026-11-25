import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { content, ui } from '../content';
import type { Question } from '../content/schema';
import { useTrack } from '../analytics/TrackContext';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { optionOrder } from '../engine/assessment';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { useStageTime } from '../stage/useStageTime';
import { ChoiceList } from './ChoiceList';
import { ScreenFrame, ScreenHeading, type StepInfo } from './ScreenHeading';
import { elapsedMs, nowMs } from './timing';
import { useEnterSequence } from './useEnterSequence';
import { useSteps } from './useSteps';
import type { ScreenProps } from './types';

type Step = 'learn' | 'check';

/**
 * S07. How service is measured: an animated explainer of the four mechanisms
 * and the improvement loop, then a short knowledge check with immediate feedback.
 */
export function MeasurementScreen({ screen, state, dispatch, done }: ScreenProps) {
  const stage = useStage();
  const interaction = screen.interaction?.type === 'measurement' ? screen.interaction : null;
  const questions = (interaction?.questionIds ?? []).map((id) => content.questions[id]).filter((q): q is Question => Boolean(q));
  const allAnswered = questions.every((q) => (state.answers[q.questionId]?.length ?? 0) > 0);
  const [step, setStep] = useSteps<Step>(allAnswered ? 'check' : 'learn');
  useEnterSequence(done);

  const enter = screen.sequences.enter ?? [];
  const explainerIndex = enter.findIndex((b) => b.kind === 'composition' && b.visual.id === 'measurement');
  const time = useStageTime('enter');
  const onExplainer = stage.state.key === 'enter' && stage.state.index === explainerIndex;
  const chapters = interaction?.chapters ?? [];
  const activeChapter = onExplainer && time !== null ? chapters.reduce((acc, ch, i) => (time >= ch.at ? i : acc), -1) : -1;
  const learnEnded = stage.state.key === 'enter' && stage.state.status === 'ended';

  const goCheck = () => {
    setStep('check');
    if (stage.state.status === 'playing') stage.pause();
  };
  const goLearn = () => {
    setStep('learn');
    if (stage.state.status === 'ended' || stage.state.status === 'empty') stage.run('enter', { autoplay: true, startIndex: Math.max(explainerIndex, 0) });
  };

  const steps: StepInfo[] = [
    { label: ui.measure.steps[0]!, reachable: true, done: learnEnded || allAnswered },
    { label: ui.measure.steps[1]!, reachable: true, done: allAnswered },
  ];
  useScreenNav(
    screen.screenId,
    step === 'learn'
      ? { next: { label: ui.nav.toCheck, enabled: true, run: goCheck }, ready: learnEnded, hint: learnEnded ? ui.nav.watchEnded : undefined }
      : { back: goLearn, ready: allAnswered, hint: allAnswered ? ui.nav.activityDone : ui.nav.checkAll },
  );

  if (!interaction) return null;
  return (
    <ScreenFrame
      heading={<ScreenHeading screen={screen} lead={screen.learningObjective} steps={steps} step={step === 'learn' ? 0 : 1} onStep={(i) => (i === 0 ? goLearn() : goCheck())} />}
    >
      <h2 tabIndex={-1} data-step-heading className="sr-only">
        {steps[step === 'learn' ? 0 : 1]!.label}
      </h2>
      {step === 'learn' ? (
        <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-5">
          <div className="flex min-h-0 flex-col">
            <StageViewport label={screen.title} />
          </div>
          <nav aria-label={ui.measure.index} className="max-lg:hidden">
            <ol className="space-y-1" data-testid="measure-index">
              {chapters.map((ch, i) => (
                <li
                  key={ch.label}
                  aria-current={i === activeChapter ? 'true' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${i === activeChapter ? 'bg-ink text-white' : i < activeChapter || learnEnded ? 'text-ink' : 'text-ink/50'}`}
                >
                  <span className={`font-display text-xl tabular-nums ${i === activeChapter ? 'text-violet-ink' : 'text-ink/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-semibold leading-tight">{ch.label}</span>
                </li>
              ))}
            </ol>
          </nav>
        </motion.div>
      ) : (
        <motion.section key="check" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex w-full max-w-3xl min-h-0 flex-col gap-4 overflow-y-auto" data-testid="knowledge-check">
          <p className="text-sm font-semibold text-violet-ink">{ui.measure.checkTitle}</p>
          {questions.map((q) => (
            <CheckQuestion key={q.questionId} question={q} history={state.answers[q.questionId] ?? []} onAnswer={(optionId) => dispatch({ type: 'ANSWER_QUESTION', questionId: q.questionId, optionId })} />
          ))}
        </motion.section>
      )}
    </ScreenFrame>
  );
}

function CheckQuestion({ question, history, onAnswer }: { question: Question; history: string[]; onAnswer: (optionId: string) => void }) {
  const track = useTrack();
  const last = question.options.find((o) => o.id === history.at(-1));
  const [selected, setSelected] = useState<string | null>(null);
  const [shown, setShown] = useState(last?.id ?? null);
  const shownAt = useRef(0);
  useEffect(() => {
    if (!shown) shownAt.current = nowMs();
  }, [shown]);
  const option = question.options.find((o) => o.id === shown);
  const order = optionOrder(question.options, `${question.questionId}:${history.length}`);

  const check = () => {
    const chosen = question.options.find((o) => o.id === selected);
    if (!chosen) return;
    onAnswer(chosen.id);
    track('question_answered', { questionId: question.questionId, answerId: chosen.id, isCorrect: chosen.correct, attemptNumber: history.length + 1, responseTimeMs: elapsedMs(shownAt.current), mode: 'practice' });
    setShown(chosen.id);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_20px_60px_-40px_rgba(11,31,58,0.5)] sm:p-5" data-testid={`check-${question.questionId}`}>
      <ChoiceList
        legend={question.prompt}
        options={order}
        value={shown ?? selected}
        onChange={setSelected}
        disabled={Boolean(option)}
        size="md"
        mark={(id) => (option && id === option.id ? (option.correct ? 'correct' : 'incorrect') : 'none')}
      />
      <AnimatePresence mode="wait" initial={false}>
        {option ? (
          <motion.div key={`fb-${option.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-wrap items-start justify-between gap-2" role="status" data-testid="check-feedback" data-correct={option.correct}>
            {/* The feedback text opens with its own verdict ("נכון." / "לא בדיוק."). */}
            <p className="leading-relaxed">{option.feedback}</p>
            {!option.correct && (
              <button
                type="button"
                onClick={() => {
                  setShown(null);
                  setSelected(null);
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ink/20 px-4 text-sm font-medium hover:border-ink/40"
              >
                <Icon name="replay" className="size-4" />
                {ui.measure.retry}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
            <button type="button" onClick={check} disabled={selected === null} className="min-h-11 rounded-full bg-navy px-7 font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/25">
              {ui.measure.check}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
