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
  it('passes validation, keeps S00–S09 and runs S00–S04 in this build', () => {
    expect(Object.keys(content.screens).sort()).toEqual(['S00', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09']);
    for (const role of ROLES) expect(resolvePath(content.course, role)).toEqual(['S00', 'S01', 'S02', 'S03', 'S04']);
  });

  it('gives every narration and video used in S00–S04 a measured duration and captions', () => {
    for (const id of ['S00', 'S01', 'S02', 'S03']) {
      for (const beats of Object.values(content.screens[id]!.sequences))
        for (const beat of beats) {
          if (beat.kind === 'composition') continue;
          const asset = content.media[beat.kind === 'narration' ? beat.audioId : beat.mediaId]!;
          expect(asset.status, asset.id).toBe('ready');
          expect(asset.durationSec, asset.id).toBeGreaterThan(0);
          expect(content.captions[asset.captionsId!]?.cues.length, asset.id).toBeGreaterThan(0);
        }
    }
  });

  it('times every animated line within its narration', () => {
    for (const screen of Object.values(content.screens))
      for (const beats of Object.values(screen.sequences))
        for (const beat of beats) {
          if (beat.kind !== 'narration' || !beat.visual) continue;
          const duration = content.media[beat.audioId]!.durationSec!;
          const ats = JSON.stringify(beat.visual.props).match(/"at":([\d.]+)/g)?.map((m) => Number(m.slice(5))) ?? [];
          for (const at of ats) expect(at, `${screen.screenId} ${beat.audioId}`).toBeLessThan(duration);
        }
  });

  it('names S04 narration as missing rather than inventing it', () => {
    for (let i = 0; i <= 5; i++) expect(content.media[`AUDIO-S04-0${i}`]?.status).toBe('missing');
  });

  it('keeps unapproved material flagged as DRAFT', () => {
    expect(Object.values(content.screens).every((s) => s.approvalStatus === 'DRAFT')).toBe(true);
    expect(Object.values(content.questions).every((q) => q.approvalStatus === 'DRAFT')).toBe(true);
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

  it('rejects a question without exactly one correct option', () => {
    const raw = branchingRaw();
    (raw.questions['Q-S05-01.json'] as { options: { correct: boolean }[] }).options[1]!.correct = true;
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('exactly one option must be correct');
  });

  it('rejects ready narration without captions or transcript', () => {
    const raw = branchingRaw();
    raw.captions = {};
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('has neither captions nor a transcript');
  });

  it('rejects composition props that do not fit the composition', () => {
    const raw = branchingRaw();
    const s06 = raw.screens['S06.json'] as { sequences: { enter: { visual: { props: Record<string, unknown> } }[] } };
    s06.sequences.enter[0]!.visual.props = { number: '02' };
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('composition chapter props at title');
  });

  it('rejects references to unknown media, sequences and questions', () => {
    const raw = branchingRaw();
    (raw.screens['S02.json'] as { mediaIds: string[] }).mediaIds = ['IMG-NOPE-01'];
    (raw.questions['Q-S05-01.json'] as { feedbackSequence: string }).feedbackSequence = 'nope';
    const problems = problemsOf(() => buildContent(raw)).join('\n');
    expect(problems).toContain('IMG-NOPE-01 is not in media-manifest.json');
    expect(problems).toContain('unknown sequence "nope"');
  });

  it('rejects an interaction block that does not match the interaction type', () => {
    const raw = branchingRaw();
    delete (raw.screens['S07.json'] as { interaction?: unknown }).interaction;
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('needs an interaction of type journey');
  });

  it('rejects a flow in which a role cannot reach the end screen', () => {
    const raw = branchingRaw();
    delete (raw.course as { flow: { transitions: Record<string, unknown> } }).flow.transitions.S03;
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('role assistant cannot reach the end screen');
  });

  it('rejects ready audio or video without a measured duration', () => {
    const raw = branchingRaw();
    (raw.media as Record<string, unknown>[])[0]!.durationSec = undefined;
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('needs a measured durationSec');
  });
});

describe('scenarioIdsFor', () => {
  const { screens } = buildContent(branchingRaw());
  it('returns shared scenarios first, then the role scenarios', () => {
    expect(scenarioIdsFor(screens.S04!, 'clinician')).toEqual(['SC-COM-01', 'SC-CLN-01']);
    expect(scenarioIdsFor(screens.S04!, null)).toEqual(['SC-COM-01']);
  });
});
