import { AbsoluteFill, interpolate } from 'remotion';
import { Arc, MaskLine, Photo, Stage, Words, activeIndex, url, useClock, type Clock } from '../primitives';
import type { CommonProps, ValueAccompanyingPropsT, ValueAdaptingPropsT, ValueSeeingPropsT, ValuesIntroPropsT } from '../props';
import { color, font } from '../theme';

/** Small emblem per value, reused in the introduction so each treatment is foreshadowed. */
function Emblem({ index, draw, size }: { index: number; draw: number; size: number }) {
  const common = { fill: 'none', stroke: color.violet, strokeWidth: 3, strokeLinecap: 'round' as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw };
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden>
      {index === 0 && (
        <>
          <circle cx="30" cy="30" r="24" {...common} />
          <circle cx="30" cy="30" r="9" {...common} />
        </>
      )}
      {index === 1 && (
        <>
          <path d="M6 14 C 26 14, 30 30, 54 30" {...common} />
          <path d="M6 46 C 26 46, 30 30, 54 30" {...common} />
        </>
      )}
      {index === 2 && (
        <>
          <path d="M4 40 C 18 10, 32 52, 56 20" {...common} />
          {[4, 30, 56].map((x, i) => (
            <circle key={x} cx={x} cy={[40, 31, 20][i]} r={3.5 * draw} fill={color.violet} />
          ))}
        </>
      )}
    </svg>
  );
}

export function ValuesIntro(props: ValuesIntroPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, t, portrait } = c;
  const showValues = t >= props.values[0]!.at - 0.2;
  return (
    <Stage background={color.ink} style={{ color: color.white }}>
      <AbsoluteFill style={{ justifyContent: 'center', paddingInline: (portrait ? 80 : 170) * u, gap: 40 * u }}>
        {!showValues ? (
          <div style={{ opacity: c.window(0, props.values[0]!.at - 0.2, 0.4) }}>
            <Arc draw={c.progress(props.title.at - 0.6, props.title.at + 0.8)} width={260 * u} thickness={9} />
            <MaskLine p={c.enter(props.title.at)} m={c.move(props.title.at)} style={{ fontFamily: font.display, fontSize: 150 * u, fontWeight: 700, marginTop: 16 * u }}>
              {props.title.text}
            </MaskLine>
            <Words text={props.lead.text} at={props.lead.at} clock={c} style={{ fontSize: 50 * u, color: color.mist, marginTop: 20 * u }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 34 * u }}>
            {props.values.map((v, i) => {
              const dim = t >= props.outro.at ? 0.5 : 1;
              return (
                <div key={v.at} style={{ display: 'flex', alignItems: 'center', gap: 36 * u, opacity: c.enter(v.at) * dim }}>
                  <span style={{ fontFamily: font.display, fontSize: 50 * u, color: color.violet, width: 80 * u }}>{String(i + 1).padStart(2, '0')}</span>
                  <Emblem index={i} draw={c.progress(v.at, v.at + 1)} size={90 * u} />
                  <MaskLine p={c.enter(v.at)} m={c.move(v.at)} style={{ fontFamily: font.display, fontSize: (portrait ? 84 : 104) * u, fontWeight: 700 }}>
                    {v.text}
                  </MaskLine>
                </div>
              );
            })}
            {t >= props.outro.at && <Words text={props.outro.text} at={props.outro.at} clock={c} style={{ fontSize: 46 * u, color: color.mist, marginTop: 30 * u }} />}
          </div>
        )}
      </AbsoluteFill>
    </Stage>
  );
}

function ValueHeader({ number, name, c, light }: { number: string; name: string; c: Clock; light?: boolean }) {
  const { u } = c;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 * u }}>
      <span style={{ fontFamily: font.display, fontSize: 56 * u, color: color.violet }}>{number.padStart(2, '0')}</span>
      <MaskLine p={c.enter(0)} m={c.move(0)} style={{ fontFamily: font.display, fontSize: 96 * u, fontWeight: 700, color: light ? color.white : color.navy }}>
        {name}
      </MaskLine>
    </div>
  );
}

