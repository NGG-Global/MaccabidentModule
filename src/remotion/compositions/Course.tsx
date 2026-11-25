import { AbsoluteFill, interpolate } from 'remotion';
import { Arc, MaskLine, Photo, Stage, Words, activeIndex, url, useClock, type Clock } from '../primitives';
import type { AssessmentResultPropsT, ClosingPropsT, CommonProps, MeasurementPropsT, ScenarioFeedbackPropsT, ScenarioIntroPropsT } from '../props';
import { color, font } from '../theme';
import { Emblem } from './Values';

const VALUE_ORDER = ['רואים אותך', 'מתאמצים למענך', 'מלווים אותך לאורך הדרך'];

/**
 * Scenario introduction, driven by the situation narration: a case file.
 * A thin rule fills with the narration; each line of the situation takes the
 * light as it is spoken while earlier lines step back.
 */
export function ScenarioIntro(props: ScenarioIntroPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, t, portrait, durationInFrames, fps } = c;
  const current = activeIndex(props.lines, t);
  const hasPhoto = Boolean(props.photoId && url(props, props.photoId));
  const textWidth = portrait ? '100%' : hasPhoto ? '44%' : '70%';
  return (
    <Stage background={color.ink} style={{ color: color.white }}>
      {hasPhoto ? (
        <div style={{ position: 'absolute', left: 0, top: 0, width: portrait ? '100%' : '56%', height: portrait ? '50%' : '100%' }}>
          <Photo src={url(props, props.photoId!)} clock={c} reveal={c.move(0.1, { damping: 40, stiffness: 40 })} from={1.06} to={1.16} style={{ inset: 0 }} filter="saturate(0.85)" />
          <div style={{ position: 'absolute', inset: 0, background: portrait ? `linear-gradient(to top, ${color.ink}, transparent 45%)` : `linear-gradient(to left, ${color.ink}, transparent 35%)` }} />
        </div>
      ) : (
        // Without a photograph: the place set large in outline, behind the text.
        <div
          style={{
            position: 'absolute',
            left: 60 * u,
            bottom: 40 * u,
            fontFamily: font.display,
            fontSize: (portrait ? 220 : 300) * u,
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: `${1.5 * u}px ${color.violet}73`,
            opacity: c.enter(0.2),
            transform: `translateX(${(c.reducedMotion ? 0 : c.progress(0, durationInFrames / fps)) * -3}%)`,
          }}
          aria-hidden
        >
          {props.place}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: portrait ? '50%' : 0,
          bottom: 0,
          width: textWidth,
          padding: `${(portrait ? 40 : 110) * u}px ${(portrait ? 70 : 110) * u}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: portrait ? 'flex-start' : 'center',
          gap: 22 * u,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 * u, opacity: c.enter(0) }}>
          <span style={{ fontSize: 30 * u, fontWeight: 700, color: color.violet, letterSpacing: '0.02em' }}>{props.caseLabel}</span>
          <span style={{ flex: 1, height: 3 * u, background: 'rgba(255,255,255,0.15)', borderRadius: 3 * u, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${c.progress(0, durationInFrames / fps) * 100}%`, background: color.violet }} />
          </span>
        </div>
        <MaskLine p={c.enter(0.15)} m={c.move(0.15)} style={{ fontFamily: font.display, fontSize: (portrait ? 78 : 84) * u, fontWeight: 700, lineHeight: 1.05 }}>
          {props.place}
        </MaskLine>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 * u, marginTop: 10 * u }}>
          {props.lines.map((line, i) =>
            t >= line.at ? (
              <div key={line.at} style={{ opacity: i === current ? 1 : 0.45, borderInlineStart: `${4 * u}px solid ${i === current ? color.violet : 'transparent'}`, paddingInlineStart: 22 * u }}>
                <Words text={line.text} at={line.at} clock={c} style={{ fontSize: (i === current ? 46 : 38) * u, lineHeight: 1.3 }} />
              </div>
            ) : null,
          )}
        </div>
      </div>
    </Stage>
  );
}

