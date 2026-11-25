import { expect, test, type Page } from '@playwright/test';
import { collectEvents, DONE_S04, expectFitsWindow, expectNoBrokenLayout, finishBeat, finishSequence, footerForward, forward, heading, next, seedProgress, stageStatus, waitForStage } from './helpers';

/**
 * S05–S09 in a real browser, for each role, on desktop and at 360px: the
 * scenarios with answer-specific narrated feedback, the scored assessment with review and retry, and the conclusion.
 */

type Role = 'reception' | 'assistant' | 'clinician';
const CASES: Record<Role, string[]> = {
  reception: ['SC-REC-01', 'SC-REC-02'],
  assistant: ['SC-AST-01', 'SC-AST-02'],
  clinician: ['SC-CLN-01', 'SC-CLN-02'],
};
const PREFIX: Record<Role, string> = { reception: 'AUDIO-S06-REC', assistant: 'AUDIO-S06-AST', clinician: 'AUDIO-S06-CLN' };

/** Answer the open decision with `optionId` and wait until that answer's own feedback narration plays. */
async function answer(page: Page, scenarioId: string, optionId: string, audioId: string, events: ReturnType<typeof collectEvents>) {
  await page.getByTestId('decision').locator(`[data-option="${optionId}"]`).click();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await waitForStage(page, (s) => s.key === `fb:${scenarioId}:${optionId}` && s.beat === 'narration' && s.status === 'playing');
  await expect.poll(() => events.events.filter((e) => e.eventName === 'narration_started').at(-1)?.payload.audioId).toBe(audioId);
  await expect(page.getByTestId('scenario-feedback')).toHaveAttribute('data-rating', optionId === 'B' ? 'preferred' : 'undesirable');
}

/** Move from the situation to the decision: the question opens as it is asked, or via the footer. */
async function toDecision(page: Page) {
  await waitForStage(page, (s) => Boolean(s.key?.startsWith('situation:')));
  // The footer opens the decision at any time; the question then plays aloud where it has its own recording.
  await footerForward(page).click();
  await expect(page.getByTestId('decision')).toBeVisible();
}

async function correctOption(page: Page, questionId: string): Promise<string> {
  return page.evaluate(async (q) => (await import(/* @vite-ignore */ `/src/content/questions/${q}.json`)).default.options.find((o: { correct: boolean }) => o.correct).id, questionId);
}

/** Answers the five assessment questions; `wrong` lists question positions (0-based) to answer incorrectly. */
async function takeAssessment(page: Page, wrong: number[]) {
  await expect(page.getByTestId('assessment-intro')).toBeVisible();
  await footerForward(page).click();
  for (let i = 0; i < 5; i++) {
    const card = page.getByTestId('assessment-question');
    await expect(page.getByTestId('question-counter')).toHaveText(`שאלה ${i + 1} מתוך 5`);
    // No feedback while answering.
    await expect(page.getByTestId('scenario-feedback')).toHaveCount(0);
    const qid = (await card.getAttribute('data-question-id'))!;
    const right = await correctOption(page, qid);
    const pick = wrong.includes(i) ? ['A', 'B', 'C'].find((o) => o !== right)! : right;
    await card.locator(`[data-option="${pick}"]`).click();
    await footerForward(page).click();
  }
}

