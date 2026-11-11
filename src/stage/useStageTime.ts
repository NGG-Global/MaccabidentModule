import { useSyncExternalStore } from 'react';
import { useStage } from './StageProvider';

/**
 * Playback time (seconds, in quarter-second steps) of the running sequence `key`,
 * or null when that sequence is not the one playing. Re-renders only on step changes.
 */
export function useStageTime(key: string | null): number | null {
  const stage = useStage();
  const live = key !== null && stage.state.key === key && (stage.state.status === 'playing' || stage.state.status === 'paused');
  return useSyncExternalStore(
    stage.clock.subscribe,
    () => {
      if (!live) return null;
      const snap = stage.clock.get();
      return snap.token === stage.token ? Math.floor(snap.time * 4) / 4 : 0;
    },
    () => null,
  );
}
