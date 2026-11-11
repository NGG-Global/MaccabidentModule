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
const QuestionIdSchema = z.string().regex(/^Q-S\d{2}-\d{2}$/, 'questionId must look like Q-S02-01');
export const MediaIdSchema = z.string().regex(/^[A-Z]+(-[A-Z0-9]+)+$/, 'media id must look like IMG-WAIT-01');
const SourcePagesSchema = z.array(z.number().int().positive());

/** Remotion compositions available to content. Registered in src/remotion/registry.ts. */
export const COMPOSITION_IDS = [
  'opening',
  'chapter',
  'meetYossi',
  'compareFeedback',
  'valuesIntro',
  'valueSeeing',
  'valueAdapting',
  'valueAccompanying',
  'journey',
] as const;
export const CompositionIdSchema = z.enum(COMPOSITION_IDS);
export type CompositionId = z.infer<typeof CompositionIdSchema>;

/** Timed text for a composition, in seconds from the start of its narration. */
export const TimedTextSchema = z.strictObject({ at: z.number().nonnegative(), text: z.string().min(1) });
export type TimedText = z.infer<typeof TimedTextSchema>;

export const CompositionRefSchema = z.strictObject({
  id: CompositionIdSchema,
  /** Free-form, validated by the composition itself (see src/remotion/registry.ts). */
  props: z.record(z.string(), z.unknown()).default({}),
});
export type CompositionRef = z.infer<typeof CompositionRefSchema>;

/**
 * A beat is one unit of timed media. Beats in a sequence play one after
 * another and never overlap: narration, video dialogue and silent animation
 * each own the timeline while they run.
 */
export const BeatSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('narration'),
    audioId: MediaIdSchema,
    /** Composition driven frame-by-frame by the narration clock. */
    visual: CompositionRefSchema.optional(),
    /** Fallback transcript for narration without captions (e.g. not yet supplied). */
    transcript: z.string().optional(),
  }),
  z.strictObject({ kind: z.literal('video'), mediaId: MediaIdSchema }),
  z.strictObject({
    kind: z.literal('composition'),
    visual: CompositionRefSchema,
    durationSec: z.number().positive(),
  }),
]);
export type Beat = z.infer<typeof BeatSchema>;

export const SequencesSchema = z.record(z.string().min(1), z.array(BeatSchema).min(1));

const OptionIdSchema = z.enum(['A', 'B', 'C']);

export const QuestionSchema = z
  .strictObject({
    questionId: QuestionIdSchema,
    prompt: z.string().min(1),
    options: z
      .array(z.strictObject({ id: OptionIdSchema, text: z.string().min(1), correct: z.boolean(), feedback: z.string().min(1) }))
      .length(3),
    /** Sequence key on the owning screen played after any answer. */
    feedbackSequence: z.string().optional(),
    sourcePages: SourcePagesSchema,
    approvalStatus: ApprovalStatusSchema,
  })
  .refine((q) => q.options.filter((o) => o.correct).length === 1, {
    message: 'exactly one option must be correct',
    path: ['options'],
  });
export type Question = z.infer<typeof QuestionSchema>;

const JourneyStageSchema = z.strictObject({
  id: z.string().regex(/^[a-z-]+$/),
  number: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  points: z.array(z.string().min(1)).min(2).max(4),
  imageId: MediaIdSchema.optional(),
  sequence: z.string().min(1),
  sourcePages: SourcePagesSchema,
});
export type JourneyStage = z.infer<typeof JourneyStageSchema>;

