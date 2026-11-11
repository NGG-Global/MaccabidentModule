import { z } from 'zod';

/**
 * Content model. Every content file under src/content is validated against
 * these schemas at load time, so content can be edited without touching
 * components and mistakes fail fast with a readable message.
 */

// A separate 'hygienist' track is an open decision (07-open-decisions). Adding it
// means extending this list plus the role-keyed entries in the content files.
export const ROLES = ['reception', 'assistant', 'clinician'] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const ApprovalStatusSchema = z.enum(['DRAFT', 'APPROVED']);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const InteractionTypeSchema = z.enum([
  'intro',
  'roleSelect',
  'compare',
  'valuesMatch',
  'journey',
  'scenario',
  'measurement',
  'assessment',
  'summary',
]);
export type InteractionType = z.infer<typeof InteractionTypeSchema>;

const ScreenIdSchema = z.string().regex(/^S\d{2}$/, 'screenId must look like S00');
const ScenarioIdSchema = z.string().regex(/^SC-[A-Z]{3}-\d{2}$/, 'scenarioId must look like SC-COM-01');
const MediaIdSchema = z.string().regex(/^[A-Z]+(-[A-Z0-9]+)+$/, 'media id must look like IMG-WAIT-01');
const SourcePagesSchema = z.array(z.number().int().positive());

export const NarrationSchema = z.strictObject({
  audioId: MediaIdSchema,
  transcript: z.string().min(1),
});
export type Narration = z.infer<typeof NarrationSchema>;

const ScenarioRefsSchema = z.union([
  z.array(ScenarioIdSchema),
  z.strictObject({
    common: z.array(ScenarioIdSchema).optional(),
    reception: z.array(ScenarioIdSchema).optional(),
    assistant: z.array(ScenarioIdSchema).optional(),
    clinician: z.array(ScenarioIdSchema).optional(),
  }),
]);

export const ScreenSchema = z.strictObject({
  screenId: ScreenIdSchema,
  title: z.string().min(1),
  targetMinutes: z.number().positive(),
  learningObjective: z.string().optional(),
  onScreenText: z.array(z.string()),
  narration: NarrationSchema.optional(),
  visualDescription: z.string().optional(),
  mediaIds: z.array(MediaIdSchema),
  interactionType: InteractionTypeSchema,
  scenarioIds: ScenarioRefsSchema.optional(),
  /** 'view': may advance freely. 'interaction': the activity must be done first. */
  completion: z.enum(['view', 'interaction']),
  sourcePages: SourcePagesSchema,
  approvalStatus: ApprovalStatusSchema,
});
export type Screen = z.infer<typeof ScreenSchema>;

export const OptionRatingSchema = z.enum(['preferred', 'partial', 'undesirable']);
export type OptionRating = z.infer<typeof OptionRatingSchema>;

export const ScenarioOptionSchema = z.strictObject({
  id: z.enum(['A', 'B', 'C']),
  text: z.string().min(1),
  rating: OptionRatingSchema,
  feedback: z.string().min(1),
  /** Longer spoken version of the feedback; falls back to `feedback`. */
  feedbackNarration: z.string().optional(),
  feedbackAudioId: MediaIdSchema.optional(),
});
export type ScenarioOption = z.infer<typeof ScenarioOptionSchema>;

export const ScenarioSchema = z
  .strictObject({
    scenarioId: ScenarioIdSchema,
    title: z.string().min(1),
    track: z.union([z.literal('common'), RoleSchema]),
    touchpoint: z.string().min(1),
    values: z.array(z.string()),
    skill: z.string().min(1),
    scene: z.string().min(1),
    question: z.string().min(1),
    narration: NarrationSchema.optional(),
    options: z.array(ScenarioOptionSchema).length(3),
    /** Flags a miss for mandatory review (e.g. privacy). The pass rule itself needs SME approval. */
    critical: z.boolean().optional(),
    sourcePages: SourcePagesSchema,
    approvalStatus: ApprovalStatusSchema,
    notes: z.string().optional(),
  })
  .refine((s) => new Set(s.options.map((o) => o.id)).size === 3, {
    message: 'option ids must be unique (A, B, C)',
    path: ['options'],
  })
  .refine((s) => s.options.filter((o) => o.rating === 'preferred').length === 1, {
    message: 'exactly one option must be rated "preferred"',
    path: ['options'],
  });
export type Scenario = z.infer<typeof ScenarioSchema>;

export const MediaKindSchema = z.enum(['image', 'video', 'animation', 'audio', 'captions']);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const MediaAssetSchema = z
  .strictObject({
    id: MediaIdSchema,
    kind: MediaKindSchema,
    status: z.enum(['missing', 'ready']),
    /** Path relative to public/media/. Required once status is "ready". */
    src: z.string().optional(),
    /** Text alternative / description, shown in the placeholder while the asset is missing. */
    alt: z.string().min(1),
    captionsId: MediaIdSchema.optional(),
  })
  .refine((m) => m.status === 'missing' || Boolean(m.src), {
    message: 'a "ready" asset needs a src',
    path: ['src'],
  });
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

const TransitionSchema = z.union([
  ScreenIdSchema,
  z.strictObject({ reception: ScreenIdSchema, assistant: ScreenIdSchema, clinician: ScreenIdSchema }),
]);

export const CourseConfigSchema = z.strictObject({
  courseId: z.literal('good-hands'),
  courseVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: z.string().min(1),
  assessment: z.strictObject({
    passThreshold: z.number().min(0).max(100),
    pointsPerDecision: z.number().positive(),
    /** Share of pointsPerDecision granted for a "partial" option (0–1). */
    partialCreditRatio: z.number().min(0).max(1),
    maxAttempts: z.number().int().positive().nullable(),
    note: z.string(),
  }),
  /** Business rule behind the course_completed event. */
  completionRule: z.literal('reach-summary'),
  /** Explicit navigation graph: each screen names its successor, optionally per role. */
  flow: z.strictObject({
    start: ScreenIdSchema,
    summary: ScreenIdSchema,
    transitions: z.record(ScreenIdSchema, TransitionSchema),
  }),
});
export type CourseConfig = z.infer<typeof CourseConfigSchema>;

export const ServiceValueSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  subValues: z.array(z.string().min(1)).length(3),
});
export const ValuesFileSchema = z.strictObject({
  sourcePages: SourcePagesSchema,
  approvalStatus: ApprovalStatusSchema,
  values: z.array(ServiceValueSchema).length(3),
});
export type ServiceValue = z.infer<typeof ServiceValueSchema>;
export type ValuesFile = z.infer<typeof ValuesFileSchema>;

export const RoleInfoSchema = z.strictObject({
  id: RoleSchema,
  label: z.string().min(1),
  description: z.string().min(1),
});
export const RolesFileSchema = z
  .array(RoleInfoSchema)
  .refine((r) => ROLES.every((id) => r.filter((x) => x.id === id).length === 1), {
    message: 'every role must appear exactly once',
  });
export type RoleInfo = z.infer<typeof RoleInfoSchema>;

export interface Content {
  course: CourseConfig;
  screens: Record<string, Screen>;
  scenarios: Record<string, Scenario>;
  media: Record<string, MediaAsset>;
  values: ValuesFile;
  roles: RoleInfo[];
}

/** Scenario ids a screen presents for a role: shared ones first, then role-specific. */
export function scenarioIdsFor(screen: Screen, role: Role | null): string[] {
  const refs = screen.scenarioIds;
  if (!refs) return [];
  if (Array.isArray(refs)) return refs;
  return [...(refs.common ?? []), ...(role ? (refs[role] ?? []) : [])];
}
