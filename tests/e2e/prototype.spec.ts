import { expect, test } from '@playwright/test';
import {
  collectEvents,
  countPlayCalls,
  DONE_S03,
  expectNoBrokenLayout,
  finishBeat,
  finishSequence,
  heading,
  next,
  playCalls,
  seedProgress,
  stageStatus,
  waitForStage,
} from './helpers';

/**
 * The S00–S04 prototype in a real browser, on desktop and at 360px.
 * Runs against the dev server: DRAFT content visible, console analytics adapter on.
 */

test('a new employee completes the introduction chapter, S00 to S04', async ({ page }) => {
  test.setTimeout(120_000);
  const { events, dropped, names } = collectEvents(page);
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await countPlayCalls(page);

  // S00 — nothing plays before Start
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByRole('img', { name: 'מכבידנט' })).toBeVisible();
  await expect(next(page)).toBeDisabled();
  await page.waitForTimeout(500);
  expect(await playCalls(page), 'no media plays on load').toBe(0);
  await expectNoBrokenLayout(page);

  await page.getByRole('button', { name: 'התחלה', exact: true }).click();
  // The arrival film plays first, then the narrated opening; never both.
  await waitForStage(page, (s) => s.beat === 'video' && s.status === 'playing');
  await expect(page.getByTestId('caption')).toBeVisible();
  await finishBeat(page);
  await waitForStage(page, (s) => s.index === 1 && s.beat === 'narration');
  await expect(page.getByTestId('composition')).toHaveAttribute('data-composition', 'opening');
  expect(await page.locator('video').count(), 'the video is gone while narration plays').toBe(0);
  await expect(next(page)).toBeEnabled();
  await next(page).click();

  // S01 — role selection gates progress
  await expect(heading(page, 'מה התפקיד שלך במרפאה?')).toBeFocused();
  await waitForStage(page, (s) => s.status === 'playing'); // already unlocked: narration starts by itself
  await expect(next(page)).toBeDisabled();
  await page.getByText('רופאים ורופאות / שינניות').click();
  await expect(next(page)).toBeEnabled();
  await next(page).click();

  // S02 — chapter card, meet Yossi, both versions in the stage, then the question
  await expect(heading(page, 'שתי חוויות של אותו מטופל')).toBeVisible();
  await expect(page.getByTestId('question')).toHaveCount(0);
  // The 2.8 s chapter card may finish on its own; then "Meet Yossi" narration, then version A.
  await waitForStage(page, (s) => s.key === 'enter' && s.index >= 1);
  if ((await stageStatus(page))?.index === 1) await finishBeat(page);
  await waitForStage(page, (s) => s.index === 2 && s.beat === 'video');
  await expect(page.getByTestId('version-VID-COMPARE-A-01')).toHaveAttribute('aria-current', 'true');
  await finishBeat(page);
  await waitForStage(page, (s) => s.index === 3 && s.beat === 'video');
  await finishBeat(page);
  await expect(page.getByTestId('question')).toBeVisible();
  await expect(next(page)).toBeDisabled();
  await page.getByText('הטיפול הרפואי יהיה בהכרח מהיר יותר').click();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', 'false');
  await waitForStage(page, (s) => s.key === 'feedback' && s.status === 'playing');
  await expect(page.getByTestId('composition')).toHaveAttribute('data-composition', 'compareFeedback');
  await page.getByRole('button', { name: 'ניסיון נוסף' }).click();
  await page.getByText('יחס אישי, הכוונה ברורה').click();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
  await expectNoBrokenLayout(page);
  await next(page).click();

  // S03 — values, then the matching exercise with a wrong try
  await expect(heading(page, 'שלושת ערכי השירות')).toBeVisible();
  await finishSequence(page);
  await expect(page.getByTestId('composition')).toHaveAttribute('data-composition', 'valueAccompanying');
  await expect(next(page)).toBeDisabled();
  await page.getByTestId('match-delay-update').getByRole('button', { name: 'מלווים אותך לאורך הדרך' }).click();
  await expect(page.getByTestId('match-delay-update')).toContainText('לא בדיוק');
  await page.getByTestId('match-delay-update').getByRole('button', { name: 'רואים אותך' }).click();
  await page.getByTestId('match-adapt-explanation').getByRole('button', { name: 'מתאמצים למענך' }).click();
  await page.getByTestId('match-next-step').getByRole('button', { name: 'מלווים אותך לאורך הדרך' }).click();
  await expect(page.getByTestId('match-progress')).toHaveText('3 מתוך 3 הותאמו');
  await next(page).click();

  // S04 — all five stages, missing narration named, chapter completion
  await expect(heading(page, 'מסע המטופל')).toBeVisible();
  await expect(page.getByRole('button', { name: 'המשך', exact: true })).toHaveCount(0);
  for (const [i, id] of ['prep', 'contact', 'communication', 'closing', 'followup'].entries()) {
    await expect(page.getByTestId('chapter-complete')).toHaveCount(0);
    await page.getByTestId(`stage-${id}`).click();
    await expect(page.getByTestId(`stage-${id}`)).toHaveAttribute('data-visited', 'true');
    await expect(page.getByTestId('stage-detail')).toBeVisible();
    await expect(page.getByTestId('journey-progress')).toHaveText(`${i + 1} מתוך 5 נקודות מגע`);
  }
  await expect(page.getByTestId('missing-narration')).toBeVisible();
  await expect(page.getByTestId('chapter-complete')).toContainText('השלמתם את פרק ההיכרות');
  await expect(page.getByTestId('chapter-complete')).toContainText('בהמשך: מתרגלים שירות במצבים אמיתיים');
  await expectNoBrokenLayout(page);

  expect(failed, 'no failed requests').toEqual([]);
  expect(dropped, 'no event failed schema validation').toEqual([]);
  const count = (n: string) => names().filter((x) => x === n).length;
  expect(count('course_started')).toBe(1);
  expect(count('role_selected')).toBe(1);
  expect(count('screen_viewed')).toBe(5);
  expect(count('video_started')).toBeGreaterThanOrEqual(3);
  expect(count('narration_started')).toBeGreaterThanOrEqual(5);
  expect(count('question_answered')).toBe(6);
  expect(count('journey_stage_viewed')).toBe(5);
  expect(count('prototype_completed')).toBe(1);
  expect(new Set(events.map((e) => e.eventId)).size, 'event ids are unique').toBe(events.length);
  expect(events.find((e) => e.eventName === 'role_selected')?.payload).toEqual({ role: 'clinician' });
  const answers = events.filter((e) => e.eventName === 'question_answered' && e.payload.questionId === 'Q-S02-01');
  expect(answers.map((e) => [e.payload.answerId, e.payload.isCorrect, e.payload.attemptNumber])).toEqual([
    ['B', false, 1],
    ['A', true, 2],
  ]);
  for (const event of events) expect(event).toMatchObject({ courseVersion: '0.2.0', schemaVersion: '1' });
});