/** Interaction details, discriminated by type. Its presence and type are checked against interactionType. */
export const InteractionSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('compare'), versions: z.array(z.strictObject({ label: z.string(), mediaId: MediaIdSchema })).length(2), questionId: QuestionIdSchema }),
  z.strictObject({
    type: z.literal('valuesMatch'),
    chapters: z.array(z.strictObject({ valueId: z.string(), beatIndex: z.number().int().nonnegative() })),
    prompt: z.string().min(1),
    items: z
      .array(z.strictObject({ id: z.string().regex(/^[a-z-]+$/), text: z.string().min(1), valueId: z.string(), feedback: z.string().min(1) }))
      .min(1),
  }),
  z.strictObject({
    type: z.literal('journey'),
    stages: z.array(JourneyStageSchema).length(5),
    completion: z.strictObject({ title: z.string(), next: z.string() }),
  }),
]);
export type Interaction = z.infer<typeof InteractionSchema>;

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
  /** Short label used in the chapter progress. */
  chapter: z.string().min(1),
  title: z.string().min(1),
  eyebrow: z.string().optional(),
  targetMinutes: z.number().positive(),
  learningObjective: z.string().optional(),
  onScreenText: z.array(z.string()),
  visualDescription: z.string().optional(),
  mediaIds: z.array(MediaIdSchema),
  /** Timed media. "enter" plays when the screen opens (after the learner's first gesture). */
  sequences: SequencesSchema.default({}),
  interactionType: InteractionTypeSchema,
  interaction: InteractionSchema.optional(),
  scenarioIds: ScenarioRefsSchema.optional(),
  /** 'view': may advance freely. 'interaction': the activity must be done first. */
  completion: z.enum(['view', 'interaction']),
  sourcePages: SourcePagesSchema,
  approvalStatus: ApprovalStatusSchema,
});
export type Screen = z.infer<typeof ScreenSchema>;

export const NarrationSchema = z.strictObject({
  audioId: MediaIdSchema,
  transcript: z.string().min(1),
});
export type Narration = z.infer<typeof NarrationSchema>;

export const OptionRatingSchema = z.enum(['preferred', 'partial', 'undesirable']);
export type OptionRating = z.infer<typeof OptionRatingSchema>;

export const ScenarioOptionSchema = z.strictObject({
  id: OptionIdSchema,
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
    /** missing: not supplied. blocked: supplied but not usable (see notes). ready: in public/media/. */
    status: z.enum(['missing', 'blocked', 'ready']),
    /** Path relative to public/media/. Required once status is "ready". */
    src: z.string().optional(),
    /** Text alternative / description, shown in the placeholder while the asset is not ready. */
    alt: z.string().min(1),
    /** Measured with ffprobe; drives composition length for narration. */
    durationSec: z.number().positive().optional(),
    posterId: MediaIdSchema.optional(),
    captionsId: MediaIdSchema.optional(),
    /** Original upload this asset was produced from. */
    source: z.string().optional(),
    verification: z.string().optional(),
    approvalStatus: ApprovalStatusSchema.default('DRAFT'),
    notes: z.string().optional(),
  })
  .refine((m) => m.status !== 'ready' || Boolean(m.src), { message: 'a "ready" asset needs a src', path: ['src'] })
  .refine((m) => m.status !== 'ready' || !['audio', 'video'].includes(m.kind) || m.durationSec, {
    message: 'a "ready" audio or video asset needs a measured durationSec',
    path: ['durationSec'],
  });
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const CueSchema = z.strictObject({ start: z.number().nonnegative(), end: z.number().positive(), text: z.string().min(1) });
export type Cue = z.infer<typeof CueSchema>;
export const CaptionsFileSchema = z.record(
  MediaIdSchema,
  z.strictObject({
    /** machine-transcribed: generated by local speech-to-text and corrected by hand; pending script check. */
    status: z.enum(['machine-transcribed', 'approved']),
    note: z.string().optional(),
    cues: z.array(CueSchema).min(1),
  }),
);
export type CaptionsFile = z.infer<typeof CaptionsFileSchema>;

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
  /** Business rule behind the prototype_completed event. */
  completionRule: z.literal('end-screen-complete'),
  /** Explicit navigation graph: each screen names its successor, optionally per role. */
  flow: z.strictObject({
    start: ScreenIdSchema,
    /** Last screen of the current build; completing its interaction completes the prototype. */
    end: ScreenIdSchema,
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
  questions: Record<string, Question>;
  media: Record<string, MediaAsset>;
  captions: CaptionsFile;
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
