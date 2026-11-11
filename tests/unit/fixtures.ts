import type { RawContent } from '../../src/content/loader';

const screen = (screenId: string, extra: Record<string, unknown> = {}) => ({
  screenId,
  title: screenId,
  targetMinutes: 1,
  onScreenText: [],
  mediaIds: [],
  interactionType: 'compare',
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

/**
 * A small course with a role-dependent branch:
 * S00 intro → S01 role → (reception: S02 | assistant: S03 | clinician: S04) → S05 scenarios → S09 summary
 */
export const branchingRaw = (): RawContent => ({
  course: {
    courseId: 'good-hands',
    courseVersion: '9.9.9',
    title: 'test',
    assessment: { passThreshold: 80, pointsPerDecision: 20, partialCreditRatio: 0, maxAttempts: null, note: '' },
    completionRule: 'reach-summary',
    flow: {
      start: 'S00',
      summary: 'S09',
      transitions: {
        S00: 'S01',
        S01: { reception: 'S02', assistant: 'S03', clinician: 'S04' },
        S02: 'S05',
        S03: 'S05',
        S04: 'S05',
        S05: 'S09',
      },
    },
  },
  screens: {
    'S00.json': screen('S00', { interactionType: 'intro', completion: 'interaction' }),
    'S01.json': screen('S01', { interactionType: 'roleSelect', completion: 'interaction' }),
    'S02.json': screen('S02'),
    'S03.json': screen('S03'),
    'S04.json': screen('S04'),
    'S05.json': screen('S05', {
      interactionType: 'scenario',
      completion: 'interaction',
      scenarioIds: { common: ['SC-COM-01'], reception: ['SC-REC-01'], assistant: ['SC-AST-01'], clinician: ['SC-CLN-01'] },
    }),
    'S09.json': screen('S09', { interactionType: 'summary' }),
  },
  scenarios: {
    'SC-COM-01.json': scenario('SC-COM-01'),
    'SC-COM-02.json': scenario('SC-COM-02', { critical: true }),
    'SC-REC-01.json': scenario('SC-REC-01', { track: 'reception' }),
    'SC-AST-01.json': scenario('SC-AST-01', { track: 'assistant' }),
    'SC-CLN-01.json': scenario('SC-CLN-01', { track: 'clinician' }),
  },
  media: [{ id: 'AUDIO-S00', kind: 'audio', status: 'missing', alt: 'a' }],
  values: {
    sourcePages: [8],
    approvalStatus: 'DRAFT',
    values: ['v1', 'v2', 'v3'].map((id) => ({ id, name: id, description: id, subValues: ['a', 'b', 'c'] })),
  },
  roles: ['reception', 'assistant', 'clinician'].map((id) => ({ id, label: id, description: id })),
});
