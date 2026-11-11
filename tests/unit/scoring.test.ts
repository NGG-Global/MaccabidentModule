import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/loader';
import { scoreAssessment } from '../../src/engine/scoring';
import { branchingRaw } from './fixtures';

const { scenarios, course } = buildContent(branchingRaw());
const config = course.assessment; // 20 points per decision, pass at 80, no partial credit
const ids = ['SC-COM-01', 'SC-COM-02', 'SC-REC-01', 'SC-AST-01', 'SC-CLN-01'];
const answers = (options: string) => ids.map((scenarioId, i) => ({ scenarioId, optionId: options[i]! }));

describe('scoreAssessment', () => {
  it('gives 100 for five preferred decisions', () => {
    const result = scoreAssessment(answers('BBBBB'), scenarios, config);
    expect(result).toMatchObject({ score: 100, maxScore: 100, percent: 100, passed: true, criticalMisses: [] });
  });

  it('passes exactly at the threshold and fails just below it', () => {
    expect(scoreAssessment(answers('BBBBA'), scenarios, config)).toMatchObject({ percent: 80, passed: true });
    expect(scoreAssessment(answers('BBBAA'), scenarios, config)).toMatchObject({ percent: 60, passed: false });
  });

  it('uses the configured threshold', () => {
    expect(scoreAssessment(answers('BBBAA'), scenarios, { ...config, passThreshold: 60 }).passed).toBe(true);
  });

  it('gives partial options no credit by default and the configured share otherwise', () => {
    expect(scoreAssessment(answers('CBBBB'), scenarios, config).score).toBe(80);
    expect(scoreAssessment(answers('CBBBB'), scenarios, { ...config, partialCreditRatio: 0.5 }).score).toBe(90);
  });

  it('flags a missed critical scenario without changing the pass rule', () => {
    const result = scoreAssessment(answers('BABBB'), scenarios, config);
    expect(result.criticalMisses).toEqual(['SC-COM-02']);
    expect(result.passed).toBe(true);
  });

  it('does not pass an empty attempt', () => {
    expect(scoreAssessment([], scenarios, config)).toMatchObject({ percent: 0, passed: false });
  });

  it('throws on unknown scenario or option ids', () => {
    expect(() => scoreAssessment([{ scenarioId: 'SC-XXX-01', optionId: 'A' }], scenarios, config)).toThrow();
    expect(() => scoreAssessment([{ scenarioId: 'SC-COM-01', optionId: 'Z' }], scenarios, config)).toThrow();
  });
});
