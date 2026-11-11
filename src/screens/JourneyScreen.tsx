import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { content, ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { itemKey } from '../engine/flow';
import { resolveMedia } from '../media/resolveMedia';
import { StageControls } from '../stage/StageControls';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { unlockPlayback } from '../stage/session';
import { useStageTime } from '../stage/useStageTime';
import { ScreenHeading } from './ScreenHeading';
import { useEnterSequence } from './useEnterSequence';
import type { ScreenProps } from './types';

const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));

/**
 * S04. The five touchpoints as an interactive journey. Choosing a stage moves
 * the animated camera to it, plays its narration (when supplied) and reveals
 * its key points. All five must be explored; this ends the introduction chapter.
 */
export function JourneyScreen({ screen, state, dispatch, done }: ScreenProps) {
  useEnterSequence(done);
  const stage = useStage();
  const track = useTrack();
  const interaction = screen.interaction?.type === 'journey' ? screen.interaction : null;
  const activeKey = stage.state.key?.startsWith('stage:') ? stage.state.key : null;
  const narrationTime = useStageTime(activeKey);
  const closingPlayed = useRef(done);

  const allVisited = interaction ? interaction.stages.every((s) => state.visited.includes(itemKey(screen.screenId, s.id))) : false;
  const closingKey = interaction?.completion.sequence;
  // The chapter-closing narration follows the last station's narration; it never cuts it off.
  useEffect(() => {
    if (!interaction || !closingKey || closingPlayed.current || !allVisited) return;
    if (stage.state.status === 'playing' || stage.state.status === 'paused') return;
    closingPlayed.current = true;
    stage.run(closingKey, { autoplay: true, visualProps: { visited: interaction.stages.map((s) => s.id) } });
  }, [allVisited, closingKey, interaction, stage]);

  if (!interaction) return null;

  const visitedIds = interaction.stages.filter((s) => state.visited.includes(itemKey(screen.screenId, s.id))).map((s) => s.id);
  const activeId = activeKey ? activeKey.slice('stage:'.length) : null;
  const active = interaction.stages.find((s) => s.id === activeId);
  const complete = allVisited;

  const open = (stageId: string) => {
    const s = interaction.stages.find((x) => x.id === stageId)!;
    const already = visitedIds.includes(stageId);
    unlockPlayback();
    dispatch({ type: 'VISIT_STAGE', stageId, at: new Date().toISOString() });
    if (!already) track('journey_stage_viewed', { stageId, visitedCount: visitedIds.length + 1 });
    stage.run(s.sequence, { autoplay: true, visualProps: { visited: already ? visitedIds : [...visitedIds, stageId] } });
  };

  const image = active?.imageId ? resolveMedia(content.media, active.imageId) : undefined;

  return (
    <div className="space-y-10">
      <ScreenHeading screen={screen} lead={screen.onScreenText[0]} />

      <div className="space-y-4">
        <StageViewport label={screen.title} />
        <StageControls />
      </div>

      <section aria-labelledby="stages-heading" className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="stages-heading" className="font-display text-2xl font-semibold text-navy">
            {ui.journey.stages}
          </h2>
          <p className="text-sm text-ink/65" aria-live="polite" data-testid="journey-progress">
            {fill(ui.journey.progress, { done: visitedIds.length, total: interaction.stages.length })}
          </p>
        </div>
        <ol className="grid gap-2 sm:grid-cols-5">
          {interaction.stages.map((s) => {
            const visited = visitedIds.includes(s.id);
            const isActive = s.id === activeId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => open(s.id)}
                  aria-current={isActive ? 'step' : undefined}
                  data-testid={`stage-${s.id}`}
                  data-visited={visited}
                  className={`flex h-full w-full items-start gap-3 rounded-xl border-2 p-4 text-start transition sm:flex-col ${
                    isActive ? 'border-violet bg-white shadow-lg' : visited ? 'border-navy/30 bg-white' : 'border-dashed border-ink/20 hover:border-ink/45'
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-lg font-bold ${
                      isActive ? 'bg-violet text-white' : visited ? 'bg-navy text-white' : 'border-2 border-ink/25 text-ink/60'
                    }`}
                    aria-hidden
                  >
                    {visited && !isActive ? '✓' : s.number}
                  </span>
                  <span>
                    <span className="block font-semibold leading-snug">{s.title}</span>
                    <span className={`text-xs ${visited ? 'text-navy' : 'text-ink/55'}`}>{visited ? ui.journey.visited : ui.journey.notVisited}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          {active ? (
            <motion.article
              key={active.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', damping: 30, stiffness: 160 }}
              className="grid gap-6 overflow-hidden rounded-2xl bg-white p-6 sm:p-10 md:grid-cols-[1fr_auto]"
              data-testid="stage-detail"
            >
              <div className="space-y-4">
                <p className="text-sm font-semibold text-violet">
                  {ui.journey.stage} {active.number}
                </p>
                <h3 className="font-display text-3xl font-bold text-navy sm:text-4xl">{active.title}</h3>
                <p className="text-xl leading-relaxed">{active.summary}</p>
                <h4 className="pt-2 text-sm font-semibold text-ink/60">{ui.journey.points}</h4>
                <ul className="space-y-3" aria-live="polite">
                  {active.points
                    // While the station is narrated, each point appears as it is spoken; otherwise all are shown.
                    .filter((point) => narrationTime === null || point.at === undefined || point.at <= narrationTime + 0.1)
                    .map((point, i) => (
                    <motion.li
                      key={point.text}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={narrationTime === null ? { delay: 0.2 + i * 0.25, type: 'spring', damping: 26, stiffness: 160 } : { type: 'spring', damping: 26, stiffness: 160 }}
                      className="flex items-start gap-3 text-lg"
                    >
                      <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-violet" />
                      {point.text}
                    </motion.li>
                    ))}
                </ul>
              </div>
              {image?.status === 'ready' && (
                <motion.img
                  src={image.url}
                  alt={image.alt}
                  initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
                  animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
                  transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
                  className="aspect-[4/5] w-full rounded-xl object-cover md:w-72"
                />
              )}
            </motion.article>
          ) : (
            !complete && (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-ink/65">
                {ui.journey.choose}
              </motion.p>
            )
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {complete && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 120, delay: 0.2 }}
            className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-white sm:px-12 sm:py-16"
            data-testid="chapter-complete"
            aria-live="polite"
          >
            <svg viewBox="0 0 700 170" className="absolute -top-6 end-0 w-80 opacity-60" aria-hidden>
              <motion.path
                d="M 12 150 C 210 40, 470 -10, 640 40 C 690 56, 700 110, 660 160"
                fill="none"
                stroke="var(--color-violet)"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: 0.4 }}
              />
            </svg>
            <h2 className="relative font-display text-4xl font-bold sm:text-6xl">{interaction.completion.title}</h2>
            <p className="relative mt-4 text-xl text-mist sm:text-2xl">{interaction.completion.next}</p>
            {closingKey && (
              <button
                type="button"
                onClick={() => {
                  closingPlayed.current = true;
                  stage.run(closingKey, { autoplay: true, visualProps: { visited: interaction.stages.map((s) => s.id) } });
                }}
                className="relative mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-5 font-semibold text-navy"
              >
                <span aria-hidden>▶</span>
                {ui.journey.listen}
              </button>
            )}
            <p className="relative mt-8 max-w-xl text-sm text-white/60">{ui.journey.savedNote}</p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
