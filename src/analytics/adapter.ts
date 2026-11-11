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

export function createAdapter(kind: string): AnalyticsAdapter {
  return kind === 'console' ? new ConsoleAdapter() : new NoopAdapter();
}
