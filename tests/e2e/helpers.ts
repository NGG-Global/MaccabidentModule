import { expect, type Page } from '@playwright/test';

export interface TrackedEvent {
  eventName: string;
  eventId: string;
  timestamp: string;
  role: string | null;
  screenId: string;
  courseVersion: string;
  schemaVersion: string;
  payload: Record<string, unknown>;
}

interface StageStatus {
  key: string | null;
  index: number;
  status: string;
  beat?: string;
  started?: boolean;
}

/** Collects analytics events (console adapter, dev only) and schema rejections. */
export function collectEvents(page: Page) {
  const events: TrackedEvent[] = [];
  const dropped: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    if (text.startsWith('[analytics] dropped')) dropped.push(text);
    else if (text.startsWith('[analytics] {')) events.push(JSON.parse(text.slice('[analytics] '.length)) as TrackedEvent);
  });
  return { events, dropped, names: () => events.map((e) => e.eventName) };
}

/** Counts every attempt to play media, to prove nothing sounds before a gesture. */
export const countPlayCalls = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __playCalls: number };
    w.__playCalls = 0;
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      w.__playCalls += 1;
      return original.apply(this, args);
    };
  });
export const playCalls = (page: Page) => page.evaluate(() => (window as unknown as { __playCalls: number }).__playCalls);

export const stageStatus = (page: Page) =>
  page.evaluate(() => (window as unknown as { __goodHandsStage?: { status(): StageStatus } }).__goodHandsStage?.status() ?? null);

export async function waitForStage(page: Page, predicate: (s: StageStatus) => boolean, timeout = 15_000) {
  await expect.poll(async () => {
    const s = await stageStatus(page);
    return s ? predicate(s) : false;
  }, { timeout }).toBe(true);
}

/** Jumps the active beat to its end (dev-only seam), so long narration does not slow the suite. */
export async function finishBeat(page: Page) {
  // Only an active (started) beat can be finished; wait for its media to be running first.
  await waitForStage(page, (s) => Boolean(s.started) || s.status === 'ended');
  await page.evaluate(() => (window as unknown as { __goodHandsStage: { finish(): void } }).__goodHandsStage.finish());
}

/** Fast-forwards the current sequence until it ends. */
export async function finishSequence(page: Page) {
  for (let i = 0; i < 12; i++) {
    const s = await stageStatus(page);
    if (!s || s.status === 'ended') return;
    if (s.status === 'ready' || s.status === 'paused') {
      await page.getByTestId('stage-toggle').click();
    }
    await waitForStage(page, (x) => x.status === 'playing' || x.status === 'ended');
    const before = await stageStatus(page);
    if (before?.status === 'ended') return;
    await finishBeat(page);
    await waitForStage(page, (x) => x.index !== before!.index || x.status === 'ended' || x.key !== before!.key);
  }
}

export const next = (page: Page) => page.getByRole('button', { name: 'המשך', exact: true });
export const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

export async function expectNoBrokenLayout(page: Page) {
  const { overflow, brokenImages } = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    brokenImages: Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).length,
  }));
  expect(overflow, 'no horizontal scrolling').toBeLessThanOrEqual(0);
  expect(brokenImages, 'no broken images').toBe(0);
}

/** Seeds saved progress so a test can start on a later screen. */
export async function seedProgress(page: Page, state: Record<string, unknown>) {
  await page.goto('/');
  await page.evaluate((s) => {
    localStorage.setItem(
      'good-hands:progress:v1',
      JSON.stringify({
        courseId: 'good-hands',
        courseVersion: '0.2.0',
        state: { role: 'assistant', completed: [], answers: {}, visited: [], attempts: [], startedAt: '2026-11-11T08:00:00.000Z', completedAt: null, ...s },
      }),
    );
  }, state);
  await page.reload();
}

export const DONE_S03 = {
  'Q-S02-01': ['A'],
  'S03:delay-update': ['see-you'],
  'S03:adapt-explanation': ['effort-for-you'],
  'S03:next-step': ['with-you'],
};