function VerdictMark({ verdict, c, size }: { verdict: ScenarioFeedbackPropsT['verdict']; c: Clock; size: number }) {
  const draw = c.progress(0.15, 0.9);
  const preferred = verdict === 'preferred';
  const ring = preferred ? color.navy : color.inkSoft;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="30" cy="30" r="26" fill="none" stroke={ring} strokeWidth="3" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      {preferred ? (
        <path d="M18 31 L27 40 L43 22" fill="none" stroke={color.violet} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - c.progress(0.6, 1.2)} />
      ) : (
        // Not a cross: a turning arrow — "think again", not "you failed".
        <path d="M40 22 A 13 13 0 1 0 43 33 M40 14 L40 22 L32 22" fill="none" stroke={color.violet} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - c.progress(0.6, 1.3)} />
      )}
    </svg>
  );
}

/** Answer-specific feedback, driven by its narration: verdict, the principle in points, and the value it expresses. */
export function ScenarioFeedback(props: ScenarioFeedbackPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, t, portrait } = c;
  const reached = activeIndex(props.points, t);
  return (
    <Stage background={color.paper}>
      <AbsoluteFill style={{ padding: `${(portrait ? 80 : 100) * u}px ${(portrait ? 70 : 140) * u}px`, justifyContent: 'center', gap: 40 * u }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34 * u }}>
          <VerdictMark verdict={props.verdict} c={c} size={(portrait ? 110 : 130) * u} />
          <Words text={props.headline.text} at={props.headline.at} clock={c} style={{ fontFamily: font.display, fontSize: (portrait ? 72 : 86) * u, fontWeight: 700, color: color.navy, lineHeight: 1.1 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 * u, paddingInlineStart: (portrait ? 0 : 164) * u }}>
          {props.points.map((p, i) => (
            <div key={p.at} style={{ display: 'flex', alignItems: 'baseline', gap: 24 * u, opacity: c.enter(p.at) * (i <= reached ? 1 : 0) }}>
              <span style={{ fontFamily: font.display, fontSize: 40 * u, color: color.violet, width: 56 * u }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ position: 'relative', fontSize: (portrait ? 46 : 52) * u, fontWeight: 600, color: color.ink }}>
                <MaskLine p={c.enter(p.at)} m={c.move(p.at)}>
                  {p.text}
                </MaskLine>
                <span style={{ position: 'absolute', insetInlineStart: 0, bottom: -4 * u, height: 4 * u, width: `${c.progress(p.at + 0.3, p.at + 1) * 100}%`, background: color.paperDeep, borderRadius: 4 * u }} />
              </span>
            </div>
          ))}
        </div>
        {props.values && t >= props.values.at && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 * u, paddingInlineStart: (portrait ? 0 : 164) * u, opacity: c.enter(props.values.at) }}>
            {props.values.names.map((name, i) => (
              <span
                key={name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 14 * u,
                  background: color.ink,
                  color: color.white,
                  borderRadius: 999,
                  padding: `${10 * u}px ${28 * u}px ${10 * u}px ${18 * u}px`,
                  fontSize: 36 * u,
                  fontWeight: 600,
                  transform: `translateY(${(1 - c.move(props.values!.at + i * 0.25)) * 24 * u}px)`,
                }}
              >
                <Emblem index={Math.max(0, VALUE_ORDER.indexOf(name))} draw={c.progress(props.values!.at + i * 0.25, props.values!.at + 1 + i * 0.25)} size={48 * u} />
                {name}
              </span>
            ))}
          </div>
        )}
      </AbsoluteFill>
    </Stage>
  );
}

