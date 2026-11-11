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
  /** View screens the learner has moved past. Interaction screens are judged by their answers. */
  completed: z.array(z.string()),
  /** Answer history, in order, keyed by question id, scenario id or "<screenId>:<itemId>". */
  answers: z.record(z.string(), z.array(z.string())),
  /** Journey stages opened, as "<screenId>:<stageId>". */
  visited: z.array(z.string()),
  attempts: z.array(AssessmentAttemptSchema),
  startedAt: z.string().nullable(),
  /** Set once, when the end screen's activity is first completed. */
  completedAt: z.string().nullable(),
});
export type FlowState = z.infer<typeof FlowStateSchema>;

export type FlowAction =
  | { type: 'START'; at: string }
  | { type: 'SELECT_ROLE'; role: Role }
  | { type: 'ANSWER_QUESTION'; questionId: string; optionId: string }
  | { type: 'MATCH_VALUE'; itemId: string; valueId: string }
  | { type: 'VISIT_STAGE'; stageId: string; at: string }
  | { type: 'ANSWER_PRACTICE'; scenarioId: string; optionId: string }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'GOTO'; screenId: string }
  | { type: 'RECORD_ATTEMPT'; attempt: AssessmentAttempt }
  | { type: 'RESET' };

export const itemKey = (screenId: string, itemId: string) => `${screenId}:${itemId}`;

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
const append = (answers: FlowState['answers'], key: string, value: string) => ({
  ...answers,
  [key]: [...(answers[key] ?? []), value],
});

export function createFlow(content: Content) {
  const { course, screens, scenarios, questions } = content;

  const screenOf = (id: string): Screen => {
    const screen = screens[id];
    if (!screen) throw new Error(`Unknown screen ${id}`);
    return screen;
  };

  const initialState = (): FlowState => ({
    role: null,
    currentScreenId: course.flow.start,
    completed: [],
    answers: {},
    visited: [],
    attempts: [],
    startedAt: null,
    completedAt: null,
  });

  /** Has the learner done what the screen asks? Practice answers count whether right or wrong, unless stated. */
  const isActivityDone = (state: FlowState, screen: Screen): boolean => {
    const interaction = screen.interaction;
    switch (screen.interactionType) {
      case 'intro':
        return state.startedAt !== null;
      case 'roleSelect':
        return state.role !== null;
      case 'compare':
        return interaction?.type === 'compare' && (state.answers[interaction.questionId]?.length ?? 0) > 0;
      case 'valuesMatch':
        // Each item must eventually be matched to its value; wrong tries are allowed and recorded.
        return (
          interaction?.type === 'valuesMatch' &&
          interaction.items.every((item) => state.answers[itemKey(screen.screenId, item.id)]?.includes(item.valueId))
        );
      case 'journey':
        return (
          interaction?.type === 'journey' &&
          interaction.stages.every((stage) => state.visited.includes(itemKey(screen.screenId, stage.id)))
        );
      case 'scenario':
        return scenarioIdsFor(screen, state.role).every((id) => (state.answers[id]?.length ?? 0) > 0);
      default:
        return false;
    }
  };

  const isScreenComplete = (state: FlowState, screenId: string): boolean => {
    const screen = screenOf(screenId);
    return screen.completion === 'view' ? state.completed.includes(screenId) : isActivityDone(state, screen);
  };

  /** May the learner leave the current screen forwards? Interaction screens gate on their activity. */
  const canAdvance = (state: FlowState): boolean => {
    const screen = screenOf(state.currentScreenId);
    if (resolveNext(course, screen.screenId, state.role) === null) return false;
    return screen.completion === 'view' || isActivityDone(state, screen);
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

  /** Chapters for the progress indicator. Before a role is chosen, a branching graph is sized by the first role. */
  const chapters = (state: FlowState) =>
    resolvePath(course, state.role ?? ROLES[0]).map((id) => ({
      screenId: id,
      label: screenOf(id).chapter,
      complete: isScreenComplete(state, id),
      current: id === state.currentScreenId,
    }));

  const step = (state: FlowState, action: FlowAction): FlowState => {
    const screen = screenOf(state.currentScreenId);
    const interaction = screen.interaction;
    switch (action.type) {
      case 'START':
        return screen.interactionType === 'intro' && !state.startedAt ? { ...state, startedAt: action.at } : state;
      case 'SELECT_ROLE':
        return screen.interactionType === 'roleSelect' ? { ...state, role: action.role } : state;
      case 'ANSWER_QUESTION': {
        if (interaction?.type !== 'compare' || interaction.questionId !== action.questionId) return state;
        if (!questions[action.questionId]?.options.some((o) => o.id === action.optionId)) return state;
        return { ...state, answers: append(state.answers, action.questionId, action.optionId) };
      }
      case 'MATCH_VALUE': {
        if (interaction?.type !== 'valuesMatch' || !interaction.items.some((i) => i.id === action.itemId)) return state;
        if (!content.values.values.some((v) => v.id === action.valueId)) return state;
        return { ...state, answers: append(state.answers, itemKey(screen.screenId, action.itemId), action.valueId) };
      }
      case 'VISIT_STAGE': {
        if (interaction?.type !== 'journey' || !interaction.stages.some((s) => s.id === action.stageId)) return state;
        return { ...state, visited: addOnce(state.visited, itemKey(screen.screenId, action.stageId)) };
      }
      case 'ANSWER_PRACTICE': {
        const scenario = scenarios[action.scenarioId];
        if (!scenarioIdsFor(screen, state.role).includes(action.scenarioId)) return state;
        if (!scenario?.options.some((o) => o.id === action.optionId)) return state;
        return { ...state, answers: append(state.answers, action.scenarioId, action.optionId) };
      }
      case 'NEXT': {
        if (!canAdvance(state)) return state;
        const next = resolveNext(course, screen.screenId, state.role);
        if (!next) return state;
        return { ...state, currentScreenId: next, completed: addOnce(state.completed, screen.screenId) };
      }
      case 'BACK': {
        const previous = previousOf(state);
        return previous ? { ...state, currentScreenId: previous } : state;
      }
      case 'GOTO':
        return canVisit(state, action.screenId) ? { ...state, currentScreenId: action.screenId } : state;
      case 'RECORD_ATTEMPT':
        return { ...state, attempts: [...state.attempts, action.attempt] };
      case 'RESET':
        return initialState();
    }
  };

  const reducer = (state: FlowState, action: FlowAction): FlowState => {
    const next = step(state, action);
    // The prototype is complete the first time the end screen's activity is done.
    if (next !== state && !next.completedAt && next.currentScreenId === course.flow.end && isScreenComplete(next, course.flow.end)) {
      return { ...next, completedAt: 'at' in action ? action.at : new Date().toISOString() };
    }
    return next;
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

  return { initialState, reducer, canAdvance, canVisit, previousOf, chapters, isScreenComplete, isActivityDone, restore, screenOf };
}

export type Flow = ReturnType<typeof createFlow>;
