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
  it('passes validation and runs S00–S09 for every role', () => {
    expect(Object.keys(content.screens).sort()).toEqual(['S00', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09']);
    for (const role of ROLES) expect(resolvePath(content.course, role)).toEqual(['S00', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09']);
  });

  it('gives every narration and video used in S00–S06 a measured duration and captions', () => {
    const beats = [
      ...['S00', 'S01', 'S02', 'S03', 'S04'].flatMap((id) => Object.values(content.screens[id]!.sequences).flat()),
      ...Object.values(content.scenarios).flatMap((s) => [...s.situation, ...(s.ask ?? []), ...s.options.flatMap((o) => o.feedbackBeats)]),
    ];
    for (const beat of beats) {
      if (beat.kind === 'composition') continue;
      const asset = content.media[beat.kind === 'narration' ? beat.audioId : beat.mediaId]!;
      expect(asset.status, asset.id).toBe('ready');
      expect(asset.durationSec, asset.id).toBeGreaterThan(0);
      expect(content.captions[asset.captionsId!]?.cues.length, asset.id).toBeGreaterThan(0);
    }
  });

  it('gives each scenario answer its own feedback recording, matching the answer id', () => {
    for (const s of Object.values(content.scenarios)) {
      const prefix = s.track === 'common' ? 'AUDIO-S05' : `AUDIO-S06-${{ reception: 'REC', assistant: 'AST', clinician: 'CLN' }[s.track]}${s.scenarioId.at(-1)}`;
      for (const o of s.options) {
        const first = o.feedbackBeats[0]!;
        expect(first.kind === 'narration' && first.audioId, `${s.scenarioId} ${o.id}`).toBe(`${prefix}-FB-${o.id}`);
      }
      // In every scenario the preferred response is the one whose feedback recording says so (B).
      expect(s.options.find((o) => o.rating === 'preferred')?.id, s.scenarioId).toBe('B');
    }
  });

  it('shows each role only its own S06 scenarios, two per role', () => {
    for (const role of ROLES) {
      const ids = scenarioIdsFor(content.screens.S06!, role);
      expect(ids).toHaveLength(2);
      expect(ids.every((id) => content.scenarios[id]!.track === role)).toBe(true);
    }
  });

  it('names S07–S09 narration as not supplied rather than inventing it', () => {
    for (const id of ['AUDIO-S07', 'AUDIO-S08', 'AUDIO-S09']) expect(content.media[id]?.status).toBe('missing');
  });

  it('marks every assessment question as proposed and checks enough questions per role', () => {
    const s08 = content.screens.S08!.interaction;
    expect(s08?.type).toBe('assessment');
    if (s08?.type !== 'assessment') return;
    for (const id of s08.questionIds) expect(content.questions[id]?.proposed, id).toBe(true);
    expect(s08.commonCount + s08.roleCount).toBe(5);
    expect(content.course.assessment.pointsPerDecision * 5).toBe(100);
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

  it('uses supplied narration for every S04 station, the chapter closing and the S03 exercise feedback', () => {
    for (let i = 0; i <= 6; i++) expect(content.media[`AUDIO-S04-0${i}`]?.status).toBe('ready');
    expect(content.media['AUDIO-S03-FB-01']?.status).toBe('ready');
    const journey = content.screens.S04!.interaction;
    expect(journey?.type === 'journey' && journey.completion.sequence).toBe('complete');
  });

  it('flags the station 3 recording that names the wrong station', () => {
    expect(content.media['AUDIO-S04-03']?.notes).toContain('השישית');
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

  it('rejects a scenario in which two answers share one feedback recording', () => {
    const raw = branchingRaw();
    const bad = scenario('SC-COM-01');
    bad.options[2]!.feedbackBeats = bad.options[0]!.feedbackBeats;
    raw.scenarios['SC-COM-01.json'] = bad;
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('two options share the same feedback narration');
  });

  it('rejects an assessment pool without enough questions for a role', () => {
    const raw = branchingRaw();
    delete raw.questions['Q-S08-08.json'];
    const s08 = raw.screens['S08.json'] as { interaction: { questionIds: string[] } };
    s08.interaction.questionIds = s08.interaction.questionIds.filter((id) => id !== 'Q-S08-08');
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('needs at least 2 questions for role clinician');
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

  it('rejects a station point timed after its narration', () => {
    const raw = branchingRaw();
    const media = raw.media as Record<string, unknown>[];
    media.push({ id: 'AUDIO-S07-02', kind: 'audio', status: 'ready', src: 'b.mp3', alt: 'b', durationSec: 3, captionsId: 'AUDIO-S00-01' });
    const s07 = raw.screens['S07.json'] as { sequences: Record<string, { kind: string; audioId?: string }[]>; interaction: { stages: { points: { text: string; at?: number }[] }[] } };
    s07.sequences['stage:one']![1]!.audioId = 'AUDIO-S07-02';
    s07.interaction.stages[0]!.points[0]!.at = 9;
    expect(problemsOf(() => buildContent(raw)).join('\n')).toContain('is timed after its narration ends');
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

describe('values wording (client request)', () => {
  const text = (id: string) => JSON.stringify(content.screens[id]);

  it('names compassion on the "רואים אותך" screen and in the communication behaviours', () => {
    const s03 = text('S03');
    expect(s03).toContain('אנחנו מזהים מראש את הצרכים של המטופל, גם כשהוא לא אומר אותם');
    expect(s03).toContain('מגלים חמלה במידת הצורך');
    expect(text('S04')).toContain('הסברים, אמפתיה וחמלה');
  });

  it('describes how the values show at work with "בא לידי ביטוי", not "מתבטא"', () => {
    for (const id of Object.keys(content.screens)) expect(text(id)).not.toContain('מתבטא');
    expect(JSON.stringify(content.captions)).not.toContain('מתבטא');
    expect(text('S03')).toContain('בא לידי ביטוי');
  });
});