/** One small illustration per measurement mechanism, drawn in the brand line style. */
function MeasureFigure({ kind, at, c, size }: { kind: MeasurementPropsT['sections'][number]['kind']; at: number; c: Clock; size: number }) {
  const p = (from: number, to: number) => c.progress(at + from, at + to);
  const stroke = { fill: 'none', stroke: color.navy, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      {kind === 'survey' && (
        <>
          <rect x="30" y="10" width="60" height="100" rx="10" {...stroke} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p(0, 0.8)} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} transform={`translate(${36 + i * 10} 36) scale(0.42)`} d="M10 0 L13 7 L20 7.5 L14.5 12 L16.5 19 L10 15 L3.5 19 L5.5 12 L0 7.5 L7 7 Z" fill={c.t >= at + 0.9 + i * 0.25 ? color.violet : 'none'} stroke={color.violet} strokeWidth="2" />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={i} x="40" y={58 + i * 14} height="6" rx="3" width={40 * p(1.6 + i * 0.3, 2.4 + i * 0.3)} fill={i === 1 ? color.sky : color.mist} />
          ))}
        </>
      )}
      {kind === 'shopper' && (
        <>
          <path d="M10 95 C 35 95, 30 55, 60 55 S 85 20, 110 20" {...stroke} strokeDasharray="3 6" />
          {[
            [10, 95],
            [60, 55],
            [110, 20],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="6" fill={c.t >= at + 0.6 + i * 0.9 ? color.navy : color.paper} stroke={color.navy} strokeWidth="2.5" />
          ))}
          {(() => {
            const k = p(0.4, 2.6);
            const x = interpolate(k, [0, 0.5, 1], [10, 60, 110]);
            const y = interpolate(k, [0, 0.5, 1], [95, 55, 20]);
            return <circle cx={x} cy={y - 14} r="8" fill={color.violet} />;
          })()}
        </>
      )}
      {kind === 'observation' && (
        <>
          <rect x="14" y="14" width="92" height="92" rx="10" {...stroke} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p(0, 0.8)} />
          <line x1="60" y1="24" x2="60" y2="96" stroke={color.mist} strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <path key={`s${i}`} d={`M70 ${36 + i * 22} l6 6 l12 -12`} {...stroke} stroke={color.navy} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p(0.9 + i * 0.35, 1.3 + i * 0.35)} />
          ))}
          {[0, 1].map((i) => (
            <path key={`o${i}`} d={`M30 ${42 + i * 24} h16 M38 ${34 + i * 24} v16`} {...stroke} stroke={color.violet} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p(2 + i * 0.4, 2.4 + i * 0.4)} />
          ))}
        </>
      )}
      {kind === 'trafficLight' && (
        <>
          <rect x="40" y="6" width="40" height="108" rx="20" {...stroke} />
          {['#D64545', '#E8B22E', '#2E9E5B'].map((fill, i) => (
            <circle key={fill} cx="60" cy={28 + i * 32} r="12" fill={c.t >= at + 0.8 + i * 0.9 ? fill : color.paperDeep} />
          ))}
        </>
      )}
    </svg>
  );
}

