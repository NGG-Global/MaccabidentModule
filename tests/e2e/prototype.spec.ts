import { expect, test } from '@playwright/test';
import {
  collectEvents,
  countPlayCalls,
  DONE_S03,
  expectFitsWindow,
  expectNoBrokenLayout,
  finishBeat,
  finishSequence,
  forward,
  heading,
  next,
  playCalls,
  seedProgress,
  stageStatus,
  waitForStage,
} from './helpers';

/**
 * The introduction chapter, S00–S04, in a real browser, on desktop and at 360px. S05–S09: course.spec.ts.
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
  // On the cover "Start" is the only action; the footer appears once the course has started.
  await expect(next(page)).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(await playCalls(page), 'no media plays on load').toBe(0);
  await expectNoBrokenLayout(page);

  await page.getByRole('button', { name: 'התחלה', exact: true }).click();
  // The arrival film plays first, then the narrated opening; never both.
  await waitForStage(page, (s) => s.beat === 'video' && s.status === 'playing');
  await expect(page.getByTestId('caption')).toBeVisible();
  await expect(page.getByTestId('video-label')).toHaveText('הגעה למרפאה');
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

  // S02 — step 1: chapter card, meet Yossi, then both versions in the frame, each labelled while it plays
  await expect(heading(page, 'שתי חוויות של אותו מטופל')).toBeVisible();
  await expect(page.getByTestId('question')).toHaveCount(0);
  await expect(forward(page, 'לשאלה')).toBeEnabled();
  // The 2.8 s chapter card may finish on its own; then "Meet Yossi" narration, then version A.
  await waitForStage(page, (s) => s.key === 'enter' && s.index >= 1);
  if ((await stageStatus(page))?.index === 1) await finishBeat(page);
  await waitForStage(page, (s) => s.index === 2 && s.beat === 'video');
  await expect(page.getByTestId('video-label')).toHaveText('גרסה א');
  await finishBeat(page);
  await waitForStage(page, (s) => s.index === 3 && s.beat === 'video');
  await expect(page.getByTestId('video-label')).toHaveText('גרסה ב');
  await finishBeat(page);
  // Step 2 opens by itself when the narration asks the question.
  await expect(page.getByTestId('question')).toBeVisible();
  await waitForStage(page, (s) => s.key === 'enter' && s.index === 4 && s.beat === 'narration');
  await expect(page.getByTestId('step-tracker').getByRole('listitem').nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(forward(page, 'להסבר')).toBeDisabled();
  await expectFitsWindow(page, 'S02 question');
  await page.getByText('הטיפול הרפואי יהיה בהכרח מהיר יותר').click();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', 'false');
  await page.getByRole('button', { name: 'ניסיון נוסף' }).click();
  await page.getByText('יחס אישי, הכוונה ברורה').click();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
  // Step 3: the narrated, animated explanation.
  await forward(page, 'להסבר').click();
  await waitForStage(page, (s) => s.key === 'feedback' && s.status === 'playing');
  await expect(page.getByTestId('composition')).toHaveAttribute('data-composition', 'compareFeedback');
  await expectNoBrokenLayout(page);
  await next(page).click();

  // S03 — values, then the matching exercise with a wrong try
  await expect(heading(page, 'שלושת ערכי השירות')).toBeVisible();
  await finishSequence(page);
  await expect(page.getByTestId('composition')).toHaveAttribute('data-composition', 'valueAccompanying');
  await expect(page.getByTestId('stage-ended')).toBeVisible();
  await expect(forward(page, 'לתרגול')).toHaveAttribute('data-ready', 'true'); // the step is done: continue is highlighted
  await forward(page, 'לתרגול').click();
  await expect(next(page)).toBeDisabled();
  await page.getByTestId('match-delay-update').getByRole('button', { name: 'מלווים אותך לאורך הדרך' }).click();
  await expect(page.getByTestId('match-delay-update')).toContainText('לא בדיוק');
  await page.getByTestId('match-delay-update').getByRole('button', { name: 'רואים אותך' }).click();
  await page.getByTestId('match-adapt-explanation').getByRole('button', { name: 'מתאמצים למענך' }).click();
  await page.getByTestId('match-next-step').getByRole('button', { name: 'מלווים אותך לאורך הדרך' }).click();
  await expect(page.getByTestId('match-progress')).toHaveText('3 מתוך 3 הותאמו');
  await waitForStage(page, (s) => s.key === 'exerciseFeedback' && s.status === 'playing'); // spoken feedback after the exercise
  await expect(page.getByTestId('exercise-summary')).toBeVisible();
  await expectFitsWindow(page, 'S03 exercise');
  await next(page).click();

  // S04 — introduction, then all five stations with their narration, then the chapter summary
  await expect(heading(page, 'מסע המטופל')).toBeVisible();
  await expect(page.getByRole('button', { name: 'המשך', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('missing-narration')).toHaveCount(0);
  await forward(page, 'לנקודות המגע').click();
  const stations = ['prep', 'contact', 'communication', 'closing', 'followup'];
  for (const [i, id] of stations.entries()) {
    await expect(page.getByTestId('chapter-complete')).toHaveCount(0);
    await page.getByTestId(`stage-${id}`).click();
    await waitForStage(page, (s) => s.key === `stage:${id}` && s.beat === 'narration' && s.status === 'playing');
    await expect(page.getByTestId(`stage-${id}`)).toHaveAttribute('data-visited', 'true');
    await expect(page.getByTestId('journey-progress')).toHaveText(`${i + 1} מתוך 5 נקודות מגע`);
    // Key points appear with the narration: none at the start, all once it has been heard.
    if (i === 0) {
      await expect(page.getByTestId('stage-detail').locator('li')).toHaveCount(0);
      await finishSequence(page);
      await expect(page.getByTestId('stage-detail').locator('li')).toHaveCount(3);
      await expectFitsWindow(page, 'S04 station');
    }
  }
  await expect(forward(page, 'לנקודת המגע הבאה')).toHaveCount(0);
  await finishBeat(page);
  await forward(page, 'לסיכום הפרק').click();
  await expect(page.getByTestId('chapter-complete')).toContainText('השלמתם את פרק ההיכרות');
  await expect(page.getByTestId('chapter-complete')).toContainText('בהמשך: מתרגלים שירות במצבים אמיתיים');
  await waitForStage(page, (s) => s.key === 'complete' && s.status === 'playing');
  if ((page.viewportSize()?.width ?? 0) >= 1024) await expect(page.getByTestId('composition')).toHaveAttribute('data-composition', 'journey');
  await expectNoBrokenLayout(page);
  await expectFitsWindow(page, 'S04 summary');

  expect(failed, 'no failed requests').toEqual([]);
  expect(dropped, 'no event failed schema validation').toEqual([]);
  const count = (n: string) => names().filter((x) => x === n).length;
  expect(count('course_started')).toBe(1);
  expect(count('role_selected')).toBe(1);
  expect(count('screen_viewed')).toBe(5);
  expect(count('video_started')).toBeGreaterThanOrEqual(3);
  expect(count('narration_started')).toBeGreaterThanOrEqual(12);
  expect(count('question_answered')).toBe(6);
  expect(count('journey_stage_viewed')).toBe(5);
  // Finishing the introduction chapter does not complete the course.
  expect(count('course_completed')).toBe(0);
  expect(new Set(events.map((e) => e.eventId)).size, 'event ids are unique').toBe(events.length);
  expect(events.find((e) => e.eventName === 'role_selected')?.payload).toEqual({ role: 'clinician' });
  const answers = events.filter((e) => e.eventName === 'question_answered' && e.payload.questionId === 'Q-S02-01');
  expect(answers.map((e) => [e.payload.answerId, e.payload.isCorrect, e.payload.attemptNumber])).toEqual([
    ['B', false, 1],
    ['A', true, 2],
  ]);
  for (const event of events) expect(event).toMatchObject({ courseVersion: '0.4.0', schemaVersion: '1' });
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
  await forward(page, 'לנקודות המגע').click();
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

test('every screen and step fits the window without scrolling', async ({ page }) => {
  const steps: Array<[string, Record<string, unknown>, ((p: typeof page) => Promise<void>)?]> = [
    ['S01', { currentScreenId: 'S01', completed: ['S00'], role: null }],
    ['S02 watch', { currentScreenId: 'S02', completed: ['S00', 'S01'] }],
    ['S02 answered', { currentScreenId: 'S02', completed: ['S00', 'S01'], answers: { 'Q-S02-01': ['B'] } }],
    ['S03 watch', { currentScreenId: 'S03', completed: ['S00', 'S01', 'S02'], answers: { 'Q-S02-01': ['A'] } }],
    ['S03 exercise', { currentScreenId: 'S03', completed: ['S00', 'S01', 'S02'], answers: DONE_S03 }],
    ['S04 intro', { currentScreenId: 'S04', completed: ['S00', 'S01', 'S02', 'S03'], answers: DONE_S03 }],
    [
      'S04 station',
      { currentScreenId: 'S04', completed: ['S00', 'S01', 'S02', 'S03'], answers: DONE_S03, visited: ['S04:prep'] },
      async (p) => {
        await p.getByTestId('stage-communication').click();
        await p.getByTestId('stage-toggle').click();
      },
    ],
    [
      'S04 summary',
      { currentScreenId: 'S04', completed: ['S00', 'S01', 'S02', 'S03'], answers: DONE_S03, visited: ['S04:prep', 'S04:contact', 'S04:communication', 'S04:closing', 'S04:followup'], completedAt: '2026-11-11T09:00:00.000Z' },
    ],
  ];
  await page.goto('/');
  await expectFitsWindow(page, 'S00 cover');
  for (const [name, seed, act] of steps) {
    await seedProgress(page, seed);
    await expect(page.locator('#main h1')).toBeVisible();
    if (act) await act(page);
    await page.waitForTimeout(300);
    await expectFitsWindow(page, name);
    await expectNoBrokenLayout(page);
  }
});

test('the S02 question can be reached at any time, and each version can be watched again from it', async ({ page }) => {
  await seedProgress(page, { currentScreenId: 'S02', completed: ['S00', 'S01'] });
  await forward(page, 'לשאלה').click();
  await expect(page.getByTestId('question')).toBeVisible();
  await waitForStage(page, (s) => s.key === 'enter' && s.index === 4 && s.status === 'playing'); // the question is asked aloud
  await page.getByTestId('version-VID-COMPARE-B-01').click();
  await expect(page.getByTestId('question')).toHaveCount(0);
  await waitForStage(page, (s) => s.key === 'replay:VID-COMPARE-B-01' && s.beat === 'video' && s.status === 'playing');
  await expect(page.getByTestId('video-label')).toHaveText('גרסה ב');
  await page.getByRole('button', { name: 'חזרה' }).click(); // back from step 1 leaves the screen
  await expect(heading(page, 'מה התפקיד שלך במרפאה?')).toBeVisible();
});

test('the transcript opens in a dialog and closes with Escape', async ({ page }) => {
  await seedProgress(page, { currentScreenId: 'S01', completed: ['S00'], role: null });
  const toggle = page.getByTestId('stage-controls').getByRole('button', { name: 'תמלול' });
  await toggle.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectFitsWindow(page, 'transcript open');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(toggle).toBeFocused();
});

test('the journey touchpoints form a cycle: numbered 1–5 on one ring, 5 leading back to 1, the active one marked', async ({ page }) => {
  await seedProgress(page, { currentScreenId: 'S04', completed: ['S00', 'S01', 'S02', 'S03'], answers: DONE_S03, visited: ['S04:prep'] });
  const cycle = page.getByTestId('journey-cycle');
  await expect(cycle).toBeVisible();
  const ids = ['prep', 'contact', 'communication', 'closing', 'followup'];
  const centres = [];
  for (const id of ids) {
    const b = (await page.getByTestId(`stage-${id}`).boundingBox())!;
    centres.push({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
  }
  const cx = centres.reduce((s, p) => s + p.x, 0) / 5;
  const cy = centres.reduce((s, p) => s + p.y, 0) / 5;
  const radii = centres.map((p) => Math.hypot(p.x - cx, p.y - cy));
  for (const r of radii) expect(Math.abs(r - radii[0]!)).toBeLessThan(radii[0]! * 0.06);
  // Step 1 at the top; the next step to its left (right-to-left order).
  expect(Math.min(...centres.map((p) => p.y))).toBe(centres[0]!.y);
  expect(centres[1]!.x).toBeLessThan(centres[0]!.x);
  // Five arcs, the fifth closing the loop back to step 1.
  await expect(cycle.locator('[data-testid^="cycle-arc-"]')).toHaveCount(5);
  await page.getByTestId('stage-contact').click();
  await expect(page.getByTestId('stage-contact')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('stage-prep')).not.toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('stage-detail')).toBeVisible();
});
