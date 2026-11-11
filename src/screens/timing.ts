/** Milliseconds since a mark, for response-time analytics. Kept outside components so it never runs during render. */
export const nowMs = () => performance.now();
export const elapsedMs = (since: number) => Math.max(0, Math.round(performance.now() - since));
