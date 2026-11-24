import { describe, expect, it } from 'vitest';
import { content } from '../../src/content';
import { buildContent } from '../../src/content/loader';
import { ROLES } from '../../src/content/schema';
import { drawAssessment, optionOrder, shuffle } from '../../src/engine/assessment';
import { branchingRaw } from './fixtures';

const fixture = buildContent(branchingRaw());
const s08 = fixture.screens.S08!.interaction!;
if (s08.type !== 'assessment') throw new Error('fixture S08 must be an assessment');

describe('drawAssessment', () => {
  it('draws the configured shared and role questions, shared first', () => {
    for (const role of ROLES) {
      const drawn = drawAssessment(s08, fixture.questions, role, 1);
      expect(drawn).toHaveLength(s08.commonCount + s08.roleCount);
      expect(drawn.slice(0, s08.commonCount).every((q) => q.track === 'common')).toBe(true);
      expect(drawn.slice(s08.commonCount).every((q) => q.track === role)).toBe(true);
    }
  });

  it('is reproducible for an attempt and may change order on a retry', () => {
    const a = drawAssessment(s08, fixture.questions, 'reception', 1).map((q) => q.questionId);
    expect(drawAssessment(s08, fixture.questions, 'reception', 1).map((q) => q.questionId)).toEqual(a);
    const orders = new Set([1, 2, 3, 4, 5, 6].map((n) => drawAssessment(s08, fixture.questions, 'reception', n).map((q) => q.questionId).join()));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('draws exactly 2 shared + 3 role questions from the shipped pool for each role', () => {
    const shipped = content.screens.S08!.interaction!;
    if (shipped.type !== 'assessment') throw new Error('S08 must be an assessment');
    for (const role of ROLES) {
      const drawn = drawAssessment(shipped, content.questions, role, 1);
      expect(drawn.map((q) => q.track)).toEqual(['common', 'common', role, role, role]);
    }
  });
});

describe('option order', () => {
  it('shuffles display order but keeps option ids and correctness', () => {
    const q = content.questions['Q-S08-01']!;
    const shown = optionOrder(q.options, 'Q-S08-01:1');
    expect(shown.map((o) => o.id).sort()).toEqual(['A', 'B', 'C']);
    expect(shown.find((o) => o.correct)?.id).toBe(q.options.find((o) => o.correct)?.id);
    expect(optionOrder(q.options, 'Q-S08-01:1')).toEqual(shown);
  });

  it('keeps every item when shuffling', () => {
    expect(shuffle([1, 2, 3, 4, 5], 42).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
