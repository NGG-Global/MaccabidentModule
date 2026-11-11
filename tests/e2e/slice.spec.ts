import { expect, test, type Page } from '@playwright/test';

/**
 * Vertical slice in a real browser, on desktop and at 360px.
 * Runs against the dev server: Console analytics adapter on, DRAFT content visible.
 */

interface TrackedEvent {
  eventName: string;
  eventId: string;
  timestamp: string;
  sessionId: string;
  anonymousLearnerId: string;
  courseId: string;
  courseVersion: string;
  role: string | null;
  screenId: string;
  scenarioId?: string;
  schemaVersion: string;
  payload: Record<string, unknown>;
}

const collectEvents = (page: Page) => {
  const events: TrackedEvent[] = [];
  const dropped: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    if (text.startsWith('[analytics] dropped')) dropped.push(text);
    else if (text.startsWith('[analytics] ')) events.push(JSON.parse(text.slice('[analytics] '.length)) as TrackedEvent);
  });
  return { events, dropped };
};

/** Counts every attempt to play media, so "no sound before interaction" can be asserted. */
const countPlayCalls = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __playCalls: number };
    w.__playCalls = 0;
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      w.__playCalls += 1;
      return original.apply(this, args);
    };
  });
const playCalls = (page: Page) => page.evaluate(() => (window as unknown as { __playCalls: number }).__playCalls);

const next = (page: Page) => page.getByRole('button', { name: 'המשך' });
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

const expectNoBrokenLayout = async (page: Page) => {
  const { overflow, brokenImages } = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    brokenImages: Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).length,
  }));
  expect(overflow, 'no horizontal scrolling').toBeLessThanOrEqual(0);
  expect(brokenImages, 'no broken images').toBe(0);
};

test('a new employee completes the slice from opening to summary', async ({ page }) => {
  const { events, dropped } = collectEvents(page);
  const failedRequests: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
  });
  await countPlayCalls(page);

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByTestId('draft-badge').first()).toBeVisible();
  await expect(page.getByTestId('media-placeholder')).toBeVisible();
  await expect(next(page)).toBeDisabled();
  expect(await playCalls(page), 'nothing plays on load').toBe(0);
  await expectNoBrokenLayout(page);

  await page.getByRole('button', { name: 'התחלה' }).click();
  // Narration is not produced yet: the transcript is shown instead and the course continues.
  await expect(page.getByTestId('transcript')).toBeVisible();
  await expect(page.getByText('הקריינות עדיין לא זמינה')).toBeVisible();
  await next(page).click();

  await expect(heading(page, 'מה התפקיד שלך במרפאה?')).toBeFocused();
  await expect(next(page)).toBeDisabled();
  await page.getByRole('radio', { name: /נציגות שירות/ }).check();
  await next(page).click();

  await expect(heading(page, 'שלושת ערכי השירות')).toBeVisible();
  await expect(page.getByTestId('value-card')).toHaveCount(3);
  await expectNoBrokenLayout(page);
  await next(page).click();

  await expect(heading(page, 'תרחיש: עיכוב בתור')).toBeVisible();
  await expect(next(page)).toBeDisabled();
  await page.getByRole('radio', { name: /עוד חמש דקות/ }).check();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await expect(page.getByTestId('feedback')).toContainText('תגובה לא רצויה');
  await page.getByRole('button', { name: 'ניסיון נוסף' }).click();
  await page.getByRole('radio', { name: /אני מבין/ }).check();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await expect(page.getByTestId('feedback')).toContainText('תגובה מועדפת');
  await expectNoBrokenLayout(page);
  await next(page).click();

  await expect(heading(page, 'סיכום')).toBeVisible();
  await expect(page.getByTestId('summary-role')).toHaveText('נציגות שירות');
  await expect(page.getByTestId('summary-practice')).toContainText('ניסיונות: 2');
  await expect(page.getByText('אינה רישום ארגוני')).toBeVisible();
  await expectNoBrokenLayout(page);

  expect(await playCalls(page), 'no media playback while all audio is missing').toBe(0);
  expect(failedRequests, 'no failed requests (e.g. missing media files)').toEqual([]);
  expect(dropped, 'no event failed schema validation').toEqual([]);

  const names = events.map((e) => e.eventName);
  expect(names.filter((n) => n === 'course_started')).toHaveLength(1);
  expect(names.filter((n) => n === 'role_selected')).toHaveLength(1);
  expect(names.filter((n) => n === 'screen_viewed')).toHaveLength(5);
  expect(names.filter((n) => n === 'scenario_answered')).toHaveLength(2);
  expect(names.filter((n) => n === 'feedback_viewed')).toHaveLength(2);
  expect(names.filter((n) => n === 'course_completed')).toHaveLength(1);
  expect(new Set(events.map((e) => e.eventId)).size, 'event ids are unique').toBe(events.length);
  for (const event of events) {
    expect(event).toMatchObject({ courseId: 'good-hands', courseVersion: '0.1.0', schemaVersion: '1' });
    expect(Date.parse(event.timestamp)).not.toBeNaN();
  }
  const answers = events.filter((e) => e.eventName === 'scenario_answered');
  expect(answers.map((e) => [e.payload.answerId, e.payload.isPreferred, e.role, e.scenarioId])).toEqual([
    ['C', false, 'reception', 'SC-COM-01'],
    ['B', true, 'reception', 'SC-COM-01'],
  ]);
});

