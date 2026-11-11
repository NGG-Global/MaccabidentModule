import { describe, expect, it, vi } from 'vitest';
import type { AnalyticsAdapter } from '../../src/analytics/adapter';
import { CompositeAdapter, ConsoleAdapter, createAdapter, MemoryAdapter, NoopAdapter } from '../../src/analytics/adapter';
import { EVENT_NAMES, validateEvent, type AnalyticsEvent } from '../../src/analytics/events';
import { createTracker } from '../../src/analytics/tracker';

const recording = () => {
  const events: AnalyticsEvent[] = [];
  const adapter: AnalyticsAdapter = { send: (e) => void events.push(e) };
  return { events, adapter };
};

const make = (adapter: AnalyticsAdapter, onProblem = vi.fn()) => ({
  onProblem,
  tracker: createTracker({
    adapter,
    courseId: 'good-hands',
    courseVersion: '0.1.0',
    sessionId: 'session-opaque',
    anonymousLearnerId: 'learner-pseudonymous',
    now: () => new Date('2026-11-11T12:00:00Z'),
    newId: () => 'id-1',
    onProblem,
  }),
});

const fields = { role: 'reception' as const, screenId: 'S05' };

describe('event schema', () => {
  it('defines the ten local-only prototype events', () => {
    expect([...EVENT_NAMES].sort()).toEqual(
      [
        'course_started',
        'journey_stage_viewed',
        'narration_completed',
        'narration_started',
        'prototype_completed',
        'question_answered',
        'role_selected',
        'screen_viewed',
        'video_completed',
        'video_started',
      ],
    );
  });

  it('accepts the example event from the specification', () => {
    const example = {
      eventName: 'question_answered',
      eventId: 'generated-uuid',
      timestamp: '2026-11-11T12:00:00Z',
      sessionId: 'session-opaque',
      anonymousLearnerId: 'learner-pseudonymous',
      courseId: 'good-hands',
      courseVersion: '0.1.0',
      role: 'reception',
      screenId: 'S05',
      scenarioId: 'SC-COM-01',
      attemptId: 'attempt-1',
      schemaVersion: '1',
      payload: { questionId: 'Q-S02-01', answerId: 'A', isCorrect: true, attemptNumber: 1, responseTimeMs: 8200 },
    };
    expect(validateEvent(example).ok).toBe(true);
  });

  it('rejects unknown events and unexpected fields such as personal data', () => {
    expect(validateEvent({ eventName: 'made_up' }).ok).toBe(false);
    const { events, adapter } = recording();
    const { tracker, onProblem } = make(adapter);
    // @ts-expect-error employeeName is not part of the payload
    expect(tracker.track('role_selected', { role: 'reception', employeeName: 'x' }, fields)).toBe(false);
    expect(events).toHaveLength(0);
    expect(onProblem).toHaveBeenCalledOnce();
  });
});

describe('tracker', () => {
  it('builds the full envelope around the payload', () => {
    const { events, adapter } = recording();
    const { tracker } = make(adapter);
    const ok = tracker.track(
      'question_answered',
      { questionId: 'Q-S02-01', answerId: 'A', isCorrect: true, attemptNumber: 1, responseTimeMs: 10 },
      { ...fields, scenarioId: 'SC-COM-01' },
    );
    expect(ok).toBe(true);
    expect(events).toEqual([
      {
        eventName: 'question_answered',
        eventId: 'id-1',
        timestamp: '2026-11-11T12:00:00.000Z',
        sessionId: 'session-opaque',
        anonymousLearnerId: 'learner-pseudonymous',
        courseId: 'good-hands',
        courseVersion: '0.1.0',
        role: 'reception',
        screenId: 'S05',
        scenarioId: 'SC-COM-01',
        schemaVersion: '1',
        payload: { questionId: 'Q-S02-01', answerId: 'A', isCorrect: true, attemptNumber: 1, responseTimeMs: 10 },
      },
    ]);
  });

  it('allows events before a role is chosen', () => {
    const { events, adapter } = recording();
    make(adapter).tracker.track('course_started', {}, { role: null, screenId: 'S00' });
    expect(events[0]?.role).toBeNull();
  });

  it('never throws when the adapter fails, synchronously or asynchronously', async () => {
    const sync = make({
      send: () => {
        throw new Error('down');
      },
    });
    expect(sync.tracker.track('course_started', {}, fields)).toBe(false);
    expect(sync.onProblem).toHaveBeenCalledOnce();

    const asyncCase = make({ send: () => Promise.reject(new Error('timeout')) });
    expect(asyncCase.tracker.track('course_started', {}, fields)).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(asyncCase.onProblem).toHaveBeenCalledOnce();
  });

  it('generates distinct event ids by default, for deduplication', () => {
    const { events, adapter } = recording();
    const tracker = createTracker({ adapter, courseId: 'c', courseVersion: 'v', sessionId: 's', anonymousLearnerId: 'l' });
    tracker.track('course_started', {}, fields);
    tracker.track('course_started', {}, fields);
    expect(events[0]?.eventId).not.toBe(events[1]?.eventId);
  });
});

describe('adapters', () => {
  it('selects console only when asked, noop otherwise', () => {
    expect(createAdapter('console')).toBeInstanceOf(ConsoleAdapter);
    expect(createAdapter('noop')).toBeInstanceOf(NoopAdapter);
    expect(createAdapter('anything-else')).toBeInstanceOf(NoopAdapter);
  });

  it('keeps a bounded local buffer and isolates failing adapters', () => {
    const memory = new MemoryAdapter(2);
    const composite = new CompositeAdapter([
      {
        send: () => {
          throw new Error('down');
        },
      },
      memory,
    ]);
    const { tracker } = make(composite);
    for (let i = 0; i < 3; i++) expect(tracker.track('course_started', {}, fields)).toBe(true);
    expect(memory.events).toHaveLength(2);
  });
});
