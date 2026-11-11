import { AbsoluteFill } from 'remotion';
import { MaskLine, Stage, Words, useClock } from '../primitives';
import type { CommonProps, CompareFeedbackPropsT } from '../props';
import { color, font } from '../theme';

/**
 * S02 feedback. Three things stayed the same (drawn as equal signs); the
 * experience was different; three service practices made the difference.
 */
export function CompareFeedback(props: CompareFeedbackPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, portrait, t } = c;
  const tPractices = props.practices[0]!.at;
  const phaseA = t < tPractices;
  return (
    <Stage background={color.paper}>
      {phaseA ? (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 60 * u, opacity: c.window(0, tPractices + 0.2, 0.5) }}>
          <div style={{ display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: (portrait ? 30 : 70) * u, alignItems: 'center' }}>
            {props.same.map((s, i) => (
              <div key={s.at} style={{ display: 'flex', alignItems: 'center', gap: 22 * u, opacity: c.enter(s.at) }}>
                <svg width={46 * u} height={30 * u} viewBox="0 0 46 30" aria-hidden>
                  {[6, 24].map((y) => (
                    <line key={y} x1="2" x2={2 + 42 * c.progress(s.at, s.at + 0.5)} y1={y} y2={y} stroke={color.violet} strokeWidth="4" strokeLinecap="round" />
                  ))}
                </svg>
                <MaskLine p={c.enter(s.at)} m={c.move(s.at)} style={{ fontFamily: font.display, fontSize: 64 * u, color: color.inkSoft }}>
                  {s.text}
                </MaskLine>
                {!portrait && i < props.same.length - 1 && <span style={{ width: 2 * u, height: 60 * u, background: color.paperDeep }} />}
              </div>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <MaskLine
              p={c.enter(props.different.at)}
              m={c.move(props.different.at, { damping: 24, stiffness: 80 })}
              style={{ fontFamily: font.display, fontSize: 140 * u, fontWeight: 700, color: color.navy, textAlign: 'center' }}
            >
              {props.different.text}
            </MaskLine>
          </div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ flexDirection: portrait ? 'column' : 'row', justifyContent: 'center', alignItems: portrait ? 'stretch' : 'center', paddingInline: (portrait ? 80 : 150) * u, gap: 90 * u }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30 * u, flex: 1 }}>
            {props.practices.map((p, i) => (
              <div key={p.at} style={{ display: 'flex', alignItems: 'center', gap: 28 * u, opacity: c.enter(p.at) }}>
                <span style={{ fontFamily: font.display, fontSize: 46 * u, color: color.violet, width: 70 * u }}>{String(i + 1).padStart(2, '0')}</span>
                <MaskLine p={c.enter(p.at)} m={c.move(p.at)} style={{ fontFamily: font.display, fontSize: 80 * u, fontWeight: 600, color: color.navy }}>
                  {p.text}
                </MaskLine>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 30 * u, borderInlineStart: portrait ? 'none' : `${3 * u}px solid ${color.paperDeep}`, paddingInlineStart: portrait ? 0 : 80 * u }}>
            <Words text={props.result.text} at={props.result.at} clock={c} style={{ fontFamily: font.display, fontSize: 72 * u, fontWeight: 700, color: color.ink, lineHeight: 1.15 }} />
            <div style={{ height: 6 * u, width: `${c.progress(props.result.at + 0.4, props.result.at + 1.4) * 40}%`, background: color.violet, borderRadius: 6 * u }} />
            <Words text={props.closing.text} at={props.closing.at} clock={c} style={{ fontSize: 40 * u, color: color.inkSoft, lineHeight: 1.35 }} />
          </div>
        </AbsoluteFill>
      )}
    </Stage>
  );
}