for (const role of ['reception', 'assistant', 'clinician'] as Role[]) {
  test(`${role}: S05 to S09 with answer-specific feedback, assessment and completion`, async ({ page }) => {
    test.setTimeout(150_000);
    const events = collectEvents(page);
    const failed: string[] = [];
    page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
    await seedProgress(page, { role, currentScreenId: 'S05', ...DONE_S04 });

    // S05 — the shared delay scenario: situation (narration, then Yossi's complaint on video), decision, feedback.
    await expect(heading(page, 'תרחיש: עיכוב בתור')).toBeVisible();
    await page.getByTestId('stage-play').click();
    // Chapter card (may end by itself), then the situation narration, then the video.
    await waitForStage(page, (s) => s.key === 'situation:SC-COM-01' && s.index >= 1);
    if ((await stageStatus(page))?.beat !== 'video') {
      await waitForStage(page, (s) => s.beat === 'narration');
      await finishBeat(page);
    }
    await waitForStage(page, (s) => s.key === 'situation:SC-COM-01' && s.beat === 'video' && s.status === 'playing');
    expect(await page.locator('video').count(), 'one video only').toBe(1);
    await finishBeat(page);
    await expect(page.getByTestId('decision')).toBeVisible(); // opens as the question is asked
    await expect(page.getByTestId('decision').locator('[data-mark="correct"]')).toHaveCount(0); // nothing revealed before answering
    await expectFitsWindow(page, 'S05 decision');
    await answer(page, 'SC-COM-01', 'C', 'AUDIO-S05-FB-C', events);
    await page.getByTestId('try-again').click();
    await answer(page, 'SC-COM-01', 'B', 'AUDIO-S05-FB-B', events);
    await finishBeat(page);
    await waitForStage(page, (s) => s.beat === 'video' && s.status === 'playing'); // the consequence clip follows the preferred answer
    await expectFitsWindow(page, 'S05 feedback');
    await footerForward(page).click();

    // S06 — only this role's two cases.
    await expect(heading(page, 'תרחישים מהעבודה שלך')).toBeVisible();
    for (const [i, id] of CASES[role].entries()) {
      await expect(page.getByTestId('scenario')).toHaveAttribute('data-scenario-id', id);
      await expect(page.getByTestId('case-counter')).toContainText(`מקרה ${i + 1} מתוך 2`);
      await toDecision(page);
      const wrong = i === 0 ? 'A' : 'C';
      await answer(page, id, wrong, `${PREFIX[role]}${i + 1}-FB-${wrong}`, events);
      await page.getByTestId('try-again').click();
      await answer(page, id, 'B', `${PREFIX[role]}${i + 1}-FB-B`, events);
      if (i === 0) await expectFitsWindow(page, 'S06 feedback');
      await footerForward(page).click();
    }

    // S07 ("איך אנחנו לומדים ומשתפרים") was removed: S06 leads straight to the assessment.
    // S08 — fail first (3 of 5 = 60), review, retry and pass (4 of 5 = 80, the threshold).
    await expect(heading(page, 'האתגר המסכם')).toBeVisible();
    await takeAssessment(page, [0, 3]);
    await expect(page.getByTestId('assessment-score')).toHaveAttribute('data-passed', 'false');
    await expect(page.getByTestId('assessment-score')).toContainText('60');
    await expect(page.getByTestId('assessment-improve')).toBeVisible();
    await expect(page.getByTestId('assessment-review').locator('[data-correct="false"]')).toHaveCount(2);
    await page.getByTestId('assessment-retry').click();
    await takeAssessment(page, [4]);
    await expect(page.getByTestId('assessment-score')).toHaveAttribute('data-passed', 'true');
    await expect(page.getByTestId('assessment-score')).toContainText('80');
    await expectFitsWindow(page, 'S08 result');
    await footerForward(page).click();

    // S09 — complete only now; the course is marked complete exactly once.
    await expect(page.getByTestId('completion-status')).toHaveAttribute('data-complete', 'true');
    await expect(page.getByTestId('final-score')).toHaveText('80');
    await waitForStage(page, (s) => s.beat === 'video' && s.status === 'playing');
    await expectFitsWindow(page, 'S09');
    await expectNoBrokenLayout(page);
    const names = events.names();
    expect(names.filter((n) => n === 'course_completed')).toHaveLength(1);
    expect(names.filter((n) => n === 'assessment_completed')).toHaveLength(2);
    const attempts = events.events.filter((e) => e.eventName === 'assessment_completed').map((e) => [e.payload.percent, e.payload.passed]);
    expect(attempts).toEqual([
      [60, false],
      [80, true],
    ]);
    expect(events.dropped, 'every event matches its schema').toEqual([]);
    expect(failed, 'every requested asset loaded').toEqual([]);
  });
}

test('the end screen does not report completion without a passed assessment, and leads back to it', async ({ page }) => {
  const failedAttempt = {
    attemptId: 'attempt-1',
    attemptNumber: 1,
    answers: [{ questionId: 'Q-S08-01', optionId: 'B' }],
    score: 0,
    maxScore: 20,
    percent: 0,
    passed: false,
    criticalMisses: ['Q-S08-01'],
    completedAt: '2026-11-24T09:00:00.000Z',
  };
  await seedProgress(page, { role: 'clinician', currentScreenId: 'S09', ...DONE_S04, completed: [...DONE_S04.completed, 'S05', 'S06', 'S08'], answers: { ...DONE_S04.answers, 'SC-COM-01': ['B'], 'SC-CLN-01': ['B'], 'SC-CLN-02': ['B'] }, attempts: [failedAttempt] });
  await expect(page.getByTestId('completion-status')).toHaveAttribute('data-complete', 'false');
  await page.getByTestId('back-to-assessment').click();
  await expect(heading(page, 'האתגר המסכם')).toBeVisible();
  await expect(page.getByTestId('assessment-review')).toBeVisible();
});

test('progress inside S06 survives a refresh: answered cases stay answered', async ({ page }) => {
  await seedProgress(page, { role: 'assistant', currentScreenId: 'S06', ...DONE_S04, completed: [...DONE_S04.completed, 'S05'], answers: { ...DONE_S04.answers, 'SC-COM-01': ['B'], 'SC-AST-01': ['A', 'B'] } });
  await expect(page.getByTestId('scenario')).toHaveAttribute('data-scenario-id', 'SC-AST-02');
  await expect(page.getByTestId('case-counter')).toContainText('מקרה 2 מתוך 2');
  expect((await stageStatus(page))?.status).toBe('ready'); // nothing plays after a refresh until the learner presses play
});