test('progress survives a refresh and resumes on the same screen without sound', async ({ page }) => {
  const { events } = collectEvents(page);
  await countPlayCalls(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'התחלה' }).click();
  await next(page).click();
  await page.getByRole('radio', { name: /סייעות/ }).check();
  await next(page).click();
  await next(page).click();
  await expect(heading(page, 'תרחיש: עיכוב בתור')).toBeVisible();

  events.length = 0;
  await page.reload();
  await expect(heading(page, 'תרחיש: עיכוב בתור')).toBeVisible();
  expect(await playCalls(page)).toBe(0);
  await expect.poll(() => events.map((e) => e.eventName)).toContain('course_resumed');
  expect(events.find((e) => e.eventName === 'course_resumed')).toMatchObject({
    role: 'assistant',
    payload: { resumedScreenId: 'S05' },
  });
  expect(events.some((e) => e.eventName === 'course_started')).toBe(false);

  // Earlier screens stay reachable and keep their state.
  await page.getByRole('button', { name: 'חזרה' }).click();
  await page.getByRole('button', { name: 'חזרה' }).click();
  await expect(page.getByRole('radio', { name: /סייעות/ })).toBeChecked();
});

test('the slice can be completed with the keyboard alone', async ({ page }) => {
  await page.goto('/');

  const pressOn = async (name: string, key = 'Enter') => {
    const button = page.getByRole('button', { name, exact: true });
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press(key);
  };

  // Tab order reaches the skip link first, then the Start button.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'דילוג לתוכן' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'התחלה' })).toBeFocused();
  await page.keyboard.press('Enter');
  await pressOn('המשך');

  // Focus lands on the new heading; Tab enters the radio group, Space selects, arrows move.
  await expect(heading(page, 'מה התפקיד שלך במרפאה?')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /סייעות/ })).toBeChecked();
  await pressOn('המשך');
  await pressOn('המשך');

  await expect(heading(page, 'תרחיש: עיכוב בתור')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /אני מבין/ })).toBeChecked();
  await pressOn('בדיקה', 'Space');
  await expect(page.getByTestId('feedback')).toContainText('תגובה מועדפת');
  await pressOn('המשך');
  await expect(heading(page, 'סיכום')).toBeFocused();
});

test('respects reduced motion and keeps touch targets usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const start = page.getByRole('button', { name: 'התחלה' });
  const box = await start.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  const duration = await start.evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
});
