import { z } from 'zod';
import { ROLES, RoleSchema, scenarioIdsFor, type Content, type CourseConfig, type Role, type Screen } from '../content/schema';

/**
 * Navigation model. The course is an explicit graph of screens (course.json
 * `flow.transitions`), walked by a pure reducer. Nothing here depends on a
 * slide index, on React or on browser APIs, so it is fully unit-testable.
 */

export const AssessmentAttemptSchema = z.strictObject({
  attemptId: z.string(),
  attemptNumber: z.number().int().positive(),
  answers: z.array(z.strictObject({ scenarioId: z.string(), optionId: z.string() })),
  score: z.number(),
  maxScore: z.number(),
  percent: z.number(),
  passed: z.boolean(),
  criticalMisses: z.array(z.string()),
  completedAt: z.string(),
});
export type AssessmentAttempt = z.infer<typeof AssessmentAttemptSchema>;

export const FlowStateSchema = z.strictObject({
  role: RoleSchema.nullable(),
  currentScreenId: z.string(),
  /** Screens whose activity is done (interaction screens) or that were left via "next" (view screens). */
  completed: z.array(z.string()),
  /** scenarioId → option ids chosen in practice, in order. */
  practiceAnswers: z.record(z.string(), z.array(z.string())),
  attempts: z.array(AssessmentAttemptSchema),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});
export type FlowState = z.infer<typeof FlowStateSchema>;

export type FlowAction =
  | { type: 'START'; at: string }
  | { type: 'SELECT_ROLE'; role: Role }
  | { type: 'ANSWER_PRACTICE'; scenarioId: string; optionId: string }
  | { type: 'NEXT'; at: string }
  | { type: 'BACK' }
  | { type: 'GOTO'; screenId: string }
  | { type: 'RECORD_ATTEMPT'; attempt: AssessmentAttempt }
  | { type: 'RESET' };

export function resolveNext(course: CourseConfig, screenId: string, role: Role | null): string | null {
  const to = course.flow.transitions[screenId];
  if (to === undefined) return null;
  if (typeof to === 'string') return to;
  return role ? to[role] : null;
}

/** Ordered screens from start for a role. Stops at a role-dependent branch when no role is chosen yet. */
export function resolvePath(course: CourseConfig, role: Role | null): string[] {
  const path: string[] = [];
  let current: string | null = course.flow.start;
  while (current && !path.includes(current)) {
    path.push(current);
    current = resolveNext(course, current, role);
  }
  return path;
}

const addOnce = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export function createFlow(content: Content) {
  const { course, screens, scenarios } = content;

  const screenOf = (id: string): Screen => {
    const screen = screens[id];
    if (!screen) throw new Error(`Unknown screen ${id}`);
    return screen;
  };

  const initialState = (): FlowState => ({
    role: null,
    currentScreenId: course.flow.start,
    completed: [],
    practiceAnswers: {},
    attempts: [],
    startedAt: null,
    completedAt: null,
  });

  const isScreenComplete = (state: FlowState, screenId: string) => state.completed.includes(screenId);

  /** May the learner leave the current screen forwards? Interaction screens gate on their activity. */
  const canAdvance = (state: FlowState): boolean => {
    const screen = screenOf(state.currentScreenId);
    if (resolveNext(course, screen.screenId, state.role) === null) return false;
    return screen.completion === 'view' || isScreenComplete(state, screen.screenId);
  };

  /** A screen can be visited only when everything before it on the learner's path is complete. */
  const canVisit = (state: FlowState, screenId: string): boolean => {
    const path = resolvePath(course, state.role);
    const index = path.indexOf(screenId);
    return index >= 0 && path.slice(0, index).every((id) => isScreenComplete(state, id));
  };

  const previousOf = (state: FlowState): string | null => {
    const path = resolvePath(course, state.role);
    const index = path.indexOf(state.currentScreenId);
    return index > 0 ? (path[index - 1] ?? null) : null;
  };

  /** Position for the progress indicator. Before a role is chosen, a branching graph is sized by the first role. */
  const progress = (state: FlowState): { current: number; total: number } => {
    const path = resolvePath(course, state.role ?? ROLES[0]);
    return { current: Math.max(path.indexOf(state.currentScreenId), 0) + 1, total: path.length };
  };

  const reducer = (state: FlowState, action: FlowAction): FlowState => {
    const screen = screenOf(state.currentScreenId);
    switch (action.type) {
      case 'START': {
        if (screen.interactionType !== 'intro' || state.startedAt) return state;
        return { ...state, startedAt: action.at, completed: addOnce(state.completed, screen.screenId) };
      }
      case 'SELECT_ROLE': {
        if (screen.interactionType !== 'roleSelect') return state;
        return { ...state, role: action.role, completed: addOnce(state.completed, screen.screenId) };
      }
      case 'ANSWER_PRACTICE': {
        const expected = scenarioIdsFor(screen, state.role);
        const scenario = scenarios[action.scenarioId];
        if (!expected.includes(action.scenarioId) || !scenario?.options.some((o) => o.id === action.optionId))
          return state;
        const practiceAnswers = {
          ...state.practiceAnswers,
          [action.scenarioId]: [...(state.practiceAnswers[action.scenarioId] ?? []), action.optionId],
        };
        // Practice is not penalised: any answer counts, the screen completes once each scenario was attempted.
        const allAttempted = expected.every((id) => (practiceAnswers[id]?.length ?? 0) > 0);
        return {
          ...state,
          practiceAnswers,
          completed: allAttempted ? addOnce(state.completed, screen.screenId) : state.completed,
        };
      }
      case 'NEXT': {
        if (!canAdvance(state)) return state;
        const next = resolveNext(course, screen.screenId, state.role);
        if (!next) return state;
        const reachedSummary = next === course.flow.summary && !state.completedAt;
        return {
          ...state,
          currentScreenId: next,
          completed: addOnce(state.completed, screen.screenId),
          completedAt: reachedSummary ? action.at : state.completedAt,
        };
      }
      case 'BACK': {
        const previous = previousOf(state);
        return previous ? { ...state, currentScreenId: previous } : state;
      }
      case 'GOTO': {
        return canVisit(state, action.screenId) ? { ...state, currentScreenId: action.screenId } : state;
      }
      case 'RECORD_ATTEMPT': {
        return { ...state, attempts: [...state.attempts, action.attempt] };
      }
      case 'RESET': {
        return initialState();
      }
    }
  };

  /**
   * Checks state read back from storage. Anything malformed, or pointing at a
   * screen the learner could not legitimately have reached, is discarded.
   */
  const restore = (raw: unknown): FlowState | null => {
    const parsed = FlowStateSchema.safeParse(raw);
    if (!parsed.success) return null;
    const state = parsed.data;
    if (!screens[state.currentScreenId] || !canVisit(state, state.currentScreenId)) return null;
    return state;
  };

  return { initialState, reducer, canAdvance, canVisit, previousOf, progress, restore, screenOf };
}

export type Flow = ReturnType<typeof createFlow>;
