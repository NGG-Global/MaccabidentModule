import type { Interaction, Question, Role } from '../content/schema';

type AssessmentInteraction = Extract<Interaction, { type: 'assessment' }>;

/** Small deterministic PRNG (mulberry32), so an attempt's order is reproducible and testable. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const rand = seededRandom(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The questions for one attempt: the configured number of shared questions and
 * role questions, drawn from the pool and presented in a seeded order. Option
 * ids stay stable; only their display order changes (see optionOrder).
 */
export function drawAssessment(interaction: AssessmentInteraction, questions: Record<string, Question>, role: Role, attemptNumber: number): Question[] {
  const pool = interaction.questionIds.map((id) => questions[id]).filter((q): q is Question => Boolean(q));
  const seed = hashSeed(`${role}:${attemptNumber}`);
  const common = shuffle(pool.filter((q) => q.track === 'common'), seed).slice(0, interaction.commonCount);
  const own = shuffle(pool.filter((q) => q.track === role), seed + 1).slice(0, interaction.roleCount);
  // Shared questions first, as the course itself moves from the shared core to the role.
  return [...shuffle(common, seed + 2), ...shuffle(own, seed + 3)];
}

/** Display order of a question's options for a given attempt; ids are unchanged. */
export function optionOrder<T extends { id: string }>(options: readonly T[], key: string): T[] {
  return shuffle(options, hashSeed(key));
}
