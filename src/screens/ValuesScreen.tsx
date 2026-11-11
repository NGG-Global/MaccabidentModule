import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { content, ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { itemKey } from '../engine/flow';
import { StageControls } from '../stage/StageControls';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { ScreenHeading } from './ScreenHeading';
import { elapsedMs, nowMs } from './timing';
import { useEnterSequence } from './useEnterSequence';
import type { ScreenProps } from './types';

const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));

/**
 * S03. The three values, each with its own narrated animation, then a short
 * exercise: match each action to its value. Wrong tries are allowed and
 * recorded; the screen is complete when every action is matched correctly.
 */
export function ValuesScreen({ screen, state, dispatch, done }: ScreenProps) {
  useEnterSequence(done);
  const stage = useStage();
  const track = useTrack();
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = nowMs();
  }, []);
  const interaction = screen.interaction?.type === 'valuesMatch' ? screen.interaction : null;
  const feedbackPlayed = useRef(done);
  const solvedAll = interaction
    ? interaction.items.every((item) => state.answers[itemKey(screen.screenId, item.id)]?.includes(item.valueId))
    : false;
  const feedbackKey = interaction?.feedbackSequence;
  // Exercise feedback is spoken once all actions are matched, after any narration that is still playing.
  useEffect(() => {
    if (!feedbackKey || feedbackPlayed.current || !solvedAll) return;
    if (stage.state.status === 'playing' || stage.state.status === 'paused') return;
    feedbackPlayed.current = true;
    stage.run(feedbackKey, { autoplay: true });
  }, [solvedAll, feedbackKey, stage]);
  if (!interaction) return null;
  const values = content.values.values;
  const nameOf = (id: string) => values.find((v) => v.id === id)?.name ?? id;

  const matched = interaction.items.filter((item) => state.answers[itemKey(screen.screenId, item.id)]?.includes(item.valueId)).length;
  const onEnter = stage.state.key === 'enter';

  const choose = (itemId: string, valueId: string, correctId: string) => {
    const key = itemKey(screen.screenId, itemId);
    const attempts = state.answers[key]?.length ?? 0;
    dispatch({ type: 'MATCH_VALUE', itemId, valueId });
    track('question_answered', {
      questionId: key,
      answerId: valueId,
      isCorrect: valueId === correctId,
      attemptNumber: attempts + 1,
      responseTimeMs: elapsedMs(shownAt.current),
    });
  };

  return (
    <div className="space-y-10">
      <ScreenHeading screen={screen} lead={screen.learningObjective} />

      <div className="grid gap-6 lg:grid-cols-[1fr_17rem] lg:items-start">
        <div className="space-y-4">
          <StageViewport label={screen.title} />
          <StageControls />
        </div>
        <nav aria-label={ui.values.index}>
          <h2 className="mb-3 text-sm font-semibold text-ink/60">{ui.values.index}</h2>
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
                    className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-start transition ${current ? 'bg-ink text-white' : 'hover:bg-white'}`}
                  >
                    <span className={`font-display text-2xl tabular-nums ${current ? 'text-violet' : 'text-ink/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1">
                      <span className="block font-display text-xl font-semibold">{nameOf(chapter.valueId)}</span>
                      <span className={`text-sm ${current ? 'text-mist' : 'text-ink/55'}`}>
                        {current ? ui.stage.nowPlaying : passed ? ui.values.play + ' ↺' : ui.values.play}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <section aria-labelledby="exercise-heading" className="rounded-2xl bg-white p-6 shadow-[0_20px_60px_-40px_rgba(11,31,58,0.5)] sm:p-10">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-violet">{ui.values.exercise}</p>
            <h2 id="exercise-heading" className="font-display text-2xl font-semibold sm:text-3xl">
              {interaction.prompt}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink/65" data-testid="match-progress" aria-live="polite">
              {fill(ui.values.progress, { done: matched, total: interaction.items.length })}
            </p>
            {solvedAll && feedbackKey && (
              <button
                type="button"
                onClick={() => {
                  feedbackPlayed.current = true;
                  stage.run(feedbackKey, { autoplay: true });
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/20 px-4 text-sm"
              >
                <span aria-hidden>▶</span>
                {ui.values.listen}
              </button>
            )}
          </div>
        </div>
        <ol className="space-y-6">
          {interaction.items.map((item, i) => {
            const history = state.answers[itemKey(screen.screenId, item.id)] ?? [];
            const solved = history.includes(item.valueId);
            const last = history.at(-1);
            return (
              <li key={item.id} className="border-t border-ink/10 pt-6 first:border-t-0 first:pt-0" data-testid={`match-${item.id}`}>
                <fieldset>
                  <legend className="mb-3 flex items-baseline gap-3 text-lg font-semibold sm:text-xl">
                    <span className="font-display text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                    {item.text}
                  </legend>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={ui.values.choose}>
                    {values.map((v) => {
                      const chosen = last === v.id;
                      const isRight = solved && v.id === item.valueId;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          aria-pressed={chosen}
                          disabled={solved}
                          onClick={() => choose(item.id, v.id, item.valueId)}
                          className={`min-h-11 rounded-full border-2 px-4 text-sm font-medium transition sm:text-base ${
                            isRight
                              ? 'border-navy bg-navy text-white'
                              : chosen
                                ? 'border-ink/50 bg-paper line-through decoration-ink/40'
                                : 'border-ink/15 hover:border-ink/40 disabled:opacity-40'
                          }`}
                        >
                          {isRight && <span aria-hidden>✓ </span>}
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence mode="wait">
                    {last && (
                      <motion.p
                        key={`${last}-${history.length}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        role="status"
                        className={`mt-3 leading-relaxed ${solved ? 'text-navy' : 'text-ink/75'}`}
                      >
                        <strong>{solved ? ui.values.correct : ui.values.incorrect}</strong>
                        {solved && <> {item.feedback}</>}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </fieldset>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
