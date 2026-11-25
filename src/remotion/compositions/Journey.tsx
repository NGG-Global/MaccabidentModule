import { interpolate } from 'remotion';
import { Stage, useClock } from '../primitives';
import type { CommonProps, JourneyPropsT } from '../props';
import { CYCLE_RADIUS, cycleArc, cyclePoint, labelSide } from '../cycle';
import { color, font, logoGradient } from '../theme';

const NODE = 0.15;

/**
 * S04 patient journey as a repeating cycle. With no active stage the ring
 * draws itself and the five stages appear in order, the fifth leading back
 * to the first. With an active stage, that stage is highlighted; visited
 * stages carry a check. Geometry is shared with the interactive navigator.
 */
export function Journey(props: JourneyPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, width, height, portrait } = c;
  const n = props.stages.length;
  // Portrait frames are shown small on phones: a smaller ring leaves room for larger labels.
  const box = portrait ? width * 0.52 : Math.min(width, height) * 0.86;
  const left = (width - box) / 2;
  const top = (height - box) / 2;

  const activeIndex = props.stages.findIndex((s) => s.id === props.active);
  const overview = activeIndex < 0;
  const gradient = `linear-gradient(to right, ${logoGradient.join(', ')})`;

  return (
    <Stage background={color.paper}>
      <div style={{ position: 'absolute', left, top, width: box, height: box }}>
        <svg viewBox="0 0 100 100" width={box} height={box} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
          <circle cx="50" cy="50" r={CYCLE_RADIUS * 100} fill="none" stroke={color.paperDeep} strokeWidth={2.2} />
          {props.stages.map((s, i) => {
            const draw = overview ? c.progress(0.3 + i * 0.4, 0.8 + i * 0.4) : 1;
            const done = props.visited.includes(s.id);
            return (
              <path
                key={s.id}
                d={cycleArc(i, n, NODE)}
                fill="none"
                stroke={color.navy}
                strokeOpacity={done || overview ? 0.9 : 0.4}
                strokeWidth={1.2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - draw}
              />
            );
          })}
          {/* Arrowheads, at the end of each arc once it is drawn. */}
          {props.stages.map((s, i) => {
            const to = cyclePoint(i + 1, n);
            const shown = overview ? c.enter(0.75 + i * 0.4) : 1;
            const a = Math.atan2(to.y - 0.5, to.x - 0.5) + Math.asin(NODE / 2 / CYCLE_RADIUS) + 0.09;
            const x = 50 + CYCLE_RADIUS * 100 * Math.cos(a);
            const y = 50 + CYCLE_RADIUS * 100 * Math.sin(a);
            const deg = (a * 180) / Math.PI - 90;
            return <path key={s.id} d="M -1.6 -1.6 L 0 0 L -1.6 1.6" transform={`translate(${x} ${y}) rotate(${deg})`} fill="none" stroke={color.navy} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" opacity={shown * 0.85} />;
          })}
          <g transform="translate(50 50)" stroke={color.violet} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={overview ? c.enter(2.4) * 0.8 : 0.8}>
            <path d="M -7 -3.5 A 8 8 0 0 1 7 -3.5" />
            <path d="M 7 -3.5 l 0.4 -3.6 M 7 -3.5 l -3.5 -0.9" />
            <path d="M 7 3.5 A 8 8 0 0 1 -7 3.5" />
            <path d="M -7 3.5 l -0.4 3.6 M -7 3.5 l 3.5 0.9" />
          </g>
        </svg>

        {props.stages.map((stage, i) => {
          const p = cyclePoint(i, n);
          const appear = overview ? c.enter(0.2 + i * 0.4) : 1;
          const isActive = i === activeIndex;
          const visited = props.visited.includes(stage.id);
          const pulse = isActive && !c.reducedMotion ? interpolate(Math.sin(c.t * 2.6), [-1, 1], [1, 1.07]) : 1;
          const d = box * NODE * (isActive ? 1.15 : 1);
          const side = labelSide(i, n);
          const labelW = (portrait ? 270 : 300) * u;
          const gap = 22 * u;
          const labelStyle =
            side === 'top'
              ? { bottom: d + gap, left: d / 2 - labelW / 2, textAlign: 'center' as const }
              : side === 'left'
                ? { right: d + gap, top: d / 2, transform: 'translateY(-50%)', textAlign: 'right' as const }
                : { left: d + gap, top: d / 2, transform: 'translateY(-50%)', textAlign: 'left' as const };
          return (
            <div key={stage.id} style={{ position: 'absolute', left: p.x * box - d / 2, top: p.y * box - d / 2, width: d, height: d, opacity: appear, transform: `scale(${appear})` }}>
              {isActive && <div style={{ position: 'absolute', inset: -9 * u, borderRadius: 999, background: gradient, transform: `scale(${pulse})` }} />}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  background: isActive ? color.violetInk : visited ? color.navy : color.white,
                  color: isActive || visited ? color.white : color.navy,
                  border: isActive ? `${4 * u}px solid ${color.white}` : `${4 * u}px ${visited ? 'solid' : 'dashed'} ${color.navy}`,
                  fontFamily: font.display,
                  fontSize: d * 0.42,
                  fontWeight: 700,
                }}
              >
                {visited && !isActive ? '✓' : stage.number}
              </div>
              <div
                style={{
                  position: 'absolute',
                  width: labelW,
                  ...labelStyle,
                  fontSize: (portrait ? (isActive ? 46 : 42) : isActive ? 36 : 30) * u,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? color.navy : color.inkSoft,
                  lineHeight: 1.2,
                  opacity: overview || isActive ? 1 : 0.6,
                }}
              >
                {stage.title}
              </div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
}
