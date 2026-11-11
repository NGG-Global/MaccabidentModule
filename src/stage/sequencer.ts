import type { Beat } from '../content/schema';

/**
 * Pure playback model for a screen's timed media. Beats run one after
 * another; only one beat is ever active, so narration, video dialogue and
 * animation cannot overlap. `runId` changes whenever a beat must (re)start.
 */
export type SeqStatus = 'empty' | 'ready' | 'playing' | 'paused' | 'ended';

export interface SeqState {
  key: string | null;
  beats: Beat[];
  index: number;
  status: SeqStatus;
  runId: number;
  /** Narration ids in this run that were skipped because the audio was not supplied. */
  missing: string[];
  /** Props merged into every composition of this run (e.g. visited journey stages). */
  visualProps: Record<string, unknown>;
}

export type SeqAction =
  | { type: 'LOAD'; key: string; beats: Beat[]; autoplay: boolean; startIndex?: number; visualProps?: Record<string, unknown> }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'BEAT_DONE'; runId: number; index: number }
  | { type: 'SKIP_MISSING'; runId: number; index: number; audioId: string }
  | { type: 'REPLAY_BEAT' }
  | { type: 'GOTO_BEAT'; index: number }
  | { type: 'STOP' };

export const emptySequence: SeqState = { key: null, beats: [], index: 0, status: 'empty', runId: 0, missing: [], visualProps: {} };

const advance = (state: SeqState): SeqState =>
  state.index + 1 < state.beats.length ? { ...state, index: state.index + 1 } : { ...state, status: 'ended' };

export function sequenceReducer(state: SeqState, action: SeqAction): SeqState {
  switch (action.type) {
    case 'LOAD': {
      if (action.beats.length === 0) return { ...emptySequence, runId: state.runId + 1 };
      const index = Math.min(Math.max(action.startIndex ?? 0, 0), action.beats.length - 1);
      return {
        key: action.key,
        beats: action.beats,
        index,
        status: action.autoplay ? 'playing' : 'ready',
        runId: state.runId + 1,
        missing: [],
        visualProps: action.visualProps ?? {},
      };
    }
    case 'PLAY':
      if (state.status === 'ready' || state.status === 'paused') return { ...state, status: 'playing' };
      // Playing again after the end replays the whole sequence.
      if (state.status === 'ended') return { ...state, status: 'playing', index: 0, runId: state.runId + 1, missing: [] };
      return state;
    case 'PAUSE':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    case 'BEAT_DONE':
      if (action.runId !== state.runId || action.index !== state.index || state.status !== 'playing') return state;
      return advance(state);
    case 'SKIP_MISSING': {
      if (action.runId !== state.runId || action.index !== state.index) return state;
      const missing = state.missing.includes(action.audioId) ? state.missing : [...state.missing, action.audioId];
      return advance({ ...state, missing });
    }
    case 'REPLAY_BEAT':
      if (state.status === 'empty') return state;
      return { ...state, status: 'playing', runId: state.runId + 1 };
    case 'GOTO_BEAT':
      if (action.index < 0 || action.index >= state.beats.length) return state;
      return { ...state, index: action.index, status: 'playing', runId: state.runId + 1 };
    case 'STOP':
      return state.status === 'empty' ? state : { ...state, status: 'ended' };
  }
}

/** The beat whose picture should be on screen: the current one, or the last earlier beat that had a picture. */
export function visualBeatIndex(state: SeqState, isExternalVideo: (mediaId: string) => boolean = () => false): number {
  for (let i = Math.min(state.index, state.beats.length - 1); i >= 0; i--) {
    const beat = state.beats[i]!;
    if (beat.kind === 'composition' || (beat.kind === 'narration' && beat.visual) || (beat.kind === 'video' && !isExternalVideo(beat.mediaId))) return i;
  }
  return -1;
}
