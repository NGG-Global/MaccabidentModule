import type { PlayerRef } from '@remotion/player';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { content } from '../content';
import type { Beat, Screen } from '../content/schema';
import { useTrack } from '../analytics/TrackContext';
import { resolveMedia } from '../media/resolveMedia';
import { FPS } from '../remotion/theme';
import { createClockStore, type ClockStore } from './clock';
import { useMediaPrefs } from './prefs';
import { emptySequence, sequenceReducer, type SeqState } from './sequencer';
import { isPlaybackUnlocked, unlockPlayback } from './session';

interface RunOptions {
  /** Defaults to: play now if the learner has already interacted with the page. */
  autoplay?: boolean;
  startIndex?: number;
  visualProps?: Record<string, unknown>;
}

export interface StageApi {
  screen: Screen;
  state: SeqState;
  token: string;
  clock: ClockStore;
  run(key: string, options?: RunOptions): void;
  runBeats(key: string, beats: Beat[], options?: RunOptions): void;
  /** A user gesture: unlocks audio for the session and starts or resumes playback. */
  play(): void;
  pause(): void;
  replayBeat(): void;
  goToBeat(index: number): void;
  registerVideo(mediaId: string, el: HTMLVideoElement | null): void;
  registerPlayer(token: string, ref: PlayerRef | null): void;
}

const StageContext = createContext<StageApi | null>(null);

type Active = { kind: 'audio' | 'video'; el: HTMLMediaElement } | { kind: 'player'; ref: PlayerRef } | null;

/**
 * Owns all timed media for one screen. Exactly one beat is active at a time
 * and it is the only element allowed to make sound; narration drives its
 * composition frame by frame, so animation never runs ahead of the voice.
 * Mounted per screen: leaving a screen stops everything it started.
 */
