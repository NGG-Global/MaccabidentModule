import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CommonProps } from './props';
import { color, font } from './theme';

/** Frame-accurate clock helpers shared by all compositions. */
export function useClock(reducedMotion: boolean) {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const portrait = height > width;
  /** 1 unit = 1px on a 1080-tall landscape frame (or 1080-wide portrait frame). */
  const u = (portrait ? width : height) / 1080;

  /** 0→1 entrance for a moment in seconds. Springs normally; a short fade under reduced motion. */
  const enter = (at: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) => {
    const start = Math.round(at * fps);
    if (frame < start) return 0;
    if (reducedMotion) return interpolate(frame - start, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
    return spring({ frame: frame - start, fps, config: { damping: 200, stiffness: 110, mass: 0.9, ...config } });
  };
  /** Movement amount: same as enter, but 1 (no travel) under reduced motion. */
  const move = (at: number, config?: Parameters<typeof enter>[1]) => (reducedMotion ? (frame >= at * fps ? 1 : 0) : enter(at, config));
  /** Opacity for something visible from `from` until `to` (seconds), with soft edges. */
  const window = (from: number, to: number, fade = 0.45) => {
    const e = enter(from);
    if (t < to - fade) return e;
    return e * interpolate(t, [to - fade, to], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  };
  /** Linear 0→1 progress between two times (for drawing lines and camera moves). */
  const progress = (from: number, to: number) =>
    interpolate(t, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return { frame, fps, t, width, height, portrait, u, durationInFrames, enter, move, window, progress, reducedMotion };
}

export type Clock = ReturnType<typeof useClock>;

/** Root of every composition: RTL, brand fonts, explicit background. */
export function Stage({ background, children, style }: { background: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <AbsoluteFill dir="rtl" style={{ background, fontFamily: font.sans, color: color.ink, overflow: 'hidden', ...style }}>
      {children}
    </AbsoluteFill>
  );
}

/** Text that rises out of a mask. `p` comes from clock.enter; `m` from clock.move. */
export function MaskLine({
  p,
  m,
  children,
  style,
  distance = 1.05,
}: {
  p: number;
  m: number;
  children: ReactNode;
  style?: CSSProperties;
  distance?: number;
}) {
  return (
    <div style={{ overflow: 'hidden', paddingBlock: '0.08em', ...style }}>
      <div style={{ transform: `translateY(${(1 - m) * distance * 100}%)`, opacity: p }}>{children}</div>
    </div>
  );
}

/** Word-by-word reveal with a small stagger; each word rises from its own mask. */
export function Words({ text, at, clock, stagger = 0.07, style }: { text: string; at: number; clock: Clock; stagger?: number; style?: CSSProperties }) {
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.28em', ...style }}>
      {words.map((word, i) => (
        <MaskLine key={`${word}-${i}`} p={clock.enter(at + i * stagger)} m={clock.move(at + i * stagger)} style={{ paddingBlock: '0.12em' }}>
          {word}
        </MaskLine>
      ))}
    </div>
  );
}

/** The swoosh from the Maccabident logo, drawn as a stroke. `draw` is 0→1. */
export function Arc({ draw, width, stroke = color.violet, thickness = 10, style }: { draw: number; width: number; stroke?: string; thickness?: number; style?: CSSProperties }) {
  const length = 1000;
  return (
    <svg viewBox="0 0 700 170" width={width} height={(width * 170) / 700} style={{ overflow: 'visible', ...style }} aria-hidden>
      <path
        d="M 12 150 C 210 40, 470 -10, 640 40 C 690 56, 700 110, 660 160"
        fill="none"
        stroke={stroke}
        strokeWidth={thickness}
        strokeLinecap="round"
        pathLength={length}
        strokeDasharray={length}
        strokeDashoffset={length * (1 - draw)}
      />
    </svg>
  );
}

/** Photograph with a slow camera push and an optional clip reveal (0→1). */
export function Photo({
  src,
  clock,
  reveal = 1,
  from = 1.04,
  to = 1.12,
  driftX = 0,
  focus = '50% 50%',
  style,
  filter,
}: {
  src: string | undefined;
  clock: Clock;
  reveal?: number;
  from?: number;
  to?: number;
  driftX?: number;
  focus?: string;
  style?: CSSProperties;
  filter?: string;
}) {
  const k = clock.reducedMotion ? 0 : clock.frame / Math.max(clock.durationInFrames, 1);
  const scale = from + (to - from) * k;
  const inset = (1 - reveal) * 50;
  return (
    <div style={{ position: 'absolute', overflow: 'hidden', clipPath: `inset(${inset}% 0 ${inset}% 0)`, ...style }}>
      {src ? (
        <img
          src={src}
          alt=""
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: focus,
            transform: `scale(${scale}) translateX(${driftX * k}%)`,
            filter,
          }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: color.inkSoft }} />
      )}
    </div>
  );
}

export const url = (props: CommonProps, id: string) => props.mediaUrls[id];

/** Index of the timed item active at time t (last one whose `at` has passed), or -1. */
export function activeIndex(items: { at: number }[], t: number) {
  let index = -1;
  items.forEach((item, i) => {
    if (t >= item.at) index = i;
  });
  return index;
}
