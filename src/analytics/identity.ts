import { randomId } from './tracker';

const LEARNER_KEY = 'good-hands:learner:v1';

/**
 * Pseudonymous, device-local learner id: a random value with no link to a
 * person. An organisational employee id is only to be added after an IT and
 * privacy decision (05-analytics).
 */
export function getAnonymousLearnerId(): string {
  try {
    const existing = localStorage.getItem(LEARNER_KEY);
    if (existing) return existing;
    const created = `learner-${randomId()}`;
    localStorage.setItem(LEARNER_KEY, created);
    return created;
  } catch {
    return `learner-${randomId()}`;
  }
}

/** One session per page load. */
export const newSessionId = () => `session-${randomId()}`;
