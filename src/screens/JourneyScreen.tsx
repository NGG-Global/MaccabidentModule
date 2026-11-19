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
        : { back: goExplore, hint: ui.nav.endOfPrototype },
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
        <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
          <nav aria-label={ui.journey.route}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink/70">{ui.journey.stages}</h3>
              <p className="text-sm text-ink/65" aria-live="polite" data-testid="journey-progress">
                {fill(ui.journey.progress, { done: visitedIds.length, total: stages.length })}
              </p>
            </div>
            <ol className="relative grid grid-cols-5 gap-1.5 sm:gap-2">
              {stages.map((s) => {
                const visited = visitedIds.includes(s.id);
                const isActive = s.id === activeId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => open(s.id)}
                      aria-current={isActive ? 'step' : undefined}
                      aria-label={`${s.number}. ${s.title} – ${visited ? ui.journey.visited : ui.journey.notVisited}`}
                      data-testid={`stage-${s.id}`}
                      data-visited={visited}
                      className={`flex h-full min-h-12 w-full flex-col items-center gap-1 rounded-xl border-2 p-1.5 text-center transition sm:flex-row sm:items-center sm:gap-2.5 sm:p-2.5 sm:text-start ${
                        isActive ? 'border-violet bg-white shadow-lg' : visited ? 'border-navy/25 bg-white' : 'border-dashed border-ink/25 hover:border-ink/50'
                      }`}
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full font-display font-bold sm:size-9 sm:text-lg ${
                          isActive ? 'bg-violet text-white' : visited ? 'bg-navy text-white' : 'border-2 border-ink/25 text-ink/60'
                        }`}
                        aria-hidden
                      >
                        {visited && !isActive ? <Icon name="check" className="size-4" strokeWidth={3} /> : s.number}
                      </span>
                      <span aria-hidden className="hidden min-w-0 md:block">
                        <span className="block text-sm font-semibold leading-tight">{s.title}</span>
                        <span className={`text-xs ${visited ? 'text-navy' : 'text-ink/55'}`}>{visited ? ui.journey.visited : ui.journey.notVisited}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
            {isWide && <StageViewport label={screen.title} fallback={<JourneyPrompt />} />}
            <div className="flex min-h-0 flex-col gap-2">
              <AnimatePresence mode="wait" initial={false}>
                {active ? (
                  <motion.article
                    key={active.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 180 }}
                    className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl bg-white p-4 sm:p-6"
                    data-testid="stage-detail"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-violet">
                          {ui.journey.stage} {active.number}
                        </p>
                        <h3 className="font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">{active.title}</h3>
                      </div>
                      {image?.status === 'ready' && <img src={image.url} alt={image.alt} className="size-16 shrink-0 rounded-xl object-cover sm:size-20" />}
                    </div>
                    <p className="text-base leading-snug sm:text-lg">{active.summary}</p>
                    <h4 className="pt-1 text-sm font-semibold text-ink/60">{ui.journey.points}</h4>
                    <ul className="space-y-1.5" aria-live="polite">
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
    <p aria-hidden data-testid="caption" className={`relative mt-auto min-h-10 rounded-lg px-3 py-2 text-sm leading-snug ${dark ? 'mt-4 bg-white/10 text-white/90' : 'bg-ink text-white'}`}>
      {text}
    </p>
  );
}