/** "רואים אותך": a lens of attention finds the patient in a dimmed room, then the whole scene comes into focus. */
export function ValueSeeing(props: ValueSeeingPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, t, portrait } = c;
  const a0 = props.actions[0]!.at;
  const radius =
    t < a0 ? 0 : t < props.closing.at ? 15 + 8 * activeIndex(props.actions, t) : interpolate(c.move(props.closing.at, { damping: 40, stiffness: 30 }), [0, 1], [31, 120]);
  const lensIn = c.move(a0, { damping: 18, stiffness: 90 });
  const r = t < a0 ? 0 : t < props.closing.at ? radius * lensIn : radius;
  const src = url(props, props.photoId);
  const example = activeIndex(props.examples, t);
  return (
    <Stage background={color.ink} style={{ color: color.white }}>
      <Photo src={src} clock={c} style={{ inset: 0 }} filter="blur(10px) brightness(0.42) saturate(0.6)" />
      <div style={{ position: 'absolute', inset: 0, clipPath: `circle(${r}% at ${portrait ? '50% 34%' : '36% 46%'})` }}>
        <Photo src={src} clock={c} style={{ inset: 0 }} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: portrait ? '100%' : '50%',
          padding: `${(portrait ? 640 : 110) * u}px ${(portrait ? 70 : 100) * u}px ${70 * u}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 30 * u,
          background: portrait ? 'none' : 'linear-gradient(to left, rgba(11,31,58,0.92) 55%, rgba(11,31,58,0))',
        }}
      >
        <ValueHeader number={props.number} name={props.name} c={c} light />
        <Words text={props.lead.text} at={props.lead.at} clock={c} style={{ fontSize: 44 * u, color: color.mist, lineHeight: 1.3 }} />
        <div style={{ display: 'flex', gap: 22 * u, flexWrap: 'wrap' }}>
          {props.actions.map((a, i) => (
            <span key={a.at} style={{ display: 'flex', alignItems: 'center', gap: 22 * u, fontSize: 46 * u, fontWeight: 700, opacity: c.enter(a.at) }}>
              {i > 0 && <span style={{ width: 10 * u, height: 10 * u, borderRadius: 99, background: color.violet }} />}
              {a.text}
            </span>
          ))}
        </div>
        {example >= 0 && t < props.closing.at && (
          <div key={example} style={{ marginTop: 20 * u, opacity: c.window(props.examples[example]!.at, props.examples[example + 1]?.at ?? props.closing.at, 0.4) }}>
            {props.examples[example]!.text.split('|').map((part, i) => (
              <div key={part} style={{ display: 'flex', gap: 20 * u, alignItems: 'flex-start', marginTop: i ? 18 * u : 0, opacity: c.enter(props.examples[example]!.at + i * 1.6) }}>
                <span style={{ fontSize: 32 * u, fontWeight: 600, color: i ? color.violet : color.mist, minWidth: 140 * u, paddingTop: 8 * u }}>{i ? 'מה עושים' : 'המצב'}</span>
                <span style={{ fontSize: (i ? 44 : 40) * u, fontWeight: i ? 700 : 400, lineHeight: 1.3 }}>{part}</span>
              </div>
            ))}
          </div>
        )}
        {t >= props.closing.at && <Words text={props.closing.text} at={props.closing.at + 0.3} clock={c} style={{ fontFamily: font.display, fontSize: 64 * u, lineHeight: 1.2, marginTop: 20 * u }} />}
      </div>
    </Stage>
  );
}

/** "מתאמצים למענך": each need takes a different measure; the service adjusts to fit, within clear boundaries. */
export function ValueAdapting(props: ValueAdaptingPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, t, portrait } = c;
  const phase2 = t >= props.actions[0]!.at;
  const widths = [38, 86, 62];
  return (
    <Stage background={color.paper}>
      <div
        style={{
          position: 'absolute',
          right: (portrait ? 60 : 90) * u,
          top: (portrait ? 60 : 90) * u,
          width: portrait ? `calc(100% - ${120 * u}px)` : '34%',
          height: portrait ? '38%' : `calc(100% - ${180 * u}px)`,
          borderRadius: 18 * u,
          overflow: 'hidden',
        }}
      >
        <Photo src={url(props, props.photoId)} clock={c} reveal={c.move(0, { damping: 40, stiffness: 50 })} from={1.05} to={1.16} focus="50% 35%" style={{ inset: 0 }} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: (portrait ? 60 : 110) * u,
          right: portrait ? 60 * u : `calc(34% + ${190 * u}px)`,
          top: portrait ? '44%' : 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 34 * u,
        }}
      >
        <ValueHeader number={props.number} name={props.name} c={c} />
        {!phase2 ? (
          <>
            <Words text={props.lead.text} at={props.lead.at} clock={c} style={{ fontSize: 46 * u, color: color.inkSoft }} />
            {props.needs.map((n, i) => (
              <div key={n.at} style={{ opacity: c.enter(n.at) }}>
                <div style={{ fontSize: 42 * u, fontWeight: 600, marginBottom: 12 * u }}>{n.text}</div>
                <div style={{ height: 14 * u, background: color.paperDeep, borderRadius: 14 * u }}>
                  <div style={{ height: '100%', borderRadius: 14 * u, width: `${widths[i]! * c.move(n.at + 0.2, { damping: 16, stiffness: 70 })}%`, background: [color.sky, color.violet, color.navy][i] }} />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 * u }}>
              {props.actions.map((a) => (
                <Words key={a.at} text={a.text} at={a.at} clock={c} style={{ fontFamily: font.display, fontSize: 70 * u, fontWeight: 600, color: color.navy, lineHeight: 1.1 }} />
              ))}
            </div>
            <div style={{ opacity: c.enter(props.boundary.at), display: 'flex', alignItems: 'center', gap: 22 * u, marginTop: 10 * u }}>
              <span style={{ width: 70 * u * c.progress(props.boundary.at, props.boundary.at + 0.6), height: 4 * u, background: color.inkSoft }} />
              <span style={{ fontSize: 40 * u, color: color.inkSoft }}>{props.boundary.text}</span>
            </div>
            {t >= props.closing.at && <Words text={props.closing.text} at={props.closing.at} clock={c} style={{ fontSize: 46 * u, fontWeight: 700, color: color.ink, lineHeight: 1.3 }} />}
          </>
        )}
      </div>
    </Stage>
  );
}

/** "מלווים אותך לאורך הדרך": one continuous line connects every encounter, reaching each step as it is spoken. */
export function ValueAccompanying(props: ValueAccompanyingPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, t, portrait, width, height } = c;
  const n = props.steps.length;
  // Node positions: right→left in landscape (RTL reading order), top→bottom in portrait.
  const pts = props.steps.map((_, i) => {
    const k = n === 1 ? 0.5 : i / (n - 1);
    return portrait
      ? { x: width * (0.2 + 0.18 * Math.sin(k * Math.PI * 2)), y: height * (0.36 + k * 0.52) }
      : { x: width * (0.88 - k * 0.76), y: height * (0.6 + 0.09 * Math.sin(k * Math.PI * 2.2)) };
  });
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1]!;
    const mx = (prev.x + p.x) / 2;
    const my = (prev.y + p.y) / 2;
    return portrait ? `${acc} Q ${prev.x + (p.x - prev.x) * 0.1} ${my} ${p.x} ${p.y}` : `${acc} Q ${mx} ${prev.y} ${p.x} ${p.y}`;
  }, '');
  // Piecewise drawing: the line arrives at node i exactly when step i is spoken.
  const times = props.steps.map((s) => s.at);
  const drawn = t < times[0]! ? 0 : t >= times[n - 1]! ? 1 : (() => {
    const i = activeIndex(props.steps, t);
    const from = times[i]!;
    const to = times[i + 1]!;
    return (i + interpolate(t, [from, to - 0.25], [0, 1], { extrapolateRight: 'clamp' })) / (n - 1);
  })();
  const reached = activeIndex(props.steps, t);
  return (
    <Stage background={color.navy} style={{ color: color.white }}>
      <div style={{ position: 'absolute', top: 90 * u, right: 110 * u, left: 110 * u, display: 'flex', flexDirection: 'column', gap: 20 * u }}>
        <ValueHeader number={props.number} name={props.name} c={c} light />
        {t < props.closing.at ? (
          <Words text={props.lead.text} at={props.lead.at} clock={c} style={{ fontSize: 42 * u, color: color.mist, maxWidth: 1200 * u }} />
        ) : (
          <Words text={props.closing.text} at={props.closing.at} clock={c} style={{ fontFamily: font.display, fontSize: 58 * u, maxWidth: 1300 * u }} />
        )}
      </div>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path d={d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={4 * u} strokeDasharray={`${2 * u} ${12 * u}`} strokeLinecap="round" />
        <path d={d} fill="none" stroke={color.white} strokeWidth={5 * u} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} />
        {pts.map((p, i) => (
          <g key={i} opacity={i <= reached ? 1 : 0.35}>
            <circle cx={p.x} cy={p.y} r={(i <= reached ? 16 : 10) * u} fill={i <= reached ? color.violet : color.navy} stroke={color.white} strokeWidth={3 * u} />
          </g>
        ))}
      </svg>
      {props.steps.map((s, i) => {
        const p = pts[i]!;
        const above = !portrait && i % 2 === 1;
        return (
          <div
            key={s.at}
            style={{
              position: 'absolute',
              left: portrait ? p.x + 50 * u : p.x - 180 * u,
              top: portrait ? p.y - 30 * u : above ? p.y - 190 * u : p.y + 50 * u,
              width: portrait ? width - p.x - 110 * u : 360 * u,
              textAlign: portrait ? 'right' : 'center',
              fontSize: 42 * u,
              lineHeight: 1.25,
              fontWeight: i === reached ? 700 : 400,
              opacity: c.enter(s.at) * (i === reached ? 1 : 0.7),
              transform: `translateY(${(1 - c.move(s.at)) * 20 * u}px)`,
            }}
          >
            {s.text}
          </div>
        );
      })}
      {t >= props.closing.at && (
        <div
          style={{
            position: 'absolute',
            width: 230 * u,
            height: 230 * u,
            left: pts[n - 1]!.x - 115 * u,
            top: pts[n - 1]!.y - (portrait ? 300 : 280) * u,
            borderRadius: 999,
            overflow: 'hidden',
            border: `${5 * u}px solid ${color.white}`,
            opacity: c.enter(props.closing.at),
            transform: `scale(${0.8 + 0.2 * c.move(props.closing.at)})`,
          }}
        >
          <Photo src={url(props, props.photoId)} clock={c} style={{ inset: 0 }} focus="40% 40%" />
        </div>
      )}
    </Stage>
  );
}
