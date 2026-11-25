import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { content, ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { itemKey } from '../engine/flow';
import { resolveMedia } from '../media/resolveMedia';
import { useLiveCaption } from '../stage/CaptionLine';
import { useMediaPrefs } from '../stage/prefs';
import { StageControls } from '../stage/StageControls';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { unlockPlayback } from '../stage/session';
import { useStageTime } from '../stage/useStageTime';
import { JourneyCycle } from './JourneyCycle';
import { ScreenFrame, ScreenHeading, type StepInfo } from './ScreenHeading';
import { useEnterSequence } from './useEnterSequence';
import { useSteps } from './useSteps';
import type { ScreenProps } from './types';

const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));
type Step = 'intro' | 'explore' | 'summary';
const ORDER: Step[] = ['intro', 'explore', 'summary'];

const wide = '(min-width: 1024px)';
const subscribeWide = (cb: () => void) => {
  const mql = window.matchMedia?.(wide);
  mql?.addEventListener?.('change', cb);
  return () => mql?.removeEventListener?.('change', cb);
};
/** On narrow screens the station content replaces the map animation, so everything fits. */
const useWide = () => useSyncExternalStore(subscribeWide, () => Boolean(window.matchMedia?.(wide).matches), () => true);

/**
 * S04. Three steps: the journey's introduction; the five touchpoints, where
 * choosing one moves the animated camera to it, plays its narration and
 * reveals its key points; and the chapter summary with its closing narration.
 * All five must be explored; this ends the introduction chapter.
 */
