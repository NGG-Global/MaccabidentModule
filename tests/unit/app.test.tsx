import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App, flow } from '../../src/App';
import type { AnalyticsEvent } from '../../src/analytics/events';
import { createTracker } from '../../src/analytics/tracker';
import type { FlowState } from '../../src/engine/flow';
import type { ProgressStore } from '../../src/engine/progress';

const setup = (saved: FlowState | null = null) => {
  const events: AnalyticsEvent[] = [];
  let stored = saved;
  const store: ProgressStore = {
    load: () => stored,
    save: (s) => void (stored = s),
    clear: () => void (stored = null),
  };
  const tracker = createTracker({
    adapter: { send: (e) => void events.push(e) },
    courseId: 'good-hands',
    courseVersion: '0.1.0',
    sessionId: 's',
    anonymousLearnerId: 'l',
    onProblem: (name, problems) => {
      throw new Error(`invalid event ${name}: ${problems.join('; ')}`);
    },
  });
  const user = userEvent.setup();
  render(<App store={store} tracker={tracker} />);
  return { events, user, saved: () => stored, names: () => events.map((e) => e.eventName) };
};

const next = () => screen.getByRole('button', { name: 'המשך' });

describe('vertical slice', () => {
  it('runs from opening to summary and records a valid event for every step', async () => {
    const { events, user, names, saved } = setup();

    // S00: gated until Start; transcript replaces the missing narration
    expect(next()).toBeDisabled();
    expect(screen.queryByTestId('transcript')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'התחלה' }));
    expect(screen.getByTestId('transcript')).toBeVisible();
    await user.click(next());

    // S01: gated until a role is chosen
    expect(next()).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /סייעות/ }));
    await user.click(next());

    // S03: values from the content master
    expect(screen.getAllByTestId('value-card')).toHaveLength(3);
    await user.click(next());

    // S05: wrong answer, specific feedback, retry, preferred answer
    expect(next()).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /כולם מחכים/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-rating', 'undesirable');
    expect(within(screen.getByTestId('feedback')).getByText(/תגובה לא רצויה/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'ניסיון נוסף' }));
    await user.click(screen.getByRole('radio', { name: /אני מבין/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-rating', 'preferred');
    await user.click(next());

    // S09
    expect(screen.getByRole('heading', { level: 1, name: 'סיכום' })).toBeVisible();
    expect(screen.getByTestId('summary-role')).toHaveTextContent('סייעות');
    expect(screen.getByTestId('summary-practice')).toHaveTextContent('ניסיונות: 2');
    expect(screen.queryByRole('button', { name: 'המשך' })).not.toBeInTheDocument();

    expect(names()).toEqual([
      'screen_viewed',
      'course_started',
      'screen_viewed',
      'role_selected',
      'screen_viewed',
      'screen_viewed',
      'scenario_answered',
      'feedback_viewed',
      'scenario_answered',
      'feedback_viewed',
      'screen_viewed',
      'course_completed',
    ]);
    const answers = events.filter((e) => e.eventName === 'scenario_answered');
    expect(answers.map((e) => e.payload)).toMatchObject([
      { answerId: 'A', isPreferred: false, attemptNumber: 1, mode: 'practice' },
      { answerId: 'B', isPreferred: true, attemptNumber: 2, mode: 'practice' },
    ]);
    expect(answers.every((e) => e.scenarioId === 'SC-COM-01' && e.role === 'assistant' && e.screenId === 'S05')).toBe(true);
    expect(saved()?.completedAt).not.toBeNull();
  });

  it('reports the role once, with the final choice', async () => {
    const { events, user } = setup();
    await user.click(screen.getByRole('button', { name: 'התחלה' }));
    await user.click(next());
    await user.click(screen.getByRole('radio', { name: /נציגות שירות/ }));
    await user.click(screen.getByRole('radio', { name: /רופאי/ }));
    await user.click(next());
    const selected = events.filter((e) => e.eventName === 'role_selected');
    expect(selected).toHaveLength(1);
    expect(selected[0]?.payload).toEqual({ role: 'clinician' });
  });

  it('resumes on the saved screen and reports the resume', () => {
    const mid = [
      { type: 'START', at: 't' } as const,
      { type: 'NEXT', at: 't' } as const,
      { type: 'SELECT_ROLE', role: 'reception' } as const,
      { type: 'NEXT', at: 't' } as const,
    ].reduce(flow.reducer, flow.initialState());
    const { names } = setup(mid);
    expect(screen.getByRole('heading', { level: 1, name: 'שלושת ערכי השירות' })).toBeVisible();
    expect(names()).toEqual(['course_resumed', 'screen_viewed']);
  });

  it('restarts from the summary only after confirmation', async () => {
    const { user, saved } = setup();
    await user.click(screen.getByRole('button', { name: 'התחלה' }));
    await user.click(next());
    await user.click(screen.getByRole('radio', { name: /סייעות/ }));
    await user.click(next());
    await user.click(next());
    await user.click(screen.getByRole('radio', { name: /אני מבין/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));
    await user.click(next());

    await user.click(screen.getByRole('button', { name: 'התחלה מחדש' }));
    await user.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(screen.getByRole('heading', { level: 1, name: 'סיכום' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'התחלה מחדש' }));
    await user.click(screen.getByRole('button', { name: 'כן, להתחיל מחדש' }));
    expect(screen.getByRole('button', { name: 'התחלה' })).toBeVisible();
    expect(saved()).toEqual(flow.initialState());
  });
});
