import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/loader';
import { createFlow, resolvePath, type FlowAction, type FlowState } from '../../src/engine/flow';
import { branchingRaw } from './fixtures';

const content = buildContent(branchingRaw());
const flow = createFlow(content);
const at = '2026-11-11T10:00:00.000Z';
const run = (actions: FlowAction[], from: FlowState = flow.initialState()) => actions.reduce(flow.reducer, from);

const toCompare = (role: 'reception' | 'assistant' = 'reception') =>
  run([{ type: 'START', at }, { type: 'NEXT' }, { type: 'SELECT_ROLE', role }, { type: 'NEXT' }, { type: 'NEXT' }]);
const toValues = () => run([{ type: 'ANSWER_QUESTION', questionId: 'Q-S05-01', optionId: 'B' }, { type: 'NEXT' }], toCompare());
const toJourney = () =>
  run(
    [
      { type: 'MATCH_VALUE', itemId: 'item-a', valueId: 'v1' },
      { type: 'MATCH_VALUE', itemId: 'item-b', valueId: 'v2' },
      { type: 'NEXT' },
    ],
    toValues(),
  );

describe('role paths', () => {
  it('routes each role through its own screen and shares the rest', () => {
    expect(resolvePath(content.course, 'reception')).toEqual(['S00', 'S01', 'S02', 'S05', 'S06', 'S07']);
    expect(resolvePath(content.course, 'clinician')).toEqual(['S00', 'S01', 'S04', 'S05', 'S06', 'S07']);
    expect(resolvePath(content.course, null)).toEqual(['S00', 'S01']);
  });

  it('requires role scenarios only on the role that has them', () => {
    const clinician = run([{ type: 'START', at }, { type: 'NEXT' }, { type: 'SELECT_ROLE', role: 'clinician' }, { type: 'NEXT' }]);
    expect(clinician.currentScreenId).toBe('S04');
    expect(flow.canAdvance(clinician)).toBe(false);
    const answered = run(
      [
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-COM-01', optionId: 'A' },
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-REC-01', optionId: 'B' }, // not on this track: ignored
        { type: 'ANSWER_PRACTICE', scenarioId: 'SC-CLN-01', optionId: 'C' },
      ],
      clinician,
    );
    expect(answered.answers).toEqual({ 'SC-COM-01': ['A'], 'SC-CLN-01': ['C'] });
    expect(flow.canAdvance(answered)).toBe(true);
  });
});

describe('skip prevention', () => {
  it('does not leave the intro before START, or role selection without a role', () => {
    expect(run([{ type: 'NEXT' }]).currentScreenId).toBe('S00');
    expect(run([{ type: 'START', at }, { type: 'NEXT' }, { type: 'NEXT' }]).currentScreenId).toBe('S01');
  });

  it('gates the comparison on an answer, right or wrong', () => {
    const state = toCompare();
    expect(state.currentScreenId).toBe('S05');
    expect(flow.canAdvance(state)).toBe(false);
    expect(flow.canAdvance(run([{ type: 'ANSWER_QUESTION', questionId: 'Q-S05-01', optionId: 'C' }], state))).toBe(true);
  });

  it('ignores answers to other questions and unknown options', () => {
    const state = toCompare();
    expect(run([{ type: 'ANSWER_QUESTION', questionId: 'Q-S99-01', optionId: 'A' }], state)).toBe(state);
    expect(run([{ type: 'ANSWER_QUESTION', questionId: 'Q-S05-01', optionId: 'Z' }], state)).toBe(state);
  });

  it('completes the values exercise only when every item is matched correctly; wrong tries are kept', () => {
    let state = run([{ type: 'MATCH_VALUE', itemId: 'item-a', valueId: 'v2' }], toValues());
    expect(flow.canAdvance(state)).toBe(false);
    state = run([{ type: 'MATCH_VALUE', itemId: 'item-a', valueId: 'v1' }, { type: 'MATCH_VALUE', itemId: 'item-b', valueId: 'v2' }], state);
    expect(state.answers['S06:item-a']).toEqual(['v2', 'v1']);
    expect(flow.canAdvance(state)).toBe(true);
  });

  it('refuses GOTO beyond incomplete screens and allows going back', () => {
    const state = toCompare();
    expect(run([{ type: 'GOTO', screenId: 'S07' }], state).currentScreenId).toBe('S05');
    expect(run([{ type: 'GOTO', screenId: 'S00' }], state).currentScreenId).toBe('S00');
    expect(run([{ type: 'GOTO', screenId: 'S03' }], state).currentScreenId).toBe('S05'); // another role's screen
  });
});

describe('journey and completion', () => {
  it('requires all five stages, ignores unknown ones and completes once', () => {
    let state = toJourney();
    expect(state.currentScreenId).toBe('S07');
    state = run(['one', 'two', 'two', 'three', 'four', 'nope'].map((stageId) => ({ type: 'VISIT_STAGE', stageId, at }) as const), state);
    expect(state.visited).toEqual(['S07:one', 'S07:two', 'S07:three', 'S07:four']);
    expect(state.completedAt).toBeNull();
    state = run([{ type: 'VISIT_STAGE', stageId: 'five', at: '2026-11-11T11:00:00.000Z' }], state);
    expect(state.completedAt).toBe('2026-11-11T11:00:00.000Z');
    state = run([{ type: 'BACK' }, { type: 'NEXT' }, { type: 'VISIT_STAGE', stageId: 'one', at: '2026-11-11T12:00:00.000Z' }], state);
    expect(state.completedAt).toBe('2026-11-11T11:00:00.000Z');
  });

  it('has no screen after the end', () => {
    expect(flow.canAdvance(toJourney())).toBe(false);
  });

  it('reports chapters with their state', () => {
    const chapters = flow.chapters(toCompare());
    expect(chapters.map((c) => [c.screenId, c.complete, c.current])).toEqual([
      ['S00', true, false],
      ['S01', true, false],
      ['S02', true, false],
      ['S05', false, true],
      ['S06', false, false],
      ['S07', false, false],
    ]);
  });

  it('resets to a clean state', () => {
    expect(run([{ type: 'RESET' }], toJourney())).toEqual(flow.initialState());
  });
});

describe('restore', () => {
  it('accepts a legitimate saved state', () => {
    const state = toJourney();
    expect(flow.restore(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it('rejects malformed state and states that skip ahead', () => {
    expect(flow.restore(null)).toBeNull();
    expect(flow.restore({ ...flow.initialState(), extra: 1 })).toBeNull();
    expect(flow.restore({ ...flow.initialState(), currentScreenId: 'S07' })).toBeNull();
    expect(flow.restore({ ...flow.initialState(), currentScreenId: 'S77' })).toBeNull();
  });
});
