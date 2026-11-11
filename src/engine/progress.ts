import type { FlowState } from './flow';

/**
 * Progress persistence. The localStorage implementation is an MVP convenience
 * for resuming on the same device; it is not verified organisational tracking
 * and must not be presented as proof of completion.
 */
export interface ProgressStore {
  load(): FlowState | null;
  save(state: FlowState): void;
  clear(): void;
}

const STORAGE_KEY = 'good-hands:progress:v1';

interface Options {
  courseId: string;
  courseVersion: string;
  /** Validates a stored state against the current course (see Flow.restore). */
  restore: (raw: unknown) => FlowState | null;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
}

const defaultStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage blocked (private mode, policy)
  }
};

export function createLocalProgressStore(options: Options): ProgressStore {
  const { courseId, courseVersion, restore } = options;
  const storage = options.storage === undefined ? defaultStorage() : options.storage;

  return {
    load() {
      try {
        const text = storage?.getItem(STORAGE_KEY);
        if (!text) return null;
        const saved = JSON.parse(text) as { courseId?: unknown; courseVersion?: unknown; state?: unknown };
        // Progress from another content version is discarded rather than mapped onto changed screens.
        if (saved.courseId !== courseId || saved.courseVersion !== courseVersion) return null;
        return restore(saved.state);
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify({ courseId, courseVersion, state }));
      } catch {
        // Storage full or unavailable: the course continues without persistence.
      }
    },
    clear() {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // nothing to clear
      }
    },
  };
}