test('progress survives a refresh: same screen, nothing plays until the learner presses play', async ({ page }) => {
  const { events } = collectEvents(page);
  await countPlayCalls(page);
  await seedProgress(page, { currentScreenId: 'S03', completed: ['S00', 'S01', 'S02'], answers: { 'Q-S02-01': ['A'] } });
  await expect(heading(page, 'שלושת ערכי השירות')).toBeVisible();
  await expect(page.getByTestId('stage-play')).toBeVisible();
  await page.waitForTimeout(600);
  expect(await playCalls(page)).toBe(0);
  await expect.poll(() => events.filter((e) => e.eventName === 'screen_viewed').at(-1)?.payload).toEqual({ interactionType: 'valuesMatch', resumed: true });
  await page.getByTestId('stage-play').click();
  await waitForStage(page, (s) => s.status === 'playing');
  // Earlier answers are kept on the way back.
  await page.getByRole('button', { name: 'חזרה' }).click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
});

test('narration that fails to load does not block the learner', async ({ page }) => {
  await page.route('**/media/AUDIO-S01-01.mp3', (route) => route.abort());
  await seedProgress(page, { currentScreenId: 'S01', completed: ['S00'], role: null });
  await page.getByTestId('stage-play').click();
  await expect(page.getByTestId('missing-narration')).toBeVisible();
  await waitForStage(page, (s) => s.status === 'ended');
  await page.getByText('נציגות שירות', { exact: true }).click();
  await expect(next(page)).toBeEnabled();
});

