const isDev = import.meta.env.DEV;

export const env = {
  isDev,
  /**
   * DRAFT content is development-only per the implementation brief. A production
   * build hides it unless VITE_ALLOW_DRAFT=true is set deliberately (e.g. a pilot).
   * Whenever draft content is visible it carries the "pending approval" badge.
   */
  showDraftContent: isDev || import.meta.env.VITE_ALLOW_DRAFT === 'true',
  analyticsAdapter: import.meta.env.VITE_ANALYTICS_ADAPTER ?? (isDev ? 'console' : 'noop'),
} as const;
