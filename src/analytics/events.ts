import { z } from 'zod';
import { InteractionTypeSchema, MediaKindSchema, RoleSchema } from '../content/schema';

/**
 * Vendor-neutral event schema (05-analytics). Payloads are strict objects so a
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

const payloads = {
  course_started: z.strictObject({}),
  role_selected: z.strictObject({ role: RoleSchema }),
  screen_viewed: z.strictObject({ interactionType: InteractionTypeSchema }),
  media_started: z.strictObject({ mediaId: z.string(), kind: MediaKindSchema }),
  media_completed: z.strictObject({ mediaId: z.string(), kind: MediaKindSchema }),
  scenario_answered: z.strictObject({
    answerId: z.string(),
    isPreferred: z.boolean(),
    responseTimeMs: z.number().nonnegative(),
    attemptNumber: z.number().int().positive(),
    skill: z.string(),
    mode: z.enum(['practice', 'assessment']),
  }),
  feedback_viewed: z.strictObject({ answerId: z.string() }),
  assessment_started: z.strictObject({ attemptNumber: z.number().int().positive() }),
  assessment_completed: z.strictObject({
    score: z.number(),
    passed: z.boolean(),
    activeTimeMs: z.number().nonnegative(),
    attemptNumber: z.number().int().positive(),
  }),
  course_completed: z.strictObject({ rule: z.string() }),
  course_resumed: z.strictObject({ resumedScreenId: z.string() }),
  client_error: z.strictObject({ kind: z.enum(['error', 'unhandledrejection', 'render']), message: z.string().max(200) }),
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
