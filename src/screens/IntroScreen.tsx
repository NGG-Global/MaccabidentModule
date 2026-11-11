import { motion } from 'motion/react';
import { content, ui } from '../content';
import { useTrack } from '../analytics/TrackContext';
import { resolveMedia } from '../media/resolveMedia';
import { StageControls } from '../stage/StageControls';
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

  const start = () => {
    unlockPlayback();
    dispatch({ type: 'START', at: new Date().toISOString() });
    track('course_started', {});
    stage.run('enter', { autoplay: true });
  };

  const replayable = started && stage.state.status === 'empty';

  if (!started || replayable) {
    return (
      <section className="relative -mx-4 -mt-6 overflow-hidden bg-ink text-white sm:-mx-6 sm:-mt-10 sm:rounded-b-3xl">
        {poster.status === 'ready' && <img src={poster.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_10%,rgba(11,31,58,0.55)_55%,rgba(11,31,58,0.2))]" />
        <div className="relative flex min-h-[70dvh] flex-col justify-end gap-6 px-6 pb-12 pt-24 sm:px-12 sm:pb-16">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-sm font-semibold tracking-wide text-mist">
            {screen.eyebrow}
          </motion.p>
          <motion.h1
            tabIndex={-1}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 26, stiffness: 120 }}
            className="font-display text-6xl font-bold leading-none outline-none sm:text-8xl"
          >
            {screen.title}
          </motion.h1>
          {screen.onScreenText.map((text) => (
            <motion.p key={text} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="max-w-xl text-xl leading-relaxed text-white/90">
              {text}
            </motion.p>
          ))}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col items-start gap-4">
            <button
              type="button"
              onClick={started ? () => stage.run('enter', { autoplay: true }) : start}
              className="inline-flex min-h-14 items-center gap-3 rounded-full bg-paper px-8 text-lg font-semibold text-navy shadow-xl transition hover:bg-white"
            >
              <span aria-hidden>▶</span>
              {started ? ui.stage.replayAll : ui.start}
            </button>
            <p className="max-w-lg text-sm text-white/75">{ui.startHint}</p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <h1 tabIndex={-1} className="sr-only">
        {screen.title}
      </h1>
      <StageViewport label={screen.title} />
      <StageControls />
    </div>
  );
}
