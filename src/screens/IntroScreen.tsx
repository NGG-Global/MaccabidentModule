import { motion } from 'motion/react';
import { content, ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { BrandLogo } from '../components/BrandLogo';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { resolveMedia } from '../media/resolveMedia';
import { useStage } from '../stage/StageProvider';
import { StageViewport } from '../stage/StageViewport';
import { unlockPlayback } from '../stage/session';
import type { ScreenProps } from './types';

const poster = resolveMedia(content.media, 'POSTER-VID-INTRO-01');

/**
 * S00. Nothing makes a sound until "Start": that gesture unlocks audio, then
 * the arrival film plays, followed by the narrated title sequence.
 */
export function IntroScreen({ screen, state, dispatch }: ScreenProps) {
  const track = useTrack();
  const stage = useStage();
  const started = state.startedAt !== null;
  const replayable = started && stage.state.status === 'empty';
  const ended = stage.state.key === 'enter' && stage.state.status === 'ended';

  // On the cover, "Start" is the only action: no footer competes with it.
  useScreenNav(screen.screenId, { hidden: !started, ready: ended, hint: ended ? ui.nav.watchEnded : undefined });

  const start = () => {
    unlockPlayback();
    dispatch({ type: 'START', at: new Date().toISOString() });
    track('course_started', {});
    stage.run('enter', { autoplay: true });
  };

  if (!started || replayable) {
    // The cover: a light brand panel carries the logo, the title and "Start"; the arrival photograph sits beside it (above it on phones).
    return (
      <section className="relative grid h-full grid-rows-[minmax(0,34%)_minmax(0,1fr)] overflow-hidden bg-paper lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-1">
        <div className="relative z-10 row-start-2 flex min-h-0 flex-col justify-center gap-3 bg-dawn px-6 pb-5 pt-2 sm:gap-5 sm:px-12 lg:row-start-1 lg:py-10 xl:px-16">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 22, stiffness: 150 }} className="self-start">
            <BrandLogo height={128} alt="" className="h-20 w-auto sm:h-28 lg:h-32" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-sm font-semibold tracking-wide text-violet-ink">
            {screen.eyebrow}
          </motion.p>
          <motion.h1
            tabIndex={-1}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 26, stiffness: 120 }}
            className="font-display text-5xl font-bold leading-none text-navy outline-none sm:text-7xl xl:text-8xl"
          >
            {screen.title}
          </motion.h1>
          {/* The logo's gradient, as a short rule under the title. */}
          <motion.span aria-hidden initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.45, duration: 0.7, ease: 'easeOut' }} className="block h-1.5 w-28 origin-right rounded-full bg-brand-gradient sm:w-36" />
          {screen.onScreenText.map((text) => (
            <motion.p key={text} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="max-w-xl text-lg leading-relaxed text-ink/80 sm:text-xl">
              {text}
            </motion.p>
          ))}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col items-start gap-3 sm:gap-4">
            <button
              type="button"
              onClick={started ? () => stage.run('enter', { autoplay: true }) : start}
              className="inline-flex min-h-14 items-center gap-3 rounded-full bg-navy px-8 text-lg font-semibold text-white shadow-[0_18px_40px_-18px_rgba(36,63,130,0.8)] transition hover:bg-navy/90"
            >
              <Icon name="play" className="size-5" />
              {started ? ui.stage.replayAll : ui.start}
            </button>
            <p className="max-w-lg text-sm text-ink/70">{ui.startHint}</p>
          </motion.div>
        </div>
        <div className="relative row-start-1 min-h-0 overflow-hidden lg:col-start-2">
          {poster.status === 'ready' && <img src={poster.url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          {/* The photograph fades into the panel, with the logo's colours glowing in its corner. */}
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,var(--color-paper))] lg:bg-[linear-gradient(to_right,transparent_60%,var(--color-paper))]" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_0%_0%,rgb(0_185_255/0.22),transparent_70%),radial-gradient(50%_45%_at_100%_100%,rgb(173_82_255/0.18),transparent_70%)]" />
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-[1600px]:max-w-[88rem] flex-col px-4 py-3 sm:px-6 sm:py-5">
      <h1 tabIndex={-1} className="sr-only">
        {screen.title}
      </h1>
      <StageViewport label={screen.title} />
    </div>
  );
}
