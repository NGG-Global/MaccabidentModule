import { interpolate } from 'remotion';
import { Stage, useClock } from '../primitives';
import type { CommonProps, JourneyPropsT } from '../props';
import { color, font } from '../theme';

/**
 * S04 patient journey. With no active stage the path draws itself and the
 * five stages appear in order. With an active stage, the camera travels from
 * the overview to that stage; visited stages carry a check.
 */
export function Journey(props: JourneyPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, width, height, portrait } = c;
  const n = props.stages.length;
  const pts = props.stages.map((_, i) => {
    const k = i / (n - 1);
    return portrait
      ? { x: width * (0.5 + 0.26 * Math.sin(k * Math.PI * 2)), y: height * (0.12 + 0.76 * k) }
      : { x: width * (0.9 - 0.8 * k), y: height * (0.52 + 0.16 * Math.sin(k * Math.PI * 2)) };
  });
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1]!;
    return portrait
      ? `${acc} C ${prev.x} ${(prev.y + p.y) / 2}, ${p.x} ${(prev.y + p.y) / 2}, ${p.x} ${p.y}`
      : `${acc} C ${(prev.x + p.x) / 2} ${prev.y}, ${(prev.x + p.x) / 2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const activeIndex = props.stages.findIndex((s) => s.id === props.active);
  const overview = activeIndex < 0;
  const draw = overview ? c.progress(0.1, 2.2) : 1;

  // Camera: move from the overview to the active stage.
  const cam = overview ? 0 : c.move(0.15, { damping: 26, stiffness: 55 });
  const target = pts[Math.max(activeIndex, 0)]!;
  const zoom = 1 + (portrait ? 0.55 : 0.85) * cam;
  const tx = (width / 2 - target.x) * cam;
  const ty = (height / 2 - target.y) * cam;

  return (
    <Stage background={color.paper}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${tx}px, ${ty}px) scale(${zoom})`, transformOrigin: `${target.x}px ${target.y}px` }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <path d={d} fill="none" stroke={color.paperDeep} strokeWidth={10 * u} strokeLinecap="round" />
          <path d={d} fill="none" stroke={color.navy} strokeWidth={5 * u} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        </svg>
        {props.stages.map((stage, i) => {
          const p = pts[i]!;
          const appear = overview ? c.enter(0.4 + i * 0.35) : 1;
          const isActive = i === activeIndex;
          const visited = props.visited.includes(stage.id);
          const ring = isActive ? interpolate(Math.sin(c.t * 3), [-1, 1], [1, 1.12]) : 1;
          const r = (isActive ? 46 : 36) * u;
          return (
            <div key={stage.id} style={{ position: 'absolute', left: p.x, top: p.y, transform: `translate(-50%, -50%) scale(${appear})`, opacity: appear }}>
              {isActive && !c.reducedMotion && (
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: r * 2.8, height: r * 2.8, transform: `translate(-50%, -50%) scale(${ring})`, borderRadius: 999, border: `${3 * u}px solid ${color.violet}`, opacity: 0.5 }} />
              )}
              <div
                style={{
                  width: r * 2,
                  height: r * 2,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  background: isActive ? color.violet : visited ? color.navy : color.white,
                  color: isActive || visited ? color.white : color.navy,
                  border: `${4 * u}px solid ${isActive ? color.violet : color.navy}`,
                  fontFamily: font.display,
                  fontSize: (isActive ? 44 : 34) * u,
                  fontWeight: 700,
                }}
              >
                {visited && !isActive ? '✓' : stage.number}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: portrait ? '50%' : (i % 2 ? -1 : 1) * 0 + r * 2 + 18 * u,
                  [portrait ? (p.x > width / 2 ? 'right' : 'left') : 'left']: portrait ? r * 2 + 24 * u : '50%',
                  transform: portrait ? 'translateY(-50%)' : 'translateX(-50%)',
                  width: (portrait ? 330 : 300) * u,
                  textAlign: portrait ? (p.x > width / 2 ? 'left' : 'right') : 'center',
                  fontSize: (isActive ? 36 : 28) * u,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? color.navy : color.inkSoft,
                  lineHeight: 1.25,
                  opacity: overview || isActive ? 1 : 0.55,
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
