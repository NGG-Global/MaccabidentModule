import { describe, expect, it } from 'vitest';
import { content } from '../../src/content';
import { buildContent, ContentValidationError } from '../../src/content/loader';
import { ROLES, scenarioIdsFor } from '../../src/content/schema';
import { resolvePath } from '../../src/engine/flow';
import { branchingRaw, scenario } from './fixtures';

const problemsOf = (run: () => unknown): string[] => {
  try {
    run();
  } catch (error) {
    if (error instanceof ContentValidationError) return error.problems;
    throw error;
  }
  return [];
};

describe('shipped content', () => {
  it('passes validation and defines screens S00–S09', () => {
    expect(Object.keys(content.screens).sort()).toEqual(
      ['S00', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09'],
    );
  });

  it('gives every role a path from start to summary', () => {
    for (const role of ROLES) {
      const path = resolvePath(content.course, role);
      expect(path[0]).toBe(content.course.flow.start);
      expect(path.at(-1)).toBe(content.course.flow.summary);
    }
  });

  it('lists every asset as missing until real media is produced', () => {
    expect(Object.values(content.media).every((m) => m.status === 'missing')).toBe(true);
  });

  it('keeps unapproved material flagged as DRAFT', () => {
    expect(Object.values(content.scenarios).every((s) => s.approvalStatus === 'DRAFT')).toBe(true);
    expect(content.values.approvalStatus).toBe('DRAFT');
  });
});

describe('content validation', () => {
  it('accepts the fixture course', () => {
    expect(() => buildContent(branchingRaw())).not.toThrow();
  });

  it('rejects a scenario with two preferred options', () => {
    const raw = branchingRaw();
    const bad = scenario('SC-COM-01');
    bad.options[0]!.rating = 'preferred';
    raw.scenarios['SC-COM-01.json'] = bad;
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('exactly one option must be rated "preferred"');
  });

  it('rejects a scenario without exactly three options', () => {
    const raw = branchingRaw();
    const bad = scenario('SC-COM-01');
    bad.options.pop();
    raw.scenarios['SC-COM-01.json'] = bad;
    expect(problemsOf(() => buildContent(raw)).some((p) => p.startsWith('SC-COM-01.json at options'))).toBe(true);
  });

  it('rejects references to media that is not in the manifest', () => {
    const raw = branchingRaw();
    (raw.screens['S02.json'] as { mediaIds: string[] }).mediaIds = ['IMG-NOPE-01'];
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('IMG-NOPE-01 is not in media-manifest.json');
  });

  it('rejects an unknown scenario reference and unknown fields', () => {
    const raw = branchingRaw();
    Object.assign(raw.screens['S05.json'] as object, { scenarioIds: ['SC-COM-99'], patientName: 'x' });
    const problems = problemsOf(() => buildContent(raw)).join('\n');
    expect(problems).toContain('S05.json');
    expect(problems).toContain('patientName');
  });

  it('rejects a flow in which a role cannot reach the summary', () => {
    const raw = branchingRaw();
    const course = raw.course as { flow: { transitions: Record<string, unknown> } };
    delete course.flow.transitions.S03;
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('role assistant cannot reach the summary');
  });

  it('rejects a ready asset without a source file', () => {
    const raw = branchingRaw();
    raw.media = [{ id: 'AUDIO-S00', kind: 'audio', status: 'ready', alt: 'a' }];
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('a "ready" asset needs a src');
  });
});

describe('scenarioIdsFor', () => {
  const { screens } = buildContent(branchingRaw());
  it('returns shared scenarios first, then the role scenarios', () => {
    expect(scenarioIdsFor(screens.S05!, 'assistant')).toEqual(['SC-COM-01', 'SC-AST-01']);
    expect(scenarioIdsFor(screens.S05!, null)).toEqual(['SC-COM-01']);
    expect(scenarioIdsFor(screens.S02!, 'assistant')).toEqual([]);
  });
});
