import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { content, ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { StageControls } from '../stage/StageControls';
import { useStage } from '../stage/StageProvider';
import { resolveMedia } from '../media/resolveMedia';
import { StageViewport } from '../stage/StageViewport';
import { ScreenHeading } from './ScreenHeading';
import { elapsedMs, nowMs } from './timing';
import { useEnterSequence } from './useEnterSequence';
import type { ScreenProps } from './types';

/**
 * S02. Yossi's arrival, two ways. The two versions sit side by side with the
 * same framing; the question appears once both have been shown, and the
 * narrated, animated explanation follows the learner's answer.
 */
export function CompareScreen({ screen, state, dispatch, done }: ScreenProps) {
  useEnterSequence(done);
  const stage = useStage();
  const track = useTrack();
  const interaction = screen.interaction?.type === 'compare' ? screen.interaction : null;
  const question = interaction ? content.questions[interaction.questionId] : undefined;
  const history = (question && state.answers[question.questionId]) || [];
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(history.at(-1) ?? null);
  const [revealed, setRevealed] = useState(history.length > 0);
  const shownAt = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // Reveal the question when the enter sequence reaches the question narration (after both videos) or ends.
  // Latched during render (derived-state pattern), so replaying a video later does not hide it again.
  const enter = screen.sequences.enter ?? [];
  const questionBeat = enter.findIndex((b, i) => i > 0 && b.kind === 'narration' && enter[i - 1]?.kind === 'video');
  const reached = stage.state.key === 'enter' && (stage.state.index >= questionBeat || stage.state.status === 'ended');
  if (reached && !revealed) setRevealed(true);
  useEffect(() => {
    if (revealed && submitted === null) shownAt.current = nowMs();
  }, [revealed, submitted]);

  if (!interaction || !question) return null;
  const option = question.options.find((o) => o.id === submitted);

  const check = () => {
    const chosen = question.options.find((o) => o.id === selected);
    if (!chosen) return;
    const first = history.length === 0;
    dispatch({ type: 'ANSWER_QUESTION', questionId: question.questionId, optionId: chosen.id });
    track(
      'question_answered',
      {
        questionId: question.questionId,
        answerId: chosen.id,
        isCorrect: chosen.correct,
        attemptNumber: history.length + 1,
        responseTimeMs: elapsedMs(shownAt.current),
      },
    );
    setSubmitted(chosen.id);
    // The narrated explanation plays after the first answer; it can be replayed later.
    if (first && question.feedbackSequence) {
      stage.run(question.feedbackSequence, { autoplay: true });
      stageRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-10">
      <ScreenHeading screen={screen} lead={screen.learningObjective} />

      <div ref={stageRef} className="space-y-4">
        <StageViewport label={screen.title} />
        <StageControls />
      </div>

      <section aria-labelledby="versions-heading" className="space-y-4">
        <h2 id="versions-heading" className="font-display text-2xl font-semibold text-navy">
          {interaction.versions.map((v) => v.label).join(' · ')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {interaction.versions.map((v) => {
            const beat = stage.state.status === 'empty' ? undefined : stage.state.beats[stage.state.index];
            const active = beat?.kind === 'video' && beat.mediaId === v.mediaId;
            const asset = content.media[v.mediaId];
            const poster = asset?.posterId ? resolveMedia(content.media, asset.posterId) : undefined;
            return (
              <button
                key={v.mediaId}
                type="button"
                data-testid={`version-${v.mediaId}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  stage.runBeats(`replay:${v.mediaId}`, [{ kind: 'video', mediaId: v.mediaId }], { autoplay: true });
                  stageRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
                }}
                className={`group relative overflow-hidden rounded-xl text-start ring-offset-4 ring-offset-paper transition ${active ? 'ring-4 ring-violet' : 'ring-0'}`}
              >
                {poster?.status === 'ready' ? (
                  <img src={poster.url} alt="" className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="aspect-video w-full bg-ink/10" />
                )}
                <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,31,58,0.85),rgba(11,31,58,0.1)_60%)]" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 text-white">
                  <span>
                    <span className="block font-display text-2xl font-semibold">{v.label}</span>
                    <span className="text-sm text-white/80">{active ? ui.stage.nowPlaying : asset?.alt}</span>
                  </span>
                  <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-navy">
                    ▶
                  </span>
                </span>
                <span className="sr-only">{`${ui.stage.watch}: ${v.label}`}</span>
              </button>
            );
          })}
        </div>
        {!revealed && (
          <div className="flex flex-wrap items-center gap-3 text-ink/70">
            <p>{ui.compare.watchFirst}</p>
            <button type="button" className="min-h-11 rounded-full border border-ink/20 px-4 text-sm" onClick={() => setRevealed(true)}>
              {ui.compare.showQuestion}
            </button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {revealed && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 140 }}
            aria-labelledby="question-heading"
            className="rounded-2xl bg-white p-6 shadow-[0_20px_60px_-40px_rgba(11,31,58,0.5)] sm:p-10"
            data-testid="question"
          >
            <fieldset disabled={submitted !== null && option?.correct}>
              <legend id="question-heading" className="mb-6 font-display text-2xl font-semibold leading-snug sm:text-3xl">
                {question.prompt}
              </legend>
              <div className="space-y-3">
                {question.options.map((o) => {
                  const isSelected = (submitted ?? selected) === o.id;
                  const resolved = submitted === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`flex min-h-14 cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${
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
                      <span className="text-lg leading-relaxed">{o.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {option ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4" role="status" data-testid="feedback" data-correct={option.correct}>
                <p className="flex items-center gap-2 text-lg font-bold">
                  <span aria-hidden className={`grid size-7 place-items-center rounded-full text-sm text-white ${option.correct ? 'bg-navy' : 'bg-ink/60'}`}>
                    {option.correct ? '✓' : '✕'}
                  </span>
                  {option.correct ? ui.compare.correct : ui.compare.incorrect}
                </p>
                <p className="text-lg leading-relaxed">{option.feedback}</p>
                <div className="flex flex-wrap gap-3">
                  {!option.correct && (
                    <button
                      type="button"
                      className="min-h-11 rounded-full border border-ink/20 px-5"
                      onClick={() => {
                        setSubmitted(null);
                        setSelected(null);
                      }}
                    >
                      {ui.compare.retry}
                    </button>
                  )}
                  {question.feedbackSequence && (
                    <button type="button" className="min-h-11 rounded-full border border-ink/20 px-5" onClick={() => stage.run(question.feedbackSequence!, { autoplay: true })}>
                      {ui.compare.listen}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={check}
                disabled={selected === null}
                className="mt-6 min-h-12 rounded-full bg-navy px-8 font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/25"
              >
                {ui.compare.check}
              </button>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
