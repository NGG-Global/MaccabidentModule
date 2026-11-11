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
