import type { RawContent } from '../../src/content/loader';

const screen = (screenId: string, extra: Record<string, unknown> = {}) => ({
  screenId,
  chapter: screenId,
  title: screenId,
  targetMinutes: 1,
  onScreenText: [],
  mediaIds: [],
  interactionType: 'measurement',
  completion: 'view',
  sourcePages: [],
  approvalStatus: 'DRAFT',
  ...extra,
});

export const scenario = (scenarioId: string, extra: Record<string, unknown> = {}) => ({
  scenarioId,
  title: scenarioId,
  track: 'common',
  touchpoint: 't',
  values: [],
  skill: 'skill',
  scene: 'scene',
  question: 'question',
  options: [
    { id: 'A', text: 'a', rating: 'undesirable', feedback: 'fa' },
    { id: 'B', text: 'b', rating: 'preferred', feedback: 'fb' },
    { id: 'C', text: 'c', rating: 'partial', feedback: 'fc' },
  ],
  sourcePages: [],
  approvalStatus: 'DRAFT',
  ...extra,
});

const stage = (id: string, number: number) => ({ id, number, title: id, summary: 's', points: ['a', 'b'], sequence: `stage:${id}`, sourcePages: [9] });
const stageIds = ['one', 'two', 'three', 'four', 'five'];
const journeyStages = stageIds.map((id, i) => ({ id, number: i + 1, title: id }));

/**
 * A small course with a role-dependent branch:
 * S00 intro → S01 role → (reception: S02 | assistant: S03 | clinician: S04 practice) → S05 compare → S06 values → S07 journey (end)
 */
export const branchingRaw = (): RawContent => ({
  course: {
    courseId: 'good-hands',
    courseVersion: '9.9.9',
    title: 'test',
    assessment: { passThreshold: 80, pointsPerDecision: 20, partialCreditRatio: 0, maxAttempts: null, note: '' },
    completionRule: 'end-screen-complete',
    flow: {
      start: 'S00',
      end: 'S07',
      transitions: {
        S00: 'S01',
        S01: { reception: 'S02', assistant: 'S03', clinician: 'S04' },
        S02: 'S05',
        S03: 'S05',
        S04: 'S05',
        S05: 'S06',
        S06: 'S07',
      },
    },
  },
  screens: {
    'S00.json': screen('S00', {
      interactionType: 'intro',
      completion: 'interaction',
      sequences: { enter: [{ kind: 'narration', audioId: 'AUDIO-S00-01', visual: { id: 'chapter', props: { number: '00', title: 't' } } }] },
    }),
    'S01.json': screen('S01', { interactionType: 'roleSelect', completion: 'interaction' }),
    'S02.json': screen('S02'),
    'S03.json': screen('S03'),
    'S04.json': screen('S04', {
      interactionType: 'scenario',
      completion: 'interaction',
      scenarioIds: { common: ['SC-COM-01'], clinician: ['SC-CLN-01'] },
    }),
    'S05.json': screen('S05', {
      interactionType: 'compare',
      completion: 'interaction',
      sequences: { enter: [{ kind: 'video', mediaId: 'VID-A-01' }], feedback: [{ kind: 'narration', audioId: 'AUDIO-S00-01' }] },
      interaction: { type: 'compare', versions: [{ label: 'a', mediaId: 'VID-A-01' }, { label: 'b', mediaId: 'VID-A-01' }], questionId: 'Q-S05-01' },
    }),
    'S06.json': screen('S06', {
      interactionType: 'valuesMatch',
      completion: 'interaction',
      sequences: { enter: [{ kind: 'composition', durationSec: 2, visual: { id: 'chapter', props: { number: '02', title: 't' } } }] },
      interaction: {
        type: 'valuesMatch',
        chapters: [{ valueId: 'v1', beatIndex: 0 }],
        prompt: 'p',
        items: [
          { id: 'item-a', text: 'a', valueId: 'v1', feedback: 'f' },
          { id: 'item-b', text: 'b', valueId: 'v2', feedback: 'f' },
        ],
      },
    }),
    'S07.json': screen('S07', {
      interactionType: 'journey',
      completion: 'interaction',
      sequences: Object.fromEntries(
        stageIds.map((id) => [`stage:${id}`, [{ kind: 'composition', durationSec: 2, visual: { id: 'journey', props: { stages: journeyStages, active: id } } }, { kind: 'narration', audioId: 'AUDIO-S07-01' }]]),
      ),
      interaction: { type: 'journey', stages: stageIds.map((id, i) => stage(id, i + 1)), completion: { title: 'done', next: 'next' } },
    }),
  },
  scenarios: {
    'SC-COM-01.json': scenario('SC-COM-01'),
    'SC-COM-02.json': scenario('SC-COM-02', { critical: true }),
    'SC-REC-01.json': scenario('SC-REC-01', { track: 'reception' }),
    'SC-AST-01.json': scenario('SC-AST-01', { track: 'assistant' }),
    'SC-CLN-01.json': scenario('SC-CLN-01', { track: 'clinician' }),
  },
  questions: {
    'Q-S05-01.json': {
      questionId: 'Q-S05-01',
      prompt: 'p',
      options: [
        { id: 'A', text: 'a', correct: true, feedback: 'f' },
        { id: 'B', text: 'b', correct: false, feedback: 'f' },
        { id: 'C', text: 'c', correct: false, feedback: 'f' },
      ],
      feedbackSequence: 'feedback',
      sourcePages: [],
      approvalStatus: 'DRAFT',
    },
  },
  media: [
    { id: 'AUDIO-S00-01', kind: 'audio', status: 'ready', src: 'a.mp3', alt: 'a', durationSec: 5, captionsId: 'AUDIO-S00-01' },
    { id: 'AUDIO-S07-01', kind: 'audio', status: 'missing', alt: 'a' },
    { id: 'VID-A-01', kind: 'video', status: 'ready', src: 'v.mp4', alt: 'v', durationSec: 10, posterId: 'POSTER-A-01' },
    { id: 'POSTER-A-01', kind: 'image', status: 'ready', src: 'p.jpg', alt: 'p' },
  ],
  captions: { 'AUDIO-S00-01': { status: 'machine-transcribed', cues: [{ start: 0, end: 2, text: 'שלום' }] } },
  values: {
    sourcePages: [8],
    approvalStatus: 'DRAFT',
    values: ['v1', 'v2', 'v3'].map((id) => ({ id, name: id, description: id, subValues: ['a', 'b', 'c'] })),
  },
  roles: ['reception', 'assistant', 'clinician'].map((id) => ({ id, label: id, description: id })),
});
