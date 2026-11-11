/** Tiny external store for the playback clock, so only time-dependent views re-render. */
export interface ClockSnapshot {
  /** "<runId>:<index>" of the beat the time belongs to. */
  token: string;
  time: number;
}

export function createClockStore() {
  let snapshot: ClockSnapshot = { token: '', time: 0 };
  const listeners = new Set<() => void>();
  return {
    get: () => snapshot,
    set(token: string, time: number) {
      if (snapshot.token === token && Math.abs(snapshot.time - time) < 0.02) return;
      snapshot = { token, time };
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
export type ClockStore = ReturnType<typeof createClockStore>;