export function JourneyScreen({ screen, state, dispatch, done }: ScreenProps) {
  const stage = useStage();
  const track = useTrack();
  const isWide = useWide();
  const interaction = screen.interaction?.type === 'journey' ? screen.interaction : null;
  const stages = interaction?.stages ?? [];
  const visitedIds = stages.filter((s) => state.visited.includes(itemKey(screen.screenId, s.id))).map((s) => s.id);
  const allVisited = stages.length > 0 && visitedIds.length === stages.length;
  const [startStep] = useState<Step>(() => (allVisited ? 'summary' : visitedIds.length > 0 ? 'explore' : 'intro'));
  const [step, setStep] = useSteps<Step>(startStep);
  useEnterSequence(done, startStep === 'intro');

  const activeKey = stage.state.key?.startsWith('stage:') ? stage.state.key : null;
  const narrationTime = useStageTime(activeKey);
  const activeId = activeKey ? activeKey.slice('stage:'.length) : null;
  const active = stages.find((s) => s.id === activeId);
  const closingKey = interaction?.completion.sequence;
  const introEnded = stage.state.key === 'enter' && stage.state.status === 'ended';
  const stationEnded = activeKey !== null && stage.state.status === 'ended';
  const nextUnvisited = stages.find((s) => !visitedIds.includes(s.id) && s.id !== activeId) ?? stages.find((s) => !visitedIds.includes(s.id));

  const open = (stageId: string) => {
    const s = stages.find((x) => x.id === stageId);
    if (!s) return;
    const already = visitedIds.includes(stageId);
    unlockPlayback();
    dispatch({ type: 'VISIT_STAGE', stageId, at: new Date().toISOString() });
    if (!already) track('journey_stage_viewed', { stageId, visitedCount: visitedIds.length + 1 });
    stage.run(s.sequence, { autoplay: true, visualProps: { visited: already ? visitedIds : [...visitedIds, stageId] } });
  };
  const playClosing = (autoplay: boolean) => {
    if (closingKey) stage.run(closingKey, { autoplay, visualProps: { visited: stages.map((s) => s.id) } });
  };

  // Arriving on the summary (e.g. after a refresh), the closing is loaded behind a play button.
  useEffect(() => {
    if (step === 'summary' && stage.state.status === 'empty') playClosing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stage.state.status]);

  const goIntro = () => {
    setStep('intro');
    stage.run('enter', { autoplay: false });
  };
  const goExplore = () => {
    setStep('explore');
    if (stage.state.status === 'playing') stage.pause();
  };
  const goSummary = () => {
    setStep('summary');
    playClosing(true);
  };

  const steps: StepInfo[] = [
    { label: ui.journey.steps[0]!, reachable: true, done: introEnded || visitedIds.length > 0 },
    { label: ui.journey.steps[1]!, reachable: true, done: allVisited },
    { label: ui.journey.steps[2]!, reachable: allVisited, done: allVisited && stage.state.key === closingKey && stage.state.status === 'ended' },
  ];

  useScreenNav(
    screen.screenId,
    step === 'intro'
      ? { next: { label: ui.nav.toStations, enabled: true, run: goExplore }, ready: introEnded, hint: introEnded ? ui.nav.watchEnded : undefined }
      : step === 'explore'
        ? allVisited
          ? { next: { label: ui.nav.toSummary, enabled: true, run: goSummary }, back: goIntro, ready: true, hint: ui.nav.allStations }
          : {
              next: { label: ui.nav.nextStation, enabled: true, run: () => nextUnvisited && open(nextUnvisited.id) },
              back: goIntro,
              ready: stationEnded || activeId === null,
              hint: stationEnded ? ui.nav.stationEnded : undefined,
            }
        : { back: goExplore, ready: true, hint: ui.nav.introChapterDone },
  );

  if (!interaction) return null;
  const image = active?.imageId ? resolveMedia(content.media, active.imageId) : undefined;
  const stepIndex = ORDER.indexOf(step);

  return (
    <ScreenFrame
      heading={
        <ScreenHeading
          screen={screen}
          lead={step === 'explore' ? screen.onScreenText[0] : screen.learningObjective}
          steps={steps}
          step={stepIndex}
          onStep={(i) => (ORDER[i] === 'intro' ? goIntro() : ORDER[i] === 'explore' ? goExplore() : goSummary())}
        />
      }
    >
      <h2 tabIndex={-1} data-step-heading className="sr-only">
        {steps[stepIndex]!.label}
      </h2>

      {step === 'intro' && (
        <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-0 flex-1 flex-col">
          <StageViewport label={screen.title} />
        </motion.div>
      )}

      {step === 'explore' && (
        <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 sm:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-6">
          {/* The touchpoints as a cycle: on phones a compact ring beside the count; on wide screens the ring with titles, captions and controls under it. */}
          <div className="flex min-h-0 flex-col gap-3">
            <nav aria-label={ui.journey.route} className="flex min-h-0 items-center gap-3 lg:flex-1 lg:flex-col lg:items-stretch lg:rounded-2xl lg:bg-white/70 lg:p-5">
              <div className="min-w-0 flex-1 lg:flex lg:flex-none lg:items-baseline lg:justify-between lg:gap-3">
                <h3 className="text-sm font-semibold text-ink/70">{ui.journey.stages}</h3>
                <p className="text-sm text-ink/65" aria-live="polite" data-testid="journey-progress">
                  {fill(ui.journey.progress, { done: visitedIds.length, total: stages.length })}
                </p>
              </div>
              <div className="size-28 shrink-0 sm:size-36 lg:size-auto lg:min-h-0 lg:w-full lg:flex-1 lg:px-36 xl:px-40" data-testid="journey-cycle">
                <JourneyCycle stages={stages} activeId={activeId} visitedIds={visitedIds} onOpen={open} labels={isWide} nodeFraction={isWide ? 0.17 : 0.28} />
              </div>
            </nav>
            {isWide && (
              <div className="flex shrink-0 flex-col gap-2">
                <MiniCaption />
                <StageControls />
              </div>
            )}
          </div>
          <div className="flex min-h-0 flex-col gap-2">
              <AnimatePresence mode="wait" initial={false}>
                {active ? (
                  <motion.article
                    key={active.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 180 }}
                    className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden rounded-2xl bg-white p-3 sm:gap-2 sm:p-6"
                    data-testid="stage-detail"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-violet-ink">
                          {ui.journey.stage} {active.number}
                        </p>
                        <h3 className="font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">{active.title}</h3>
                      </div>
                      {image?.status === 'ready' && <img src={image.url} alt={image.alt} className="size-12 shrink-0 rounded-xl object-cover sm:size-20" />}
                    </div>
                    <p className="text-base leading-snug sm:text-lg">{active.summary}</p>
                    <h4 className="pt-1 text-sm font-semibold text-ink/60">{ui.journey.points}</h4>
                    <ul className="space-y-0.5 sm:space-y-1.5" aria-live="polite">
                      {active.points
                        // While the station is narrated, each point appears as it is spoken; otherwise all are shown.
                        .filter((point) => narrationTime === null || point.at === undefined || point.at <= narrationTime + 0.1)
                        .map((point, i) => (
                          <motion.li
                            key={point.text}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={narrationTime === null ? { delay: 0.15 + i * 0.2, type: 'spring', damping: 26, stiffness: 160 } : { type: 'spring', damping: 26, stiffness: 160 }}
                            className="flex items-start gap-3 text-base leading-snug sm:text-lg"
                          >
                            <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-violet" />
                            {point.text}
                          </motion.li>
                        ))}
                    </ul>
                    {!isWide && <MiniCaption />}
                  </motion.article>
                ) : (
                  <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid flex-1 place-items-center rounded-2xl border-2 border-dashed border-ink/15 p-6 text-center text-ink/65">
                    {ui.journey.choose}
                  </motion.div>
                )}
              </AnimatePresence>
              {!isWide && <StageControls />}
          </div>
        </motion.div>
      )}

      {step === 'summary' && (
        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-6">
          <section className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-ink px-6 py-8 text-white sm:px-10" data-testid="chapter-complete" aria-live="polite">
            <svg viewBox="0 0 700 170" className="absolute -top-6 end-0 w-72 opacity-60" aria-hidden>
              <motion.path
                d="M 12 150 C 210 40, 470 -10, 640 40 C 690 56, 700 110, 660 160"
                fill="none"
                stroke="var(--color-violet)"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: 0.3 }}
              />
            </svg>
            <h3 className="relative font-display text-3xl font-bold sm:text-5xl">{interaction.completion.title}</h3>
            <p className="relative mt-3 text-lg text-mist sm:text-xl">{interaction.completion.next}</p>
            {!isWide && <MiniCaption dark />}
            {closingKey && !isWide && stage.state.key === closingKey && (
              <div className="relative mt-5">
                <StageControls />
              </div>
            )}
            {closingKey && stage.state.key !== closingKey && (
              <button type="button" onClick={() => playClosing(true)} className="relative mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-paper px-5 font-semibold text-navy">
                <Icon name="play" className="size-4" />
                {ui.journey.listen}
              </button>
            )}
            <p className="relative mt-6 max-w-xl text-sm text-white/60">{ui.journey.savedNote}</p>
          </section>
          {isWide && <StageViewport label={screen.title} fallback={<JourneyPrompt />} />}
        </motion.div>
      )}
    </ScreenFrame>
  );
}

function JourneyPrompt() {
  return <div className="grid h-full place-items-center bg-paper-deep p-6 text-center text-ink/60">{ui.journey.choose}</div>;
}

/** Live caption for narrow screens, where the stage (and its caption strip) is not shown. */
function MiniCaption({ dark = false }: { dark?: boolean }) {
  const stage = useStage();
  const { captions } = useMediaPrefs();
  const text = useLiveCaption();
  if (!captions || (stage.state.status !== 'playing' && stage.state.status !== 'paused')) return null;
  return (
    <p aria-hidden data-testid="caption" className={`relative mt-auto min-h-10 shrink-0 rounded-lg px-3 py-1.5 text-sm sm:py-2 leading-snug ${dark ? 'mt-4 bg-white/10 text-white/90' : 'bg-ink text-white'}`}>
      {text}
    </p>
  );
}
