import { z } from 'zod';
import { MediaIdSchema, TimedTextSchema, type CompositionId } from '../content/schema';

/**
 * Props for each Remotion composition. Text and timings come from content
 * (src/content/screens), measured against the narration they accompany, so
 * wording and timing can be edited without touching the compositions.
 */

const T = TimedTextSchema;

export const OpeningProps = z.strictObject({
  photos: z.array(MediaIdSchema).min(1),
  lines: z.array(T).min(1),
  title: T,
  after: z.array(T),
  moments: z.array(z.strictObject({ at: z.number().nonnegative(), text: z.string().min(1), photoId: MediaIdSchema })).length(4),
  outro: z.array(T).min(1),
});

export const ChapterProps = z.strictObject({ number: z.string().min(1), title: z.string().min(1), subtitle: z.string().optional() });

export const MeetYossiProps = z.strictObject({ photoId: MediaIdSchema, name: z.string().min(1), lines: z.array(T).min(1) });

export const CompareFeedbackProps = z.strictObject({
  same: z.array(T).length(3),
  different: T,
  practices: z.array(T).min(1),
  result: T,
  closing: T,
});

export const ValuesIntroProps = z.strictObject({ title: T, lead: T, values: z.array(T).length(3), outro: T });

const ValueBase = {
  number: z.string().min(1),
  name: z.string().min(1),
  photoId: MediaIdSchema,
  lead: T,
  closing: T,
};
export const ValueSeeingProps = z.strictObject({ ...ValueBase, actions: z.array(T).min(1), examples: z.array(T).min(1) });
export const ValueAdaptingProps = z.strictObject({ ...ValueBase, needs: z.array(T).length(3), actions: z.array(T).min(1), boundary: T });
export const ValueAccompanyingProps = z.strictObject({ ...ValueBase, steps: z.array(T).min(2) });

export const JourneyProps = z.strictObject({
  stages: z.array(z.strictObject({ id: z.string(), number: z.number(), title: z.string() })).length(5),
  active: z.string().nullable().default(null),
  visited: z.array(z.string()).default([]),
});

export const ScenarioIntroProps = z.strictObject({
  caseLabel: z.string().min(1),
  place: z.string().min(1),
  /** Without a photograph the case is set in type alone. */
  photoId: MediaIdSchema.optional(),
  lines: z.array(T).min(1),
});

export const ScenarioFeedbackProps = z.strictObject({
  verdict: z.enum(['preferred', 'partial', 'undesirable']),
  headline: T,
  points: z.array(T).min(1).max(4),
  /** Value names, revealed when the narration names them. */
  values: z.strictObject({ at: z.number().nonnegative(), names: z.array(z.string().min(1)).min(1) }).optional(),
});

export const MeasurementProps = z.strictObject({
  sections: z
    .array(z.strictObject({ at: z.number().nonnegative(), kind: z.enum(['survey', 'shopper', 'observation', 'trafficLight']), title: z.string(), lines: z.array(z.string()).min(1) }))
    .length(4),
  loop: z.strictObject({ at: z.number().nonnegative(), title: z.string(), line: z.string() }),
});

export const AssessmentResultProps = z.strictObject({
  percent: z.number().min(0).max(100),
  threshold: z.number().min(0).max(100),
  passed: z.boolean(),
  correct: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  passedText: z.string(),
  failedText: z.string(),
});

export const ClosingProps = z.strictObject({
  photos: z.array(MediaIdSchema).min(1),
  opener: T,
  values: z.array(T).length(3),
  title: T,
  thanks: T,
});

export const compositionPropSchemas = {
  opening: OpeningProps,
  chapter: ChapterProps,
  meetYossi: MeetYossiProps,
  compareFeedback: CompareFeedbackProps,
  valuesIntro: ValuesIntroProps,
  valueSeeing: ValueSeeingProps,
  valueAdapting: ValueAdaptingProps,
  valueAccompanying: ValueAccompanyingProps,
  journey: JourneyProps,
  scenarioIntro: ScenarioIntroProps,
  scenarioFeedback: ScenarioFeedbackProps,
  measurement: MeasurementProps,
  assessmentResult: AssessmentResultProps,
  closing: ClosingProps,
} satisfies Record<CompositionId, z.ZodType>;

export type OpeningPropsT = z.infer<typeof OpeningProps>;
export type ChapterPropsT = z.infer<typeof ChapterProps>;
export type MeetYossiPropsT = z.infer<typeof MeetYossiProps>;
export type CompareFeedbackPropsT = z.infer<typeof CompareFeedbackProps>;
export type ValuesIntroPropsT = z.infer<typeof ValuesIntroProps>;
export type ValueSeeingPropsT = z.infer<typeof ValueSeeingProps>;
export type ValueAdaptingPropsT = z.infer<typeof ValueAdaptingProps>;
export type ValueAccompanyingPropsT = z.infer<typeof ValueAccompanyingProps>;
export type JourneyPropsT = z.infer<typeof JourneyProps>;
export type ScenarioIntroPropsT = z.infer<typeof ScenarioIntroProps>;
export type ScenarioFeedbackPropsT = z.infer<typeof ScenarioFeedbackProps>;
export type MeasurementPropsT = z.infer<typeof MeasurementProps>;
export type AssessmentResultPropsT = z.infer<typeof AssessmentResultProps>;
export type ClosingPropsT = z.infer<typeof ClosingProps>;

/** Props every composition receives in addition to its own. */
export interface CommonProps {
  /** Resolved media URLs by id, so compositions stay free of manifest logic. */
  mediaUrls: Record<string, string>;
  reducedMotion: boolean;
}

/** Media ids referenced by a composition's props (photos), for manifest validation. */
export function mediaIdsInProps(props: unknown): string[] {
  const found: string[] = [];
  const walk = (v: unknown, key?: string) => {
    if (typeof v === 'string' && key && /(photoId|photos)$/.test(key)) found.push(v);
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k));
  };
  walk(props);
  return found;
}
