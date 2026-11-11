import { AbsoluteFill } from 'remotion';
import { Arc, MaskLine, Stage, useClock } from '../primitives';
import type { ChapterPropsT, CommonProps } from '../props';
import { color, font } from '../theme';

/** Chapter transition: outlined chapter number, title rising from a mask, the brand arc drawing through. */
export function Chapter(props: ChapterPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, portrait } = c;
  return (
    <Stage background={color.ink} style={{ color: color.white }}>
      <AbsoluteFill style={{ justifyContent: 'center', paddingInline: (portrait ? 90 : 180) * u }}>
        <div
          style={{
            fontFamily: font.display,
            fontSize: (portrait ? 300 : 360) * u,
            lineHeight: 0.9,
            color: 'transparent',
            WebkitTextStroke: `${2 * u}px ${color.violet}`,
            opacity: c.enter(0) * 0.9,
            transform: `translateY(${(1 - c.move(0, { damping: 30 })) * 40 * u}px)`,
          }}
        >
          {props.number}
        </div>
        <MaskLine p={c.enter(0.35)} m={c.move(0.35)} style={{ fontFamily: font.display, fontSize: 120 * u, fontWeight: 700, marginTop: 10 * u }}>
          {props.title}
        </MaskLine>
        {props.subtitle && (
          <MaskLine p={c.enter(0.7)} m={c.move(0.7)} style={{ fontSize: 44 * u, color: color.mist, marginTop: 8 * u }}>
            {props.subtitle}
          </MaskLine>
        )}
        <Arc draw={c.progress(0.4, 1.8)} width={420 * u} thickness={8} style={{ marginTop: 40 * u }} />
      </AbsoluteFill>
    </Stage>
  );
}
