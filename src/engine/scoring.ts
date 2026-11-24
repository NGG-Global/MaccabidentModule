import type { CourseConfig, Question } from '../content/schema';

export interface AssessmentAnswer {
  questionId: string;
  optionId: string;
}

export interface AssessmentResult {
  score: number;
  maxScore: number;
  /** 0–100, rounded to the nearest whole number. */
  percent: number;
  passed: boolean;
  /** Critical questions (e.g. privacy) answered incorrectly. Flag only; not a pass rule. */
  criticalMisses: string[];
  perDecision: { questionId: string; optionId: string; points: number; correct: boolean }[];
}

/**
 * Scores an assessment attempt. Threshold and points come from course.json,
 * so the rule can change without code changes. An unanswered question scores 0.
 */
export function scoreAssessment(
  answers: AssessmentAnswer[],
  questions: Record<string, Question>,
  config: CourseConfig['assessment'],
): AssessmentResult {
  const perDecision = answers.map(({ questionId, optionId }) => {
    const question = questions[questionId];
    if (!question) throw new Error(`Unknown question ${questionId}`);
    const option = question.options.find((o) => o.id === optionId);
    if (optionId && !option) throw new Error(`Unknown option ${optionId} in ${questionId}`);
    const correct = option?.correct === true;
    return { questionId, optionId, points: correct ? config.pointsPerDecision : 0, correct };
  });

  const score = perDecision.reduce((sum, d) => sum + d.points, 0);
  const maxScore = answers.length * config.pointsPerDecision;
  const percent = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  const criticalMisses = perDecision.filter((d) => !d.correct && questions[d.questionId]?.critical).map((d) => d.questionId);

  return { score, maxScore, percent, passed: maxScore > 0 && percent >= config.passThreshold, criticalMisses, perDecision };
}
