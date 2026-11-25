import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { content, ui } from '../content';
import { ROLES, type Beat, type Question } from '../content/schema';
import { useTrack } from '../analytics/TrackContext';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { drawAssessment, optionOrder } from '../engine/assessment';
import type { AssessmentAttempt } from '../engine/flow';
import { scoreAssessment } from '../engine/scoring';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { ChoiceList } from './ChoiceList';
import { ScreenFrame, ScreenHeading, type StepInfo } from './ScreenHeading';
import { elapsedMs, nowMs } from './timing';
import { useEnterSequence } from './useEnterSequence';
import { sidePane, split, stagePane } from './layout';
import { useSteps } from './useSteps';
import type { ScreenProps } from './types';

type Step = 'intro' | 'questions' | 'result';
const ORDER: Step[] = ['intro', 'questions', 'result'];
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));

/**
 * S08. The scored assessment: shared and role questions, one at a time and
 * without feedback; after submission the score, pass status, a review of every
 * question with its explanation, areas to strengthen, and a retry when failed.
 */
export function AssessmentScreen({ screen, state, dispatch, done }: ScreenProps) {
  const stage = useStage();
  const track = useTrack();
  const cfg = content.course.assessment;
  const interaction = screen.interaction?.type === 'assessment' ? screen.interaction : null;
  const role = state.role ?? ROLES[0];
  const latest = state.attempts.at(-1);
  const [step, setStep] = useSteps<Step>(latest ? 'result' : 'intro');
  useEnterSequence(done);

  const attemptNumber = state.attempts.length + (step === 'result' ? 0 : 1);
  const drawn = useMemo(
    () => (interaction ? drawAssessment(interaction, content.questions, role, Math.max(attemptNumber, 1)) : []),
    [interaction, role, attemptNumber],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [qIndex, setQIndex] = useState(0);
  const startedAt = useRef(0);

  const resultQuestions: Question[] = latest ? latest.answers.map((a) => content.questions[a.questionId]).filter((q): q is Question => Boolean(q)) : [];
  const unanswered = drawn.filter((q) => !answers[q.questionId]).length;

  const resultBeats = (attempt: AssessmentAttempt): Beat[] => [
    {
      kind: 'composition',
      durationSec: 5,
      label: ui.assessment.scoreLabel,
      visual: {
        id: 'assessmentResult',
        props: {
          percent: attempt.percent,
          threshold: cfg.passThreshold,
          passed: attempt.passed,
          correct: Math.round(attempt.score / cfg.pointsPerDecision),
          total: attempt.answers.length,
          passedText: ui.assessment.resultPassed,
          failedText: ui.assessment.resultFailed,
        },
      },
    },
    ...(screen.sequences.result ?? []),
  ];

  const start = () => {
    setAnswers({});
    setQIndex(0);
    setStep('questions');
    startedAt.current = nowMs();
    if (stage.state.status === 'playing') stage.pause();
    track('assessment_started', { attemptNumber, questionIds: drawn.map((q) => q.questionId) });
  };
  const submit = () => {
    if (unanswered > 0) return;
    const list = drawn.map((q) => ({ questionId: q.questionId, optionId: answers[q.questionId]! }));
    const result = scoreAssessment(list, content.questions, cfg);
    const attempt: AssessmentAttempt = {
      attemptId: `attempt-${attemptNumber}`,
      attemptNumber,
      answers: list,
      score: result.score,
      maxScore: result.maxScore,
      percent: result.percent,
      passed: result.passed,
      criticalMisses: result.criticalMisses,
      completedAt: new Date().toISOString(),
    };
    dispatch({ type: 'RECORD_ATTEMPT', attempt });
    const ms = elapsedMs(startedAt.current);
    result.perDecision.forEach((d) =>
      track('question_answered', { questionId: d.questionId, answerId: d.optionId, isCorrect: d.correct, attemptNumber, responseTimeMs: ms, mode: 'assessment' }, { attemptId: attempt.attemptId }),
    );
    track('assessment_completed', { attemptNumber, score: result.score, maxScore: result.maxScore, percent: result.percent, passed: result.passed }, { attemptId: attempt.attemptId });
    setStep('result');
    stage.runBeats(`result:${attempt.attemptId}`, resultBeats(attempt), { autoplay: true });
  };

  const current = drawn[qIndex];
  const isLastQ = qIndex === drawn.length - 1;
  const steps: StepInfo[] = [
    { label: ui.assessment.steps[0]!, reachable: step !== 'questions', done: step !== 'intro' },
    { label: ui.assessment.steps[1]!, reachable: false, done: Boolean(latest) && step === 'result' },
    { label: ui.assessment.steps[2]!, reachable: Boolean(latest) && step !== 'questions', done: Boolean(latest) && step === 'result' },
  ];

  useScreenNav(
    screen.screenId,
    step === 'intro'
      ? { next: { label: ui.nav.startAssessment, enabled: drawn.length > 0, run: start }, back: latest ? () => setStep('result') : undefined, ready: true }
      : step === 'questions'
        ? isLastQ
          ? { next: { label: ui.nav.submit, enabled: unanswered === 0, run: submit }, back: () => setQIndex((i) => Math.max(0, i - 1)), ready: unanswered === 0, hint: unanswered ? fill(ui.assessment.unanswered, { count: unanswered }) : undefined }
          : { next: { label: ui.nav.assessmentNext, enabled: true, run: () => setQIndex((i) => i + 1) }, back: qIndex > 0 ? () => setQIndex((i) => i - 1) : () => setStep('intro'), ready: Boolean(current && answers[current.questionId]) }
        : { ready: true, hint: latest?.passed ? ui.nav.assessmentPassed : ui.nav.assessmentFailed },
  );

  if (!interaction) return null;

  return (
    <ScreenFrame heading={<ScreenHeading screen={screen} lead={screen.learningObjective} steps={steps} step={ORDER.indexOf(step)} onStep={(i) => ORDER[i] === 'result' && setStep('result')} />}>
      <h2 tabIndex={-1} data-step-heading className="sr-only">
        {steps[ORDER.indexOf(step)]!.label}
      </h2>
      {step === 'intro' && (
        <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={split('lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,1fr)]')}>
          <div className={stagePane}>
            <StageViewport label={screen.title} />
          </div>
          <section className={`${sidePane} justify-center gap-4 rounded-2xl bg-white p-5 sm:p-7`} data-testid="assessment-intro">
            <h3 className="font-display text-2xl font-bold text-navy sm:text-3xl">{ui.assessment.introTitle}</h3>
            <ul className="space-y-2.5">
              {ui.assessment.rules.map((rule) => (
                <li key={rule} className="flex items-start gap-3 text-lg leading-snug">
                  <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-violet" />
                  {fill(rule, { count: interaction.commonCount + interaction.roleCount, common: interaction.commonCount, role: interaction.roleCount, points: cfg.pointsPerDecision, threshold: cfg.passThreshold })}
                </li>
              ))}
            </ul>
            {latest && <p className="text-sm text-ink/60">{fill(ui.assessment.attempt, { n: attemptNumber })}</p>}
            <p className="text-xs text-ink/50">{ui.assessment.proposedNote}</p>
          </section>
        </motion.div>
      )}

      {step === 'questions' && current && (
        <motion.section key="questions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex w-full max-w-3xl min-h-0 flex-col gap-3 overflow-y-auto" data-testid="assessment-question" data-question-id={current.questionId}>
          <div className="flex items-center gap-3" aria-hidden>
            {drawn.map((q, i) => (
              <span key={q.questionId} className={`h-1.5 flex-1 rounded-full ${i === qIndex ? 'bg-violet' : answers[q.questionId] ? 'bg-navy' : 'bg-ink/12'}`} />
            ))}
          </div>
          <p className="text-sm font-semibold text-ink/65" data-testid="question-counter">
            {fill(ui.assessment.questionOf, { current: qIndex + 1, total: drawn.length })}
          </p>
          <AnimatePresence mode="wait">
            <motion.div key={current.questionId} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="rounded-2xl bg-white p-4 shadow-[0_20px_60px_-40px_rgba(11,31,58,0.5)] sm:p-6">
              <ChoiceList
                legend={current.prompt}
                options={optionOrder(current.options, `${current.questionId}:${attemptNumber}`)}
                value={answers[current.questionId] ?? null}
                onChange={(id) => setAnswers((a) => ({ ...a, [current.questionId]: id }))}
              />
            </motion.div>
          </AnimatePresence>
        </motion.section>
      )}

      {step === 'result' && latest && (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={split('lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1.1fr)]')}>
          <div className="flex flex-col gap-3 lg:min-h-0">
            <div className={`${stagePane} lg:flex-1`}>
              <StageViewport label={ui.assessment.scoreLabel} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3" data-testid="assessment-score" data-passed={latest.passed}>
              <p>
                <span className="text-sm text-ink/60">{ui.assessment.scoreLabel} </span>
                <strong className="font-display text-3xl text-navy">
                  <bdi>{latest.percent}</bdi>
                </strong>
                <span className="ms-2 font-semibold">{latest.passed ? ui.assessment.passed : ui.assessment.failed}</span>
                <span className="ms-2 text-sm text-ink/60">{fill(ui.assessment.threshold, { threshold: cfg.passThreshold })}</span>
              </p>
              {!latest.passed && (
                <button type="button" onClick={() => setStep('intro')} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 font-semibold text-white" data-testid="assessment-retry">
                  <Icon name="restart" className="size-4" />
                  {ui.assessment.retry}
                </button>
              )}
            </div>
          </div>
          <section aria-label={ui.assessment.review} className={`${sidePane} rounded-2xl bg-white p-4 sm:p-5`} data-testid="assessment-review">
            <Improve attempt={latest} questions={resultQuestions} />
            <h3 className="font-semibold text-ink/70">{ui.assessment.review}</h3>
            <ol className="space-y-3">
              {latest.answers.map((a, i) => {
                const q = content.questions[a.questionId];
                if (!q) return null;
                const chosen = q.options.find((o) => o.id === a.optionId);
                const right = q.options.find((o) => o.correct)!;
                const ok = chosen?.correct === true;
                return (
                  <li key={a.questionId} className="border-t border-ink/10 pt-3 first:border-t-0 first:pt-0" data-testid={`review-${a.questionId}`} data-correct={ok}>
                    <p className="flex items-start gap-2 font-semibold leading-snug">
                      <span aria-hidden className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white ${ok ? 'bg-navy' : 'bg-ink/55'}`}>
                        <Icon name={ok ? 'check' : 'close'} className="size-3.5" strokeWidth={3} />
                      </span>
                      <span>
                        {i + 1}. {q.prompt}
                      </span>
                    </p>
                    <p className="ms-8 mt-1 text-sm">
                      <span className="text-ink/55">{ui.assessment.yourAnswer}: </span>
                      {chosen?.text ?? ui.assessment.noAnswer}
                    </p>
                    {!ok && (
                      <p className="ms-8 text-sm">
                        <span className="text-ink/55">{ui.assessment.correctAnswer}: </span>
                        <strong>{right.text}</strong>
                      </p>
                    )}
                    {q.explanation && <p className="ms-8 mt-1 text-sm leading-relaxed text-ink/75">{q.explanation}</p>}
                  </li>
                );
              })}
            </ol>
          </section>
        </motion.div>
      )}
    </ScreenFrame>
  );
}

/** Areas to strengthen: the skill of every missed question, critical ones first. */
function Improve({ attempt, questions }: { attempt: AssessmentAttempt; questions: Question[] }) {
  const missed = attempt.answers
    .map((a) => questions.find((q) => q.questionId === a.questionId))
    .filter((q): q is Question => Boolean(q) && !q!.options.find((o) => o.id === attempt.answers.find((a) => a.questionId === q!.questionId)?.optionId)?.correct);
  if (!missed.length) return null;
  const sorted = [...missed].sort((a, b) => Number(Boolean(b.critical)) - Number(Boolean(a.critical)));
  return (
    <div className="rounded-xl bg-paper p-3" data-testid="assessment-improve">
      <p className="text-xs font-semibold text-violet-ink">{ui.assessment.improve}</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {sorted.map((q) => (
          <li key={q.questionId} className={`rounded-full px-3 py-1 text-sm font-medium ${q.critical ? 'bg-ink text-white' : 'bg-white'}`}>
            {q.skill ?? q.prompt}
            {q.critical && <span className="sr-only"> ({ui.assessment.critical})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
