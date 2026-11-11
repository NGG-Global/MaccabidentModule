import { describe, expect, it } from 'vitest';
import type { Beat } from '../../src/content/schema';
import { emptySequence, sequenceReducer, visualBeatIndex, type SeqAction, type SeqState } from '../../src/stage/sequencer';

const chapter: Beat = { kind: 'composition', durationSec: 2, visual: { id: 'chapter', props: {} } };
const narrated: Beat = { kind: 'narration', audioId: 'AUDIO-S02-01', visual: { id: 'meetYossi', props: {} } };
const video: Beat = { kind: 'video', mediaId: 'VID-A-01' };
const voice: Beat = { kind: 'narration', audioId: 'AUDIO-S02-02' };
const beats = [chapter, narrated, video, voice];

const run = (actions: SeqAction[], from: SeqState = emptySequence) => actions.reduce(sequenceReducer, from);
const load = (autoplay: boolean) => run([{ type: 'LOAD', key: 'enter', beats, autoplay }]);

describe('sequencer', () => {
  it('waits for a gesture unless already unlocked', () => {
    expect(load(false).status).toBe('ready');
    expect(load(true).status).toBe('playing');
    expect(run([{ type: 'PLAY' }], load(false)).status).toBe('playing');
  });

  it('plays beats strictly one after another and ends after the last', () => {
    let s = load(true);
    for (let i = 0; i < beats.length; i++) {
      expect(s.index).toBe(i);
      s = run([{ type: 'BEAT_DONE', runId: s.runId, index: s.index }], s);
    }
    expect(s.status).toBe('ended');
    expect(s.index).toBe(beats.length - 1);
  });

  it('ignores completion signals from a beat that is no longer current (no overlap, no double advance)', () => {
    const s = load(true);
    const stale = run([{ type: 'BEAT_DONE', runId: s.runId - 1, index: 0 }, { type: 'BEAT_DONE', runId: s.runId, index: 2 }], s);
    expect(stale).toBe(s);
    const paused = run([{ type: 'PAUSE' }], s);
    expect(run([{ type: 'BEAT_DONE', runId: s.runId, index: 0 }], paused).index).toBe(0);
  });

  it('skips narration that was not supplied and names it', () => {
    const s = run([{ type: 'GOTO_BEAT', index: 3 }], load(true));
    const after = run([{ type: 'SKIP_MISSING', runId: s.runId, index: 3, audioId: 'AUDIO-S02-02' }], s);
    expect(after.status).toBe('ended');
    expect(after.missing).toEqual(['AUDIO-S02-02']);
  });

  it('replays a beat with a fresh run id, and the whole sequence after the end', () => {
    const s = load(true);
    expect(run([{ type: 'REPLAY_BEAT' }], s).runId).toBe(s.runId + 1);
    const ended = run([{ type: 'STOP' }], s);
    const again = run([{ type: 'PLAY' }], ended);
    expect([again.status, again.index]).toEqual(['playing', 0]);
  });

  it('holds the last picture while a voice-only beat plays', () => {
    const s = run([{ type: 'GOTO_BEAT', index: 3 }], load(true));
    expect(visualBeatIndex(s)).toBe(2);
    expect(visualBeatIndex(s, (id) => id === 'VID-A-01')).toBe(1);
  });
});
