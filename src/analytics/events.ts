import { z } from 'zod';
import { InteractionTypeSchema, RoleSchema } from '../content/schema';

/**
 * Vendor-neutral event schema, envelope as in 05-analytics. Payloads are strict objects so a
 * stray field, such as free text or a personal identifier, fails validation
 * instead of leaving the application.
 */

export const SCHEMA_VERSION = '1';

const envelope = {
  eventId: z.string().min(1),
  timestamp: z.iso.datetime(),
  sessionId: z.string().min(1),
  anonymousLearnerId: z.string().min(1),
  courseId: z.string().min(1),
  courseVersion: z.string().min(1),
  /** null until the learner chooses a track. */
  role: RoleSchema.nullable(),
  screenId: z.string().min(1),
  scenarioId: z.string().optional(),
  attemptId: z.string().optional(),
  schemaVersion: z.literal(SCHEMA_VERSION),
};

const mediaPayload = z.strictObject({ sequence: z.string().max(40) });

/** Local-only event set for the S00–S04 prototype. Nothing is transmitted to a third party. */
const payloads = {
  course_started: z.strictObject({}),
  screen_viewed: z.strictObject({ interactionType: InteractionTypeSchema, resumed: z.boolean() }),
  narration_started: mediaPayload.extend({ audioId: z.string() }),
  narration_completed: mediaPayload.extend({ audioId: z.string() }),
  video_started: mediaPayload.extend({ mediaId: z.string() }),
  video_completed: mediaPayload.extend({ mediaId: z.string() }),
  question_answered: z.strictObject({
    questionId: z.string(),
    answerId: z.string(),
    isCorrect: z.boolean(),
    attemptNumber: z.number().int().positive(),
    responseTimeMs: z.number().nonnegative(),
  }),
  journey_stage_viewed: z.strictObject({ stageId: z.string(), visitedCount: z.number().int().positive() }),
  role_selected: z.strictObject({ role: RoleSchema }),
  prototype_completed: z.strictObject({ rule: z.string() }),
} as const;

export type EventName = keyof typeof payloads;
export type EventPayload<N extends EventName> = z.infer<(typeof payloads)[N]>;
export const EVENT_NAMES = Object.keys(payloads) as EventName[];

const eventSchemas = Object.fromEntries(
  EVENT_NAMES.map((name) => [name, z.strictObject({ eventName: z.literal(name), ...envelope, payload: payloads[name] })]),
) as unknown as Record<EventName, z.ZodType>;

export type AnalyticsEvent = {
  [N in EventName]: {
    eventName: N;
    eventId: string;
    timestamp: string;
    sessionId: string;
    anonymousLearnerId: string;
    courseId: string;
    courseVersion: string;
    role: z.infer<typeof RoleSchema> | null;
    screenId: string;
    scenarioId?: string;
    attemptId?: string;
    schemaVersion: typeof SCHEMA_VERSION;
    payload: EventPayload<N>;
  };
}[EventName];

export function validateEvent(event: unknown): { ok: true; event: AnalyticsEvent } | { ok: false; problems: string[] } {
  const name = (event as { eventName?: unknown } | null)?.eventName;
  const schema = typeof name === 'string' ? eventSchemas[name as EventName] : undefined;
  if (!schema) return { ok: false, problems: [`unknown eventName: ${String(name)}`] };
  const result = schema.safeParse(event);
  if (result.success) return { ok: true, event: result.data as AnalyticsEvent };
  return { ok: false, problems: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
}
