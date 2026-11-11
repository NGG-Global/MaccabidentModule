import { useEffect } from 'react';
import { useStage } from '../stage/StageProvider';

/**
 * Loads the screen's "enter" sequence once. It plays straight away when the
 * learner has already interacted with the page and has not finished this
 * screen; otherwise it waits behind a play button.
 */
export function useEnterSequence(done: boolean, enabled = true) {
  const stage = useStage();
  const has = Boolean(stage.screen.sequences.enter);
  useEffect(() => {
    if (!enabled || !has) return;
    stage.run('enter', done ? { autoplay: false } : {});
    // Runs once per screen mount (StageProvider is keyed by screen).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
