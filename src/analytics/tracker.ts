import type { Role } from '../content/schema';
import type { AnalyticsAdapter } from './adapter';
import { SCHEMA_VERSION, validateEvent, type EventName, type EventPayload } from './events';

export interface TrackFields {
  role: Role | null;
  screenId: string;
  scenarioId?: string;
  attemptId?: string;
}

export interface TrackerOptions {
  adapter: AnalyticsAdapter;
  courseId: string;
  courseVersion: string;
  sessionId: string;
  anonymousLearnerId: string;
  now?: () => Date;
  newId?: () => string;
  /** Called when an event fails validation or the adapter fails. Never throws into the caller. */
  onProblem?: (eventName: string, problems: string[]) => void;
}

export interface Tracker {
  /** Returns true when the event was valid and handed to the adapter. Never throws. */
  track<N extends EventName>(eventName: N, payload: EventPayload<N>, fields: TrackFields): boolean;
}

export function randomId(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  // randomUUID needs a secure context; fall back for plain-http intranet hosting.
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function createTracker(options: TrackerOptions): Tracker {
  const { adapter, onProblem } = options;
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? randomId;
  const report = (name: string, problems: string[]) => {
    try {
      onProblem?.(name, problems);
    } catch {
      // reporting must not break learning either
    }
  };

  return {
    track(eventName, payload, fields) {
      try {
        const checked = validateEvent({
          eventName,
          eventId: newId(),
          timestamp: now().toISOString(),
          sessionId: options.sessionId,
          anonymousLearnerId: options.anonymousLearnerId,
          courseId: options.courseId,
          courseVersion: options.courseVersion,
          role: fields.role,
          screenId: fields.screenId,
          ...(fields.scenarioId ? { scenarioId: fields.scenarioId } : {}),
          ...(fields.attemptId ? { attemptId: fields.attemptId } : {}),
          schemaVersion: SCHEMA_VERSION,
          payload,
        });
        if (!checked.ok) {
          report(eventName, checked.problems);
          return false;
        }
        const sent = adapter.send(checked.event);
        if (sent instanceof Promise) sent.catch((error: unknown) => report(eventName, [String(error)]));
        return true;
      } catch (error) {
        report(eventName, [String(error)]);
        return false;
      }
    },
  };
}
