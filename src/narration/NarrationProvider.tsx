import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { content } from '../content';
import { resolveMedia } from '../media/resolveMedia';

export interface NarrationClip {
  audioId: string;
  /** Empty when the spoken text is already fully shown on screen (e.g. short feedback). */
  transcript: string;
}

export type NarrationStatus = 'idle' | 'playing' | 'paused' | 'ended' | 'unavailable';

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

interface NarrationApi {
  clip: NarrationClip | null;
  status: NarrationStatus;
  muted: boolean;
  rate: number;
  /** Replaces the current clip. Always stops whatever was playing first. */
  setClip(clip: NarrationClip | null): void;
  /** Records that the learner has interacted, after which new clips may start by themselves. */
  unlock(): void;
  play(): void;
  pause(): void;
  replay(): void;
  toggleMute(): void;
  setRate(rate: number): void;
}

const NarrationContext = createContext<NarrationApi | null>(null);

interface Props {
  children: ReactNode;
  onMediaEvent?: (event: 'media_started' | 'media_completed', audioId: string) => void;
}

/**
 * Owns the single audio element used for all narration. One element means two
 * clips cannot overlap, and replacing the clip (on every screen change) stops
 * the previous one. Nothing plays before the learner's first interaction.
 */
export function NarrationProvider({ children, onMediaEvent }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clipRef = useRef<NarrationClip | null>(null);
  const startReported = useRef(false);
  const unlockedRef = useRef(false);
  const mutedRef = useRef(false);
  const rateRef = useRef(1);
  const onMediaEventRef = useRef(onMediaEvent);
  useEffect(() => {
    onMediaEventRef.current = onMediaEvent;
  }, [onMediaEvent]);

  const [clip, setClipState] = useState<NarrationClip | null>(null);
  const [status, setStatus] = useState<NarrationStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [rate, setRateState] = useState(1);

  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = 'auto';
    const hasSource = () => Boolean(audio.getAttribute('src'));
    audio.addEventListener('playing', () => {
      setStatus('playing');
      // Once per loaded clip: pausing and resuming is not a new start.
      if (clipRef.current && !startReported.current) {
        startReported.current = true;
        onMediaEventRef.current?.('media_started', clipRef.current.audioId);
      }
    });
    audio.addEventListener('pause', () => {
      if (hasSource() && !audio.ended) setStatus('paused');
    });
    audio.addEventListener('ended', () => {
      setStatus('ended');
      if (clipRef.current) onMediaEventRef.current?.('media_completed', clipRef.current.audioId);
    });
    // A file that is listed as ready but cannot be loaded degrades to the transcript.
    audio.addEventListener('error', () => {
      if (hasSource()) setStatus('unavailable');
    });
    audioRef.current = audio;
    return audio;
  }, []);

  const startPlayback = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch(() => {
      // Autoplay refused or the file failed; the 'error' listener covers the latter.
    });
  }, []);

  const setClip = useCallback(
    (next: NarrationClip | null) => {
      const current = audioRef.current;
      if (current) {
        current.pause();
        current.removeAttribute('src');
        current.load();
      }
      clipRef.current = next;
      startReported.current = false;
      setClipState(next);
      if (!next) return setStatus('idle');

      const media = resolveMedia(content.media, next.audioId);
      if (media.status !== 'ready') return setStatus('unavailable');

      const audio = getAudio();
      audio.src = media.url;
      audio.muted = mutedRef.current;
      audio.defaultPlaybackRate = rateRef.current;
      audio.playbackRate = rateRef.current;
      setStatus('idle');
      if (unlockedRef.current) startPlayback(audio);
    },
    [getAudio, startPlayback],
  );

  const api = useMemo<NarrationApi>(
    () => ({
      clip,
      status,
      muted,
      rate,
      setClip,
      unlock: () => {
        unlockedRef.current = true;
      },
      play: () => {
        unlockedRef.current = true; // pressing play is itself a user interaction
        const audio = audioRef.current;
        if (audio?.getAttribute('src')) startPlayback(audio);
      },
      pause: () => audioRef.current?.pause(),
      replay: () => {
        unlockedRef.current = true;
        const audio = audioRef.current;
        if (!audio?.getAttribute('src')) return;
        audio.currentTime = 0;
        startPlayback(audio);
      },
      toggleMute: () => {
        mutedRef.current = !mutedRef.current;
        if (audioRef.current) audioRef.current.muted = mutedRef.current;
        setMuted(mutedRef.current);
      },
      setRate: (value: number) => {
        rateRef.current = value;
        if (audioRef.current) {
          audioRef.current.defaultPlaybackRate = value;
          audioRef.current.playbackRate = value;
        }
        setRateState(value);
      },
    }),
    [clip, status, muted, rate, setClip, startPlayback],
  );

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    [],
  );

  return <NarrationContext.Provider value={api}>{children}</NarrationContext.Provider>;
}

export function useNarration(): NarrationApi {
  const api = useContext(NarrationContext);
  if (!api) throw new Error('useNarration must be used inside NarrationProvider');
  return api;
}

/** Makes `clip` the active narration while the calling component is mounted. */
export function useNarrationClip(clip: NarrationClip | null | undefined): void {
  const { setClip } = useNarration();
  const audioId = clip?.audioId;
  const transcript = clip?.transcript;
  useEffect(() => {
    setClip(audioId ? { audioId, transcript: transcript ?? '' } : null);
    return () => setClip(null);
  }, [audioId, transcript, setClip]);
}
