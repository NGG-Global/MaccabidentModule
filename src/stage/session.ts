/**
 * Audible playback may start only after the learner has interacted with the
 * page. This flag is set by an explicit gesture (Start, Play) and lives for
 * the page session only; after a refresh the learner presses play again.
 */
let unlocked = false;

export const unlockPlayback = () => {
  unlocked = true;
};
export const isPlaybackUnlocked = () => unlocked;
/** For tests. */
export const resetPlaybackLock = () => {
  unlocked = false;
};