test('slow media keeps the interface responsive', async ({ page }) => {
  await page.route('**/media/*.mp4', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'התחלה', exact: true }).click();
  await expect(page.getByTestId('stage-toggle')).toBeVisible();
  await page.getByTestId('stage-toggle').click(); // pause while still loading
  await waitForStage(page, (s) => s.status === 'paused');
  await expect(next(page)).toBeEnabled();
});

test('controls: mute, captions and transcript', async ({ page }) => {
  await seedProgress(page, { currentScreenId: 'S01', completed: ['S00'], role: null });
  await page.getByTestId('stage-play').click();
  await waitForStage(page, (s) => s.status === 'playing');
  const mute = page.getByRole('button', { name: 'השתקה' });
  await mute.click();
  await expect(page.getByRole('button', { name: 'ביטול השתקה' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.getByTestId('narration-line').textContent()).not.toBe('');
  await page.getByRole('button', { name: 'כתוביות' }).click();
  await expect(page.getByTestId('narration-line')).toHaveText('');
  await page.getByRole('button', { name: 'תמלול' }).click();
  await expect(page.getByTestId('transcript')).toContainText('לפני שנתחיל, נשמח להכיר את התפקיד שלכם במרפאה.');
  await page.reload();
  await expect(page.getByRole('button', { name: 'ביטול השתקה' })).toBeVisible(); // preference remembered on this device
});

test('keyboard only: start, choose a role, continue', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'התחלה', exact: true })).toBeVisible();
  await page.locator('body').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'דילוג לתוכן' })).toBeFocused();
  const start = page.getByRole('button', { name: 'התחלה', exact: true });
  for (let i = 0; i < 6 && !(await start.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(start).toBeFocused();
  await page.keyboard.press('Enter');
  await waitForStage(page, (s) => s.status === 'playing');
  await next(page).focus();
  await page.keyboard.press('Enter');
  await expect(heading(page, 'מה התפקיד שלך במרפאה?')).toBeFocused();
  await page.getByRole('radio', { name: /נציגות שירות/ }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /סייעות/ })).toBeChecked();
  await next(page).focus();
  await page.keyboard.press('Enter');
  await expect(heading(page, 'שתי חוויות של אותו מטופל')).toBeVisible();
});

test('reduced motion still shows every composition and keeps targets usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedProgress(page, { currentScreenId: 'S04', completed: ['S00', 'S01', 'S02', 'S03'], answers: DONE_S03 });
  await page.getByTestId('stage-play').click();
  await waitForStage(page, (s) => s.status === 'playing');
  await expect(page.getByTestId('composition')).toBeVisible();
  const box = await page.getByTestId('stage-prep').boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(await stageStatus(page)).not.toBeNull();
});

test('restart clears progress only after confirmation', async ({ page }) => {
  await seedProgress(page, {
    currentScreenId: 'S04',
    completed: ['S00', 'S01', 'S02', 'S03'],
    answers: DONE_S03,
    visited: ['S04:prep', 'S04:contact', 'S04:communication', 'S04:closing', 'S04:followup'],
    completedAt: '2026-11-11T09:00:00.000Z',
  });
  await expect(page.getByTestId('chapter-complete')).toBeVisible();
  await page.getByRole('button', { name: 'התחלה מחדש' }).click();
  await page.getByRole('button', { name: 'ביטול' }).click();
  await expect(page.getByTestId('chapter-complete')).toBeVisible();
  await page.getByRole('button', { name: 'התחלה מחדש' }).click();
  await page.getByRole('button', { name: 'כן, להתחיל מחדש' }).click();
  await expect(page.getByRole('button', { name: 'התחלה', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('good-hands:progress:v1') ?? '{}').state?.currentScreenId)).toBe('S00');
});