export function StageProvider({ screen, children }: { screen: Screen; children: ReactNode }) {
  const track = useTrack();
  const prefs = useMediaPrefs();
  const [state, dispatch] = useReducer(sequenceReducer, emptySequence);
  const [registryVersion, setRegistryVersion] = useState(0);
  const clock = useMemo(() => createClockStore(), []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videos = useRef(new Map<string, HTMLVideoElement>());
  const players = useRef(new Map<string, PlayerRef>());
  const active = useRef<Active>(null);
  const startedToken = useRef<string | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  const token = `${state.runId}:${state.index}`;
  const beat = state.status === 'empty' ? undefined : state.beats[state.index];

  const getAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    return audioRef.current;
  };

  const stopActive = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
    const a = active.current;
    if (a?.kind === 'audio' || a?.kind === 'video') a.el.pause();
    if (a?.kind === 'player') a.ref.pause();
    active.current = null;
  }, []);

  const safePlay = (el: HTMLMediaElement) => {
    try {
      const result = el.play();
      // Only a refusal (no user gesture yet) pauses. An AbortError just means this play() was
      // superseded by a newer load or pause, which the controller has already handled.
      if (result && typeof result.catch === 'function')
        result.catch((error: unknown) => {
          if ((error as { name?: string } | null)?.name === 'NotAllowedError') dispatch({ type: 'PAUSE' });
        });
    } catch {
      dispatch({ type: 'PAUSE' });
    }
  };

  // Start (or resume) the current beat.
  useEffect(() => {
    if (state.status !== 'playing' || !beat) return;
    const runId = state.runId;
    const index = state.index;
    const sequence = state.key ?? '';

    if (startedToken.current === token && active.current) {
      const a = active.current;
      if (a.kind === 'player') a.ref.play();
      else safePlay(a.el);
      return;
    }

    if (beat.kind === 'narration') {
      if (startedToken.current === token) return;
      const media = resolveMedia(content.media, beat.audioId);
      startedToken.current = token;
      stopActive();
      if (media.status !== 'ready') {
        dispatch({ type: 'SKIP_MISSING', runId, index, audioId: beat.audioId });
        return;
      }
      const audio = getAudio();
      audio.src = media.url;
      audio.currentTime = 0;
      audio.muted = prefs.muted;
      audio.playbackRate = prefs.rate;
      const onEnded = () => {
        track('narration_completed', { audioId: beat.audioId, sequence });
        dispatch({ type: 'BEAT_DONE', runId, index });
      };
      // A file that cannot be loaded is treated like a missing one: the transcript stands in.
      const onError = () => dispatch({ type: 'SKIP_MISSING', runId, index, audioId: beat.audioId });
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      cleanup.current = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
      };
      active.current = { kind: 'audio', el: audio };
      track('narration_started', { audioId: beat.audioId, sequence });
      safePlay(audio);
      return;
    }

    if (beat.kind === 'video') {
      const el = videos.current.get(beat.mediaId);
      if (!el) return; // waits for the element to mount (registryVersion re-runs this effect)
      if (startedToken.current === token) return;
      startedToken.current = token;
      stopActive();
      el.currentTime = 0;
      el.muted = prefs.muted;
      el.playbackRate = prefs.rate;
      const onEnded = () => {
        track('video_completed', { mediaId: beat.mediaId, sequence });
        dispatch({ type: 'BEAT_DONE', runId, index });
      };
      const onError = () => dispatch({ type: 'BEAT_DONE', runId, index });
      el.addEventListener('ended', onEnded);
      el.addEventListener('error', onError);
      cleanup.current = () => {
        el.removeEventListener('ended', onEnded);
        el.removeEventListener('error', onError);
      };
      active.current = { kind: 'video', el };
      track('video_started', { mediaId: beat.mediaId, sequence });
      safePlay(el);
      return;
    }

    // Silent composition: the player is its own clock.
    const player = players.current.get(token);
    if (!player) return;
    if (startedToken.current === token) return;
    startedToken.current = token;
    stopActive();
    const onEnded = () => dispatch({ type: 'BEAT_DONE', runId, index });
    player.addEventListener('ended', onEnded);
    cleanup.current = () => player.removeEventListener('ended', onEnded);
    active.current = { kind: 'player', ref: player };
    player.seekTo(0);
    player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, state.status, registryVersion]);

  // Pause and stop.
  useEffect(() => {
    const a = active.current;
    if (!a) return;
    if (state.status === 'paused') {
      if (a.kind === 'player') a.ref.pause();
      else a.el.pause();
    }
    if (state.status === 'ended' || state.status === 'empty') stopActive();
  }, [state.status, stopActive]);

  // Mute and speed apply immediately to whatever is playing.
  useEffect(() => {
    const a = active.current;
    if (a && a.kind !== 'player') {
      a.el.muted = prefs.muted;
      a.el.playbackRate = prefs.rate;
    }
  }, [prefs.muted, prefs.rate, token]);

  // Frame clock: narration drives its composition; captions follow the active element.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = active.current;
      let time = 0;
      if (a?.kind === 'audio' || a?.kind === 'video') time = a.el.currentTime;
      else if (a?.kind === 'player') time = a.ref.getCurrentFrame() / FPS;
      if (beat?.kind === 'narration' && beat.visual && a?.kind === 'audio') {
        players.current.get(token)?.seekTo(Math.round(time * FPS));
      }
      clock.set(token, time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [beat, token, clock, registryVersion]);

  // Development-only test seam: lets automated tests seek through long narration instead of waiting.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __goodHandsStage?: unknown };
    w.__goodHandsStage = {
      status: () => ({
        key: state.key,
        index: state.index,
        status: state.status,
        beat: state.beats[state.index]?.kind,
        started: active.current !== null && startedToken.current === `${state.runId}:${state.index}`,
      }),
      seek: (sec: number) => {
        const a = active.current;
        if (a?.kind === 'audio' || a?.kind === 'video') a.el.currentTime = sec;
        if (a?.kind === 'player') a.ref.seekTo(Math.round(sec * FPS));
      },
      /** Jump to just before the end of the active beat. */
      finish: () => {
        const a = active.current;
        if (a?.kind === 'audio' || a?.kind === 'video') {
          const el = a.el;
          const toEnd = () => {
            el.currentTime = Math.max(0, el.duration - 0.15);
          };
          // Duration is unknown until metadata has loaded; seek once it is.
          if (Number.isFinite(el.duration) && el.duration > 0) toEnd();
          else el.addEventListener('loadedmetadata', toEnd, { once: true });
        }
        if (a?.kind === 'player') dispatch({ type: 'BEAT_DONE', runId: state.runId, index: state.index });
      },
    };
  }, [state]);

  // Leaving the screen stops everything this screen started.
  useEffect(
    () => () => {
      cleanup.current?.();
      audioRef.current?.pause();
      videos.current.forEach((v) => v.pause());
      players.current.forEach((p) => p.pause());
    },
    [],
  );

  const api = useMemo<StageApi>(
    () => ({
      screen,
      state,
      token,
      clock,
      run: (key, options = {}) => {
        const beats = screen.sequences[key];
        if (!beats) return;
        startedToken.current = null;
        dispatch({ type: 'LOAD', key, beats, autoplay: options.autoplay ?? isPlaybackUnlocked(), startIndex: options.startIndex, visualProps: options.visualProps });
      },
      runBeats: (key, beats, options = {}) => {
        startedToken.current = null;
        dispatch({ type: 'LOAD', key, beats, autoplay: options.autoplay ?? isPlaybackUnlocked(), startIndex: options.startIndex, visualProps: options.visualProps });
      },
      play: () => {
        unlockPlayback();
        dispatch({ type: 'PLAY' });
      },
      pause: () => dispatch({ type: 'PAUSE' }),
      replayBeat: () => {
        unlockPlayback();
        startedToken.current = null;
        dispatch({ type: 'REPLAY_BEAT' });
      },
      goToBeat: (index) => {
        unlockPlayback();
        startedToken.current = null;
        dispatch({ type: 'GOTO_BEAT', index });
      },
      registerVideo: (mediaId, el) => {
        if (el) videos.current.set(mediaId, el);
        else videos.current.delete(mediaId);
        setRegistryVersion((v) => v + 1);
      },
      registerPlayer: (key, ref) => {
        if (ref) players.current.set(key, ref);
        else players.current.delete(key);
        setRegistryVersion((v) => v + 1);
      },
    }),
    [screen, state, token, clock],
  );

  return <StageContext.Provider value={api}>{children}</StageContext.Provider>;
}

export function useStage(): StageApi {
  const api = useContext(StageContext);
  if (!api) throw new Error('useStage must be used inside StageProvider');
  return api;
}
