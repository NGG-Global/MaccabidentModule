import { z } from 'zod';
import { compositionPropSchemas, mediaIdsInProps } from '../remotion/props';
import {
  CaptionsFileSchema,
  CourseConfigSchema,
  MediaAssetSchema,
  QuestionSchema,
  ROLES,
  RolesFileSchema,
  ScenarioSchema,
  ScreenSchema,
  ValuesFileSchema,
  type Beat,
  type Content,
  type MediaAsset,
  type Question,
  type Scenario,
  type Screen,
} from './schema';

export interface RawContent {
  course: unknown;
  /** file name → parsed JSON */
  screens: Record<string, unknown>;
  scenarios: Record<string, unknown>;
  questions: Record<string, unknown>;
  media: unknown;
  captions: unknown;
  values: unknown;
  roles: unknown;
}

export class ContentValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Content validation failed:\n- ${problems.join('\n- ')}`);
    this.name = 'ContentValidationError';
  }
}

function parse<T>(schema: z.ZodType<T>, data: unknown, source: string, problems: string[]): T | null {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  for (const issue of result.error.issues) {
    const path = issue.path.length ? ` at ${issue.path.join('.')}` : '';
    problems.push(`${source}${path}: ${issue.message}`);
  }
  return null;
}

function collect<T>(
  files: Record<string, unknown>,
  schema: z.ZodType<T>,
  idOf: (item: T) => string,
  label: string,
  problems: string[],
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [file, data] of Object.entries(files)) {
    const item = parse(schema, data, file, problems);
    if (!item) continue;
    const id = idOf(item);
    if (out[id]) problems.push(`${file}: duplicate ${label} ${id}`);
    out[id] = item;
  }
  return out;
}

/**
 * Validates every content file and the references between them. Throws a single
 * ContentValidationError listing all problems, so a content editor sees
 * everything that needs fixing in one pass.
 */
export function buildContent(raw: RawContent): Content {
  const problems: string[] = [];

  const course = parse(CourseConfigSchema, raw.course, 'course.json', problems);
  const values = parse(ValuesFileSchema, raw.values, 'values.json', problems);
  const roles = parse(RolesFileSchema, raw.roles, 'roles.json', problems);
  const captions = parse(CaptionsFileSchema, raw.captions, 'captions.json', problems) ?? {};
  const mediaList = parse(z.array(MediaAssetSchema), raw.media, 'media-manifest.json', problems) ?? [];

  const media: Record<string, MediaAsset> = {};
  for (const asset of mediaList) {
    if (media[asset.id]) problems.push(`media-manifest.json: duplicate id ${asset.id}`);
    media[asset.id] = asset;
  }

  const screens = collect<Screen>(raw.screens, ScreenSchema, (s) => s.screenId, 'screenId', problems);
  const scenarios = collect<Scenario>(raw.scenarios, ScenarioSchema, (s) => s.scenarioId, 'scenarioId', problems);
  const questions = collect<Question>(raw.questions, QuestionSchema, (q) => q.questionId, 'questionId', problems);

  type Kind = 'audio' | 'video' | 'image' | 'visual';
  const requireMedia = (id: string, kind: Kind, where: string) => {
    const asset = media[id];
    if (!asset) return problems.push(`${where}: media id ${id} is not in media-manifest.json`);
    const ok =
      kind === 'visual' ? !['audio', 'captions'].includes(asset.kind) : asset.kind === kind;
    if (!ok) problems.push(`${where}: ${id} must be a ${kind} asset, not ${asset.kind}`);
  };

  for (const asset of mediaList) {
    const where = `media-manifest.json ${asset.id}`;
    if (asset.posterId) requireMedia(asset.posterId, 'image', where);
    if (asset.captionsId && asset.status === 'ready' && !captions[asset.captionsId])
      problems.push(`${where}: captions ${asset.captionsId} are not in captions.json`);
  }
  for (const id of Object.keys(captions)) if (!media[id]) problems.push(`captions.json: ${id} is not in media-manifest.json`);

  const checkBeat = (beat: Beat, where: string) => {
    if (beat.kind === 'narration') {
      requireMedia(beat.audioId, 'audio', where);
      const asset = media[beat.audioId];
      // The course must be completable without sound: ready narration needs captions or a transcript.
      if (asset?.status === 'ready' && !beat.transcript && !(asset.captionsId && captions[asset.captionsId]))
        problems.push(`${where}: narration ${beat.audioId} has neither captions nor a transcript`);
    }
    if (beat.kind === 'video') requireMedia(beat.mediaId, 'video', where);
    if (beat.kind !== 'video' && beat.visual) {
      const result = compositionPropSchemas[beat.visual.id].safeParse(beat.visual.props);
      if (!result.success)
        for (const issue of result.error.issues)
          problems.push(`${where}: composition ${beat.visual.id} props${issue.path.length ? ` at ${issue.path.join('.')}` : ''}: ${issue.message}`);
      for (const id of mediaIdsInProps(beat.visual.props)) requireMedia(id, 'image', `${where} (${beat.visual.id})`);
    }
  };

  const valueIds = new Set(values?.values.map((v) => v.id) ?? []);

  for (const screen of Object.values(screens)) {
    const where = `screen ${screen.screenId}`;
    screen.mediaIds.forEach((id) => requireMedia(id, 'visual', where));
    for (const [key, beats] of Object.entries(screen.sequences))
      beats.forEach((beat, i) => checkBeat(beat, `${where} sequence "${key}" beat ${i}`));

    const needsSequence = (key: string | undefined, label: string) => {
      if (key && !screen.sequences[key]) problems.push(`${where}: ${label} refers to unknown sequence "${key}"`);
    };

    const interaction = screen.interaction;
    const expected = { compare: 'compare', valuesMatch: 'valuesMatch', journey: 'journey' } as const;
    const expectedType = expected[screen.interactionType as keyof typeof expected];
    if (expectedType && interaction?.type !== expectedType)
      problems.push(`${where}: interactionType ${screen.interactionType} needs an interaction of type ${expectedType}`);
    if (!expectedType && interaction) problems.push(`${where}: interactionType ${screen.interactionType} takes no interaction block`);

    if (interaction?.type === 'compare') {
      interaction.versions.forEach((v) => requireMedia(v.mediaId, 'video', where));
      const question = questions[interaction.questionId];
      if (!question) problems.push(`${where}: unknown question ${interaction.questionId}`);
      needsSequence(question?.feedbackSequence, `question ${interaction.questionId} feedbackSequence`);
    }
    if (interaction?.type === 'valuesMatch') {
      const enter = screen.sequences.enter ?? [];
      for (const chapter of interaction.chapters) {
        if (!valueIds.has(chapter.valueId)) problems.push(`${where}: unknown value ${chapter.valueId}`);
        if (chapter.beatIndex >= enter.length) problems.push(`${where}: chapter ${chapter.valueId} beatIndex is outside the enter sequence`);
      }
      for (const item of interaction.items)
        if (!valueIds.has(item.valueId)) problems.push(`${where}: item ${item.id} refers to unknown value ${item.valueId}`);
      needsSequence(interaction.feedbackSequence, 'feedbackSequence');
    }
    if (interaction?.type === 'journey') {
      const ids = interaction.stages.map((s) => s.id);
      if (new Set(ids).size !== ids.length) problems.push(`${where}: journey stage ids must be unique`);
      interaction.stages.forEach((s, i) => {
        if (s.number !== i + 1) problems.push(`${where}: stage ${s.id} must be number ${i + 1}`);
        if (s.imageId) requireMedia(s.imageId, 'image', where);
        needsSequence(s.sequence, `stage ${s.id}`);
        // Timed points must fall within the station narration.
        const narration = screen.sequences[s.sequence]?.find((b) => b.kind === 'narration');
        const duration = narration?.kind === 'narration' ? media[narration.audioId]?.durationSec : undefined;
        for (const point of s.points)
          if (point.at !== undefined && duration !== undefined && point.at >= duration)
            problems.push(`${where}: stage ${s.id} point "${point.text}" is timed after its narration ends`);
      });
      needsSequence(interaction.completion.sequence, 'completion sequence');
    }

    const refs = screen.scenarioIds;
    const ids = !refs ? [] : Array.isArray(refs) ? refs : Object.values(refs).flat();
    for (const id of ids) if (!scenarios[id]) problems.push(`${where}: unknown scenario ${id}`);
    if (refs && !Array.isArray(refs)) {
      for (const role of ROLES)
        for (const id of refs[role] ?? []) {
          const track = scenarios[id]?.track;
          if (track && track !== role && track !== 'common')
            problems.push(`${where}: scenario ${id} (track ${track}) is listed under role ${role}`);
        }
    }
  }

  for (const scenario of Object.values(scenarios)) {
    const where = `scenario ${scenario.scenarioId}`;
    if (scenario.narration) requireMedia(scenario.narration.audioId, 'audio', where);
    for (const option of scenario.options)
      if (option.feedbackAudioId) requireMedia(option.feedbackAudioId, 'audio', where);
  }

  if (course) {
    const { start, end, transitions } = course.flow;
    const known = (id: string, where: string) => {
      if (!screens[id]) problems.push(`course.json flow: ${where} refers to unknown screen ${id}`);
    };
    known(start, 'start');
    known(end, 'end');
    for (const [from, to] of Object.entries(transitions)) {
      known(from, 'transition source');
      (typeof to === 'string' ? [to] : Object.values(to)).forEach((id) => known(id, `transition from ${from}`));
    }
    if (transitions[end] !== undefined) problems.push(`course.json flow: the end screen ${end} must not have a transition`);
    // Every role must be able to walk from start to the end screen without loops.
    for (const role of ROLES) {
      const seen = new Set<string>();
      let current: string | undefined = start;
      while (current && current !== end && !seen.has(current)) {
        seen.add(current);
        const to: (typeof transitions)[string] | undefined = transitions[current];
        current = to === undefined ? undefined : typeof to === 'string' ? to : to[role];
      }
      if (current !== end) problems.push(`course.json flow: role ${role} cannot reach the end screen ${end} from ${start}`);
    }
  }

  if (problems.length || !course || !values || !roles) throw new ContentValidationError(problems);
  return { course, screens, scenarios, questions, media, captions, values, roles };
}
