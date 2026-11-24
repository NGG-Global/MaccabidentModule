import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/loader';
import { scoreAssessment } from '../../src/engine/scoring';
import { branchingRaw } from './fixtures';

const { questions, course } = buildContent(branchingRaw());
const config = course.assessment; // 20 points per decision, pass at 80
const ids = ['Q-S08-01', 'Q-S08-02', 'Q-S08-03', 'Q-S08-04', 'Q-S08-05'];
// In the fixture every question's correct option is A.
const answers = (options: string) => ids.map((questionId, i) => ({ questionId, optionId: options[i]! }));

describe('scoreAssessment', () => {
  it('gives 100 for five correct decisions', () => {
    expect(scoreAssessment(answers('AAAAA'), questions, config)).toMatchObject({ score: 100, maxScore: 100, percent: 100, passed: true, criticalMisses: [] });
  });

  it('passes exactly at the threshold and fails just below it', () => {
    expect(scoreAssessment(answers('AAAAB'), questions, config)).toMatchObject({ score: 80, percent: 80, passed: true });
    expect(scoreAssessment(answers('AAABB'), questions, config)).toMatchObject({ score: 60, percent: 60, passed: false });
  });

  it('uses the configured threshold', () => {
    expect(scoreAssessment(answers('AAABB'), questions, { ...config, passThreshold: 60 }).passed).toBe(true);
  });

  it('scores an unanswered question as zero', () => {
    const list = answers('AAAAA');
    list[4] = { questionId: 'Q-S08-05', optionId: '' };
    expect(scoreAssessment(list, questions, config)).toMatchObject({ score: 80, passed: true });
  });

  it('flags a missed critical question without changing the pass rule', () => {
    const result = scoreAssessment(answers('BAAAA'), questions, config);
    expect(result.criticalMisses).toEqual(['Q-S08-01']);
    expect(result.passed).toBe(true);
  });

  it('does not pass an empty attempt', () => {
    expect(scoreAssessment([], questions, config)).toMatchObject({ percent: 0, passed: false });
  });

  it('throws on unknown question or option ids', () => {
    expect(() => scoreAssessment([{ questionId: 'Q-S99-01', optionId: 'A' }], questions, config)).toThrow();
    expect(() => scoreAssessment([{ questionId: 'Q-S08-01', optionId: 'Z' }], questions, config)).toThrow();
  });
});
