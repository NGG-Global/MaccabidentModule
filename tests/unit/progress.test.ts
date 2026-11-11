import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/loader';
import { createFlow } from '../../src/engine/flow';
import { createLocalProgressStore } from '../../src/engine/progress';
import { branchingRaw } from './fixtures';

const flow = createFlow(buildContent(branchingRaw()));

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
};

const makeStore = (storage: ReturnType<typeof memoryStorage> | null, courseVersion = '9.9.9') =>
  createLocalProgressStore({ courseId: 'good-hands', courseVersion, restore: flow.restore, storage });

const midCourse = () =>
  [
    { type: 'START', at: 't' } as const,
    { type: 'NEXT', at: 't' } as const,
    { type: 'SELECT_ROLE', role: 'clinician' } as const,
  ].reduce(flow.reducer, flow.initialState());

describe('local progress store', () => {
  it('returns null when nothing was saved', () => {
    expect(makeStore(memoryStorage()).load()).toBeNull();
  });

  it('restores exactly what was saved', () => {
    const storage = memoryStorage();
    makeStore(storage).save(midCourse());
    expect(makeStore(storage).load()).toEqual(midCourse());
  });

  it('discards progress saved by another content version', () => {
    const storage = memoryStorage();
    makeStore(storage).save(midCourse());
    expect(makeStore(storage, '9.9.10').load()).toBeNull();
  });

  it('discards corrupt or tampered data', () => {
    const storage = memoryStorage();
    const store = makeStore(storage);
    store.save(midCourse());
    const key = [...storage.data.keys()][0]!;
    storage.data.set(key, '{not json');
    expect(store.load()).toBeNull();
    storage.data.set(
      key,
      JSON.stringify({ courseId: 'good-hands', courseVersion: '9.9.9', state: { ...midCourse(), currentScreenId: 'S09' } }),
    );
    expect(store.load()).toBeNull();
  });

  it('clears saved progress', () => {
    const storage = memoryStorage();
    const store = makeStore(storage);
    store.save(midCourse());
    store.clear();
    expect(store.load()).toBeNull();
  });

  it('keeps working when storage is unavailable or throws', () => {
    const none = makeStore(null);
    expect(() => none.save(midCourse())).not.toThrow();
    expect(none.load()).toBeNull();

    const broken = createLocalProgressStore({
      courseId: 'good-hands',
      courseVersion: '9.9.9',
      restore: flow.restore,
      storage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('quota');
        },
        removeItem: () => {
          throw new Error('blocked');
        },
      },
    });
    expect(() => broken.save(midCourse())).not.toThrow();
    expect(broken.load()).toBeNull();
    expect(() => broken.clear()).not.toThrow();
  });
});
