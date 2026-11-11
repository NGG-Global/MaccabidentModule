import { z } from 'zod';
import {
  CourseConfigSchema,
  MediaAssetSchema,
  ROLES,
  RolesFileSchema,
  ScenarioSchema,
  ScreenSchema,
  ValuesFileSchema,
  type Content,
  type MediaAsset,
  type Scenario,
  type Screen,
} from './schema';

export interface RawContent {
  course: unknown;
  /** file name → parsed JSON */
  screens: Record<string, unknown>;
  scenarios: Record<string, unknown>;
  media: unknown;
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
  const mediaList = parse(z.array(MediaAssetSchema), raw.media, 'media-manifest.json', problems) ?? [];

  const media: Record<string, MediaAsset> = {};
  for (const asset of mediaList) {
    if (media[asset.id]) problems.push(`media-manifest.json: duplicate id ${asset.id}`);
    media[asset.id] = asset;
  }

  const screens: Record<string, Screen> = {};
  for (const [file, data] of Object.entries(raw.screens)) {
    const screen = parse(ScreenSchema, data, file, problems);
    if (!screen) continue;
    if (screens[screen.screenId]) problems.push(`${file}: duplicate screenId ${screen.screenId}`);
    screens[screen.screenId] = screen;
  }

  const scenarios: Record<string, Scenario> = {};
  for (const [file, data] of Object.entries(raw.scenarios)) {
    const scenario = parse(ScenarioSchema, data, file, problems);
    if (!scenario) continue;
    if (scenarios[scenario.scenarioId]) problems.push(`${file}: duplicate scenarioId ${scenario.scenarioId}`);
    scenarios[scenario.scenarioId] = scenario;
  }

  const requireMedia = (id: string, kind: 'audio' | 'visual', where: string) => {
    const asset = media[id];
    if (!asset) return problems.push(`${where}: media id ${id} is not in media-manifest.json`);
    if (kind === 'audio' && asset.kind !== 'audio') problems.push(`${where}: ${id} must be an audio asset`);
    if (kind === 'visual' && (asset.kind === 'audio' || asset.kind === 'captions'))
      problems.push(`${where}: ${id} must be an image, video or animation`);
  };

  for (const asset of mediaList) {
    if (asset.captionsId && media[asset.captionsId]?.kind !== 'captions')
      problems.push(`media-manifest.json: ${asset.id} captionsId ${asset.captionsId} is not a captions asset`);
  }

  for (const screen of Object.values(screens)) {
    const where = `screen ${screen.screenId}`;
    screen.mediaIds.forEach((id) => requireMedia(id, 'visual', where));
    if (screen.narration) requireMedia(screen.narration.audioId, 'audio', where);
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
    const { start, summary, transitions } = course.flow;
    const known = (id: string, where: string) => {
      if (!screens[id]) problems.push(`course.json flow: ${where} refers to unknown screen ${id}`);
    };
    known(start, 'start');
    known(summary, 'summary');
    for (const [from, to] of Object.entries(transitions)) {
      known(from, 'transition source');
      (typeof to === 'string' ? [to] : Object.values(to)).forEach((id) => known(id, `transition from ${from}`));
    }
    // Every role must be able to walk from start to the summary without loops.
    for (const role of ROLES) {
      const seen = new Set<string>();
      let current: string | undefined = start;
      while (current && current !== summary && !seen.has(current)) {
        seen.add(current);
        const to: (typeof transitions)[string] | undefined = transitions[current];
        current = to === undefined ? undefined : typeof to === 'string' ? to : to[role];
      }
      if (current !== summary)
        problems.push(`course.json flow: role ${role} cannot reach the summary screen ${summary} from ${start}`);
    }
  }

  if (problems.length || !course || !values || !roles) throw new ContentValidationError(problems);
  return { course, screens, scenarios, media, values, roles };
}
