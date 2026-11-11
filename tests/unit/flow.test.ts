import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/loader';
import { createFlow, resolvePath, type FlowAction, type FlowState } from '../../src/engine/flow';
import { branchingRaw } from './fixtures';

const content = buildContent(branchingRaw());
const flow = createFlow(content);
const at = '2026-11-11T10:00:00.000Z';
const run = (actions: FlowAction[], from: FlowState = flow.initialState()) => actions.reduce(flow.reducer, from);

const toScenarios = (role: 'reception' | 'assistant' | 'clinician') =>
  run([
    { type: 'START', at },
    { type: 'NEXT', at },
    { type: 'SELECT_ROLE', role },
    { type: 'NEXT', at },
    { type: 'NEXT', at },
  ]);

describe('role paths', () => {
  it('routes each role through its own screen and shares the rest', () => {
    expect(resolvePath(content.course, 'reception')).toEqual(['S00', 'S01', 'S02', 'S05', 'S09']);
    expect(resolvePath(content.course, 'assistant')).toEqual(['S00', 'S01', 'S03', 'S05', 'S09']);
    expect(resolvePath(content.course, 'clinician')).toEqual(['S00', 'S01', 'S04', 'S05', 'S09']);
  });

  it('stops at the branch while no role is chosen', () => {
    expect(resolvePath(content.course, null)).toEqual(['S00', 'S01']);
  });

  it('changes role scenarios without changing the shared one', () => {
    expect(toScenarios('reception').currentScreenId).toBe('S05');
    const assistant = run(
      [
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-REC-01', optionId: 'B' }, // not on the assistant track: ignored
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-COM-01', optionId: 'A' },
      ],
      toScenarios('assistant'),
    );
    expect(assistant.practiceAnswers).toEqual({ 'SC-COM-01': ['A'] });
  });
});

describe('skip prevention', () => {
  it('does not leave the intro before START', () => {
    const state = run([{ type: 'NEXT', at }]);
    expect(state.currentScreenId).toBe('S00');
    expect(flow.canAdvance(state)).toBe(false);
  });

  it('does not leave role selection without a role', () => {
    const state = run([{ type: 'START', at }, { type: 'NEXT', at }, { type: 'NEXT', at }]);
    expect(state.currentScreenId).toBe('S01');
  });

  it('requires every scenario on the screen to be attempted, right or wrong', () => {
    let state = toScenarios('clinician');
    expect(flow.canAdvance(state)).toBe(false);
    state = run([{ type: 'ANSWER_PRACTICE', scenarioId: 'SC-COM-01', optionId: 'A' }], state);
    expect(flow.canAdvance(state)).toBe(false);
    state = run([{ type: 'ANSWER_PRACTICE', scenarioId: 'SC-CLN-01', optionId: 'C' }], state);
    expect(flow.canAdvance(state)).toBe(true);
  });

  it('ignores answers with an unknown option', () => {
    const before = toScenarios('reception');
    expect(run([{ type: 'ANSWER_PRACTICE', scenarioId: 'SC-COM-01', optionId: 'Z' }], before)).toBe(before);
  });

  it('refuses GOTO to a screen beyond incomplete ones, and allows going back to visited ones', () => {
    const state = run([{ type: 'START', at }, { type: 'NEXT', at }, { type: 'SELECT_ROLE', role: 'reception' }]);
    expect(run([{ type: 'GOTO', screenId: 'S09' }], state).currentScreenId).toBe('S01');
    expect(run([{ type: 'GOTO', screenId: 'S05' }], state).currentScreenId).toBe('S01');
    expect(run([{ type: 'GOTO', screenId: 'S00' }], state).currentScreenId).toBe('S00');
    expect(run([{ type: 'GOTO', screenId: 'S03' }], state).currentScreenId).toBe('S01'); // another role's screen
  });
});

describe('progression', () => {
  it('records practice retries in order', () => {
    const state = run(
      [
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-COM-01', optionId: 'A' },
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-COM-01', optionId: 'B' },
      ],
      toScenarios('reception'),
    );
    expect(state.practiceAnswers['SC-COM-01']).toEqual(['A', 'B']);
  });

  it('marks completion once, on first reaching the summary', () => {
    let state = run(
      [
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-COM-01', optionId: 'B' },
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-REC-01', optionId: 'B' },
        { type: 'NEXT', at: '2026-11-11T10:30:00.000Z' },
      ],
      toScenarios('reception'),
    );
    expect(state.currentScreenId).toBe('S09');
    expect(state.completedAt).toBe('2026-11-11T10:30:00.000Z');
    expect(flow.canAdvance(state)).toBe(false);
    state = run([{ type: 'BACK' }, { type: 'NEXT', at: '2026-11-11T11:00:00.000Z' }], state);
    expect(state.completedAt).toBe('2026-11-11T10:30:00.000Z');
  });

  it('goes back along the learner path and reports progress', () => {
    const state = toScenarios('assistant');
    expect(flow.progress(state)).toEqual({ current: 4, total: 5 });
    expect(run([{ type: 'BACK' }], state).currentScreenId).toBe('S03');
    expect(run([{ type: 'BACK' }]).currentScreenId).toBe('S00');
  });

  it('resets to a clean state', () => {
    expect(run([{ type: 'RESET' }], toScenarios('assistant'))).toEqual(flow.initialState());
  });
});

describe('restore', () => {
  it('accepts a legitimate saved state', () => {
    const state = toScenarios('assistant');
    expect(flow.restore(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it('rejects malformed state and states that skip ahead', () => {
    expect(flow.restore(null)).toBeNull();
    expect(flow.restore({ ...flow.initialState(), extra: 1 })).toBeNull();
    expect(flow.restore({ ...flow.initialState(), currentScreenId: 'S09' })).toBeNull();
    expect(flow.restore({ ...flow.initialState(), currentScreenId: 'S77' })).toBeNull();
  });
});
