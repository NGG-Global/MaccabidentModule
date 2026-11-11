import type { CourseConfig, Scenario } from '../content/schema';

export interface AssessmentAnswer {
  scenarioId: string;
  optionId: string;
}

export interface AssessmentResult {
  score: number;
  maxScore: number;
  /** 0–100, rounded to the nearest whole number. */
  percent: number;
  passed: boolean;
  /** Critical scenarios (e.g. privacy) answered with a non-preferred option. Flag only; not a pass rule. */
  criticalMisses: string[];
  perDecision: { scenarioId: string; optionId: string; points: number; isPreferred: boolean }[];
}

/**
 * Scores a summative attempt. Threshold, points and partial credit come from
 * course.json so the rule can change without code changes.
 */
export function scoreAssessment(
  answers: AssessmentAnswer[],
  scenarios: Record<string, Scenario>,
  config: CourseConfig['assessment'],
): AssessmentResult {
  const perDecision = answers.map(({ scenarioId, optionId }) => {
    const scenario = scenarios[scenarioId];
    if (!scenario) throw new Error(`Unknown scenario ${scenarioId}`);
    const option = scenario.options.find((o) => o.id === optionId);
    if (!option) throw new Error(`Unknown option ${optionId} in ${scenarioId}`);
    const ratio = option.rating === 'preferred' ? 1 : option.rating === 'partial' ? config.partialCreditRatio : 0;
    return { scenarioId, optionId, points: config.pointsPerDecision * ratio, isPreferred: option.rating === 'preferred' };
  });

  const score = perDecision.reduce((sum, d) => sum + d.points, 0);
  const maxScore = answers.length * config.pointsPerDecision;
  const percent = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  const criticalMisses = perDecision
    .filter((d) => !d.isPreferred && scenarios[d.scenarioId]?.critical)
    .map((d) => d.scenarioId);

  return { score, maxScore, percent, passed: maxScore > 0 && percent >= config.passThreshold, criticalMisses, perDecision };
}