/** A screen is not empty: it has its heading and real content, and the header shows the nine chapters. */
async function expectFilledScreen(page: Page, title: string) {
  await expect(page.locator('#main h1').first()).toHaveText(title);
  const text = (await page.locator('#main').innerText()).replace(/\s+/g, ' ').trim();
  expect(text.length, `${title}: the screen has content`).toBeGreaterThan(60);
  await expect(page.getByTestId('stage-empty')).toHaveCount(0);
  // Wide screens list the chapters; phones show "פרק X מתוך 9".
  if ((page.viewportSize()?.width ?? 0) >= 768) await expect(page.getByRole('navigation', { name: 'התקדמות בפרקים' }).getByRole('listitem')).toHaveCount(9);
  else await expect(page.getByTestId('progress-label')).toContainText('מתוך 9');
}

test('the whole course in one run, S00 to S09: nine chapters, no S07, assessment scored, no errors', async ({ page }) => {
  test.setTimeout(240_000);
  const events = collectEvents(page);
  const problems: string[] = [];
  // In development only, React StrictMode makes the Remotion Player report "Cannot suspend a closed AudioContext"
  // (documented in the README; the production build is checked separately and shows no errors).
  const devOnly = /Cannot suspend a closed AudioContext/;
  page.on('pageerror', (e) => !devOnly.test(e.message) && problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !devOnly.test(m.text()) && problems.push(`console: ${m.text()}`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  const titles: string[] = [];
  const seen = async (title: string) => {
    await expectFilledScreen(page, title);
    titles.push(title);
  };

  await page.goto('/');
  await page.getByRole('button', { name: 'התחלה', exact: true }).click();
  await waitForStage(page, (s) => s.status === 'playing');
  await seen('בידיים טובות');
  await next(page).click();

  await seen('מה התפקיד שלך במרפאה?');
  await page.getByText('סייעות', { exact: true }).click();
  await next(page).click();

  await seen('שתי חוויות של אותו מטופל');
  await forward(page, 'לשאלה').click();
  await page.getByText('יחס אישי, הכוונה ברורה').click();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await forward(page, 'להסבר').click();
  await next(page).click();

  await seen('שלושת ערכי השירות');
  await forward(page, 'לתרגול').click();
  await page.getByTestId('match-delay-update').getByRole('button', { name: 'רואים אותך' }).click();
  await page.getByTestId('match-adapt-explanation').getByRole('button', { name: 'מתאמצים למענך' }).click();
  await page.getByTestId('match-next-step').getByRole('button', { name: 'מלווים אותך לאורך הדרך' }).click();
  await next(page).click();

  await seen('מסע המטופל');
  await forward(page, 'לנקודות המגע').click();
  for (const id of ['prep', 'contact', 'communication', 'closing', 'followup']) await page.getByTestId(`stage-${id}`).click();
  // Station 5 carries the one statement about the satisfaction survey (shown once its narration has played).
  await finishSequence(page);
  await expect(page.getByTestId('stage-detail')).toContainText('בסיום הביקור נשלח למטופל סקר שביעות רצון, שעוזר לנו להמשיך ולשפר את השירות.');
  await forward(page, 'לסיכום הפרק').click();
  await next(page).click();

  await seen('תרחיש: עיכוב בתור');
  await toDecision(page);
  await page.getByTestId('decision').locator('[data-option="B"]').click();
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await footerForward(page).click();

  await seen('תרחישים מהעבודה שלך');
  for (const id of CASES.assistant) {
    await expect(page.getByTestId('scenario')).toHaveAttribute('data-scenario-id', id);
    await toDecision(page);
    await page.getByTestId('decision').locator('[data-option="B"]').click();
    await page.getByRole('button', { name: 'בדיקה' }).click();
    await footerForward(page).click();
  }

  // Straight from the role scenarios to the assessment: the removed chapter does not appear.
  await seen('האתגר המסכם');
  await expect(page.locator('#main')).not.toContainText('איך אנחנו לומדים ומשתפרים');
  await expect(page.locator('#main')).toContainText('פרק 6');
  await takeAssessment(page, []);
  await expect(page.getByTestId('assessment-score')).toHaveAttribute('data-passed', 'true');
  await expect(page.getByTestId('assessment-score')).toContainText('100');
  await footerForward(page).click();

  await seen('בידיים טובות');
  await expect(page.getByTestId('completion-status')).toHaveAttribute('data-complete', 'true');
  await expect(page.getByTestId('final-score')).toHaveText('100');
  await expectNoBrokenLayout(page);

  expect(titles).toHaveLength(9);
  expect(events.names().filter((n) => n === 'screen_viewed')).toHaveLength(9);
  expect(events.events.some((e) => e.screenId === 'S07'), 'no event from the removed screen').toBe(false);
  expect(events.names().filter((n) => n === 'course_completed')).toHaveLength(1);
  expect(events.dropped).toEqual([]);
  expect(problems, 'no errors and no failed requests').toEqual([]);
});
