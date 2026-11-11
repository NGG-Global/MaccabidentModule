import type { AnalyticsEvent } from './events';

/**
 * The only seam between the course and an analytics destination. A future
 * PostHog / xAPI LRS / LMS adapter implements this interface; screen
 * components never import a vendor SDK.
 */
export interface AnalyticsAdapter {
  send(event: AnalyticsEvent): void | Promise<void>;
}

export class NoopAdapter implements AnalyticsAdapter {
  send(): void {}
}

/** Development adapter: one console line per event, as JSON, prefixed for easy filtering. */
export class ConsoleAdapter implements AnalyticsAdapter {
  static readonly PREFIX = '[analytics]';
  send(event: AnalyticsEvent): void {
    console.info(ConsoleAdapter.PREFIX, JSON.stringify(event));
  }
}

/**
 * Keeps the most recent events in memory for this page only, for local
 * inspection during a demonstration (window.__goodHandsEvents in development).
 */
export class MemoryAdapter implements AnalyticsAdapter {
  readonly events: AnalyticsEvent[] = [];
  constructor(private readonly limit = 500) {}
  send(event: AnalyticsEvent): void {
    this.events.push(event);
    if (this.events.length > this.limit) this.events.shift();
  }
}

/** Fans one event out to several local adapters; a failing adapter does not affect the others. */
export class CompositeAdapter implements AnalyticsAdapter {
  constructor(private readonly adapters: AnalyticsAdapter[]) {}
  send(event: AnalyticsEvent): void {
    for (const adapter of this.adapters) {
      try {
        void adapter.send(event);
      } catch {
        // isolated by design
      }
    }
  }
}

export function createAdapter(kind: string): AnalyticsAdapter {
  return kind === 'console' ? new ConsoleAdapter() : new NoopAdapter();
}