/** S07: how service is measured and improved — four mechanisms, then the loop that connects them. */
export function Measurement(props: MeasurementPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, t, portrait } = c;
  const current = activeIndex(props.sections, t);
  const inLoop = t >= props.loop.at;
  return (
    <Stage background={color.paper}>
      {!inLoop &&
        props.sections.map((section, i) => {
          if (i !== current) return null;
          const end = props.sections[i + 1]?.at ?? props.loop.at;
          return (
            <AbsoluteFill
              key={section.kind}
              style={{ flexDirection: portrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 90 * u, padding: 100 * u, opacity: c.window(section.at, end, 0.45) }}
            >
              <div style={{ transform: `scale(${0.9 + 0.1 * c.move(section.at)})` }}>
                <MeasureFigure kind={section.kind} at={section.at} c={c} size={(portrait ? 380 : 440) * u} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 * u, maxWidth: (portrait ? 900 : 860) * u }}>
                <span dir="ltr" style={{ alignSelf: 'flex-end', fontSize: 30 * u, fontWeight: 700, color: color.violet }}>{`${String(i + 1).padStart(2, '0')} / ${String(props.sections.length).padStart(2, '0')}`}</span>
                <MaskLine p={c.enter(section.at + 0.1)} m={c.move(section.at + 0.1)} style={{ fontFamily: font.display, fontSize: 92 * u, fontWeight: 700, color: color.navy, lineHeight: 1.05 }}>
                  {section.title}
                </MaskLine>
                {section.lines.map((line, j) => (
                  <Words key={line} text={line} at={section.at + 0.8 + j * 1.2} clock={c} style={{ fontSize: 46 * u, color: color.inkSoft, lineHeight: 1.3 }} />
                ))}
              </div>
            </AbsoluteFill>
          );
        })}
      {inLoop && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: c.enter(props.loop.at) }}>
          {(() => {
            const r = (portrait ? 330 : 360) * u;
            const spin = c.reducedMotion ? 0 : c.progress(props.loop.at, props.loop.at + 8) * 40;
            return (
              <>
                <svg width={r * 2 + 80 * u} height={r * 2 + 80 * u} style={{ position: 'absolute' }} aria-hidden>
                  <circle cx={r + 40 * u} cy={r + 40 * u} r={r} fill="none" stroke={color.mist} strokeWidth={6 * u} />
                  <circle
                    cx={r + 40 * u}
                    cy={r + 40 * u}
                    r={r}
                    fill="none"
                    stroke={color.violet}
                    strokeWidth={6 * u}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - c.progress(props.loop.at, props.loop.at + 2.2)}
                    transform={`rotate(${-90 + spin} ${r + 40 * u} ${r + 40 * u})`}
                  />
                </svg>
                {props.sections.map((s, i) => {
                  const angle = (i / props.sections.length) * Math.PI * 2 - Math.PI / 2;
                  return (
                    <div
                      key={s.kind}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(${Math.cos(angle) * r - 70 * u}px, ${Math.sin(angle) * r - 70 * u}px)`,
                        width: 140 * u,
                        height: 140 * u,
                        borderRadius: 999,
                        background: color.white,
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: `0 ${12 * u}px ${40 * u}px rgba(11,31,58,0.12)`,
                        opacity: c.enter(props.loop.at + 0.3 + i * 0.3),
                      }}
                    >
                      <MeasureFigure kind={s.kind} at={-10} c={c} size={96 * u} />
                    </div>
                  );
                })}
                <div style={{ textAlign: 'center', maxWidth: r * 1.3 }}>
                  <MaskLine p={c.enter(props.loop.at + 0.8)} m={c.move(props.loop.at + 0.8)} style={{ fontFamily: font.display, fontSize: 76 * u, fontWeight: 700, color: color.navy, lineHeight: 1.1 }}>
                    {props.loop.title}
                  </MaskLine>
                  <Words text={props.loop.line} at={props.loop.at + 1.6} clock={c} style={{ justifyContent: 'center', fontSize: 38 * u, color: color.inkSoft, marginTop: 14 * u }} />
                </div>
              </>
            );
          })()}
        </AbsoluteFill>
      )}
    </Stage>
  );
}

/** S08 result: the score fills a ring past (or short of) the pass mark. */
export function AssessmentResult(props: AssessmentResultPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, portrait } = c;
  const k = c.reducedMotion ? 1 : c.progress(0.3, 2.2);
  const shown = Math.round(props.percent * k);
  const r = (portrait ? 300 : 280) * u;
  const size = r * 2 + 60 * u;
  const angle = (props.threshold / 100) * Math.PI * 2 - Math.PI / 2;
  return (
    <Stage background={color.ink} style={{ color: color.white }}>
      <AbsoluteFill style={{ flexDirection: portrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 100 * u }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={22 * u} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={props.passed ? color.violet : color.sky}
              strokeWidth={22 * u}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100 - props.percent * k}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <line
              x1={size / 2 + Math.cos(angle) * (r - 26 * u)}
              y1={size / 2 + Math.sin(angle) * (r - 26 * u)}
              x2={size / 2 + Math.cos(angle) * (r + 26 * u)}
              y2={size / 2 + Math.sin(angle) * (r + 26 * u)}
              stroke={color.white}
              strokeWidth={5 * u}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontFamily: font.display, fontSize: 170 * u, fontWeight: 700, lineHeight: 1 }}>
                <bdi>{shown}</bdi>
              </div>
              <div style={{ fontSize: 34 * u, color: color.mist }}>
                <bdi>
                  {props.correct} / {props.total}
                </bdi>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 760 * u, textAlign: portrait ? 'center' : 'start' }}>
          <MaskLine p={c.enter(2.2)} m={c.move(2.2)} style={{ fontFamily: font.display, fontSize: 96 * u, fontWeight: 700, lineHeight: 1.05 }}>
            {props.passed ? props.passedText : props.failedText}
          </MaskLine>
          <Arc draw={c.progress(2.5, 3.6)} width={360 * u} thickness={8} style={{ marginTop: 20 * u }} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/** S09 closing: the journey's photographs, the three values, and the name of the concept — a reply to the opening. */
export function Closing(props: ClosingPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, t, portrait } = c;
  const tValues = props.values[0]!.at;
  const tTitle = props.title.at;
  return (
    <Stage background={color.ink} style={{ color: color.white }}>
      {t < tValues + 0.6 && (
        <AbsoluteFill style={{ opacity: c.window(0, tValues + 0.6, 0.6) }}>
          <AbsoluteFill style={{ display: 'grid', gridTemplateColumns: `repeat(${portrait ? 1 : props.photos.length}, 1fr)`, gap: 10 * u, padding: 10 * u }}>
            {props.photos.slice(0, portrait ? 2 : props.photos.length).map((id, i) => (
              <div key={id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 6 * u, opacity: c.enter(0.2 + i * 0.6) }}>
                <Photo src={url(props, id)} clock={c} reveal={c.move(0.2 + i * 0.6, { damping: 40, stiffness: 50 })} from={1.02} to={1.12} driftX={i % 2 ? -2 : 2} style={{ inset: 0 }} />
              </div>
            ))}
          </AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(to top, ${color.ink} 12%, rgba(11,31,58,0.45))` }} />
          <div style={{ position: 'absolute', insetInline: 110 * u, bottom: 120 * u }}>
            <Words text={props.opener.text} at={props.opener.at} clock={c} style={{ fontFamily: font.display, fontSize: (portrait ? 80 : 84) * u, fontWeight: 500, lineHeight: 1.15 }} />
          </div>
        </AbsoluteFill>
      )}
      {t >= tValues && t < tTitle + 0.6 && (
        <AbsoluteFill style={{ justifyContent: 'center', paddingInline: (portrait ? 80 : 170) * u, gap: 40 * u, opacity: c.window(tValues, tTitle + 0.6, 0.6) }}>
          {props.values.map((v, i) => (
            <div key={v.at} style={{ display: 'flex', alignItems: 'center', gap: 36 * u, opacity: c.enter(v.at) * (activeIndex(props.values, t) === i ? 1 : 0.45) }}>
              <Emblem index={i} draw={c.progress(v.at, v.at + 1)} size={110 * u} />
              <MaskLine p={c.enter(v.at)} m={c.move(v.at)} style={{ fontFamily: font.display, fontSize: (portrait ? 84 : 110) * u, fontWeight: 700 }}>
                {v.text}
              </MaskLine>
            </div>
          ))}
        </AbsoluteFill>
      )}
      {t >= tTitle - 0.2 && (
        <AbsoluteFill
          style={{
            background: color.paper,
            color: color.navy,
            clipPath: `circle(${interpolate(c.move(tTitle, { damping: 30, stiffness: 40 }), [0, 1], [0, 120])}% at 50% 55%)`,
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 10 * u,
          }}
        >
          <MaskLine p={c.enter(tTitle + 0.2)} m={c.move(tTitle + 0.2, { damping: 26, stiffness: 70 })} style={{ fontFamily: font.display, fontSize: (portrait ? 180 : 200) * u, fontWeight: 700, lineHeight: 1.05 }}>
            {props.title.text}
          </MaskLine>
          <Arc draw={c.progress(tTitle + 0.4, tTitle + 1.8)} width={(portrait ? 620 : 740) * u} thickness={12} style={{ display: 'block', margin: `${-10 * u}px auto 0`, transform: 'scaleY(-0.55)' }} />
          <MaskLine p={c.enter(props.thanks.at)} m={c.move(props.thanks.at)} style={{ fontSize: 48 * u, color: color.inkSoft, marginTop: 30 * u }}>
            {props.thanks.text}
          </MaskLine>
        </AbsoluteFill>
      )}
    </Stage>
  );
}
