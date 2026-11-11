import { AbsoluteFill, interpolate } from 'remotion';
import { Arc, MaskLine, Photo, Stage, Words, activeIndex, url, useClock } from '../primitives';
import type { CommonProps, OpeningPropsT } from '../props';
import { color, font } from '../theme';

/**
 * S00 opening, driven by the welcome narration. Five movements:
 * montage of the clinic → title "בידיים טובות" → "it starts earlier" →
 * four moments that shape the experience → invitation to begin.
 */
export function Opening(props: OpeningPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { t, u, portrait } = c;
  const lead = props.lines[props.lines.length - 1]!;
  const montageLines = props.lines.slice(0, -1);
  const tTitle = lead.at;
  const tAfter = props.after[0]?.at ?? props.title.at + 3;
  const tMoments = props.moments[0]!.at;
  const tOutro = props.outro[0]!.at;

  return (
    <Stage background={color.ink}>
      {/* 1 — montage: photographs drift on layered planes under the narration */}
      {t < tTitle + 1 && (
        <AbsoluteFill style={{ opacity: c.window(0, tTitle + 0.9, 0.9) }}>
          <Montage {...props} c={c} />
          <AbsoluteFill style={{ background: `linear-gradient(to top, ${color.ink} 8%, rgba(11,31,58,0.55) 45%, rgba(11,31,58,0.25))` }} />
          <div style={{ position: 'absolute', insetInline: 110 * u, bottom: (portrait ? 160 : 120) * u, color: color.white }}>
            <div style={{ opacity: c.enter(0.2), marginBottom: 26 * u }}>
              <Arc draw={c.progress(0.2, 1.6)} width={170 * u} thickness={9} />
            </div>
            {montageLines.map((line, i) => {
              const next = montageLines[i + 1]?.at ?? tTitle;
              if (t < line.at - 0.1 || t > next + 0.5) return null;
              return (
                <div key={line.at} style={{ position: 'absolute', bottom: 0, insetInline: 0, opacity: c.window(line.at, next + 0.35, 0.35) }}>
                  <Words text={line.text} at={line.at} clock={c} style={{ fontFamily: font.display, fontSize: (portrait ? 84 : 76) * u, fontWeight: 500, lineHeight: 1.15 }} />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      {/* 2 — title: the paper opens from the centre, and the name of the service concept arrives */}
      {t >= tTitle - 0.2 && t < tMoments + 0.6 && (
        <AbsoluteFill
          style={{
            background: color.paper,
            clipPath: `circle(${interpolate(c.move(tTitle, { damping: 30, stiffness: 40 }), [0, 1], [0, 120])}% at 50% 55%)`,
            opacity: c.window(tTitle - 0.2, tMoments + 0.6, 0.6),
          }}
        >
          {t < tAfter + 0.5 ? (
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: c.window(tTitle, tAfter + 0.4, 0.4) }}>
              <MaskLine p={c.enter(tTitle + 0.3)} m={c.move(tTitle + 0.3)} style={{ fontSize: 44 * u, color: color.inkSoft }}>
                {lead.text}
              </MaskLine>
              <div style={{ position: 'relative', marginTop: 10 * u }}>
                <MaskLine
                  p={c.enter(props.title.at)}
                  m={c.move(props.title.at, { damping: 26, stiffness: 70 })}
                  distance={0.9}
                  style={{ fontFamily: font.display, fontSize: (portrait ? 190 : 210) * u, fontWeight: 700, color: color.navy, lineHeight: 1.05, letterSpacing: '-0.01em' }}
                >
                  {props.title.text}
                </MaskLine>
                <Arc
                  draw={c.progress(props.title.at + 0.2, props.title.at + 1.6)}
                  width={(portrait ? 640 : 760) * u}
                  thickness={12}
                  style={{ display: 'block', margin: `${-10 * u}px auto 0`, transform: 'scaleY(-0.55)' }}
                />
              </div>
            </AbsoluteFill>
          ) : (
            <Earlier {...props} c={c} />
          )}
        </AbsoluteFill>
      )}

      {/* 4 — four moments, with a camera that travels along them */}
      {t >= tMoments - 0.1 && t < tOutro + 0.7 && (
        <AbsoluteFill style={{ background: color.paper, opacity: c.window(tMoments - 0.1, tOutro + 0.7, 0.6) }}>
          <Moments {...props} c={c} />
        </AbsoluteFill>
      )}

      {/* 5 — the concept and the invitation */}
      {t >= tOutro && (
        <AbsoluteFill style={{ background: color.ink, opacity: c.enter(tOutro), color: color.white, justifyContent: 'center', paddingInline: 120 * u }}>
          <Outro {...props} c={c} />
        </AbsoluteFill>
      )}
    </Stage>
  );
}

type WithClock = OpeningPropsT & CommonProps & { c: ReturnType<typeof useClock> };

function Montage({ photos, c, ...props }: WithClock) {
  const { u, portrait, t } = c;
  const cols = portrait ? 1 : photos.length;
  // Photos arrive one by one with the narration's opening lines, each on its own drift plane.
  return (
    <AbsoluteFill style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: '1fr', gap: 10 * u, padding: 10 * u }}>
      {photos.map((id, i) => {
        const at = 0.4 + i * 1.5;
        return (
          <div key={id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 6 * u, opacity: c.enter(at) * (portrait && i > 1 ? 0 : 1) }}>
            <Photo
              src={url(props as unknown as CommonProps, id)}
              clock={c}
              reveal={c.move(at, { damping: 40, stiffness: 50 })}
              from={1.12}
              to={1.02}
              driftX={i % 2 ? 2 : -2}
              style={{ inset: 0 }}
              filter={`saturate(${0.75 + 0.25 * Math.min(1, t / 12)})`}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Earlier({ after, title, c }: WithClock) {
  const { u, portrait } = c;
  const [first, second] = after;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', paddingInline: (portrait ? 90 : 200) * u, gap: 40 * u }}>
      <div style={{ fontSize: 34 * u, color: color.violet, fontWeight: 600, opacity: c.enter(first!.at) }}>{title.text}</div>
      {first && (
        <Words text={first.text} at={first.at} clock={c} style={{ fontFamily: font.display, fontSize: 76 * u, color: color.inkSoft, lineHeight: 1.2, maxWidth: 1300 * u }} />
      )}
      {second && (
        <div style={{ position: 'relative', alignSelf: 'flex-start' }}>
          <Words text={second.text} at={second.at} clock={c} style={{ fontFamily: font.display, fontSize: 104 * u, fontWeight: 700, color: color.navy, lineHeight: 1.15 }} />
          <div
            style={{
              position: 'absolute',
              insetInlineStart: 0,
              bottom: -6 * u,
              height: 10 * u,
              width: `${c.progress(second.at + 0.5, second.at + 1.3) * 100}%`,
              background: color.violet,
              borderRadius: 10 * u,
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
}

function Moments({ moments, c, ...rest }: WithClock) {
  const { u, portrait, t } = c;
  const active = activeIndex(moments, t);
  const end = rest.outro[0]!.at;
  // Camera: a slow lateral travel across the row (landscape) or a push-in (portrait).
  const travel = c.reducedMotion ? 0 : c.progress(moments[0]!.at, end) * 3;
  return (
    <AbsoluteFill style={{ padding: (portrait ? 70 : 110) * u, justifyContent: 'center', gap: 50 * u }}>
      <div style={{ fontSize: 40 * u, color: color.violet, fontWeight: 600, opacity: c.enter(moments[0]!.at - 0.1) }}>היא מתחילה</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: portrait ? '1fr 1fr' : `repeat(${moments.length}, 1fr)`,
          gap: (portrait ? 34 : 44) * u,
          transform: portrait ? `scale(${1 + travel / 100})` : `translateX(${-travel}%)`,
        }}
      >
        {moments.map((m, i) => {
          const isActive = i === active;
          return (
            <div key={m.at} style={{ opacity: c.enter(m.at) * (isActive ? 1 : 0.55 + 0.45 * (i < active ? 0.6 : 0)) }}>
              <div style={{ position: 'relative', aspectRatio: portrait ? '4 / 5' : '3 / 4', borderRadius: 8 * u, overflow: 'hidden', boxShadow: isActive ? `0 ${24 * u}px ${60 * u}px rgba(11,31,58,0.25)` : 'none' }}>
                <Photo src={url(rest as unknown as CommonProps, m.photoId)} clock={c} reveal={c.move(m.at, { damping: 40, stiffness: 60 })} style={{ inset: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 * u, marginTop: 22 * u }}>
                <span style={{ fontFamily: font.display, fontSize: 40 * u, color: color.violet }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontFamily: font.display, fontSize: (portrait ? 44 : 40) * u, fontWeight: 600, color: color.navy, lineHeight: 1.2 }}>{m.text}</span>
              </div>
              <div style={{ height: 4 * u, marginTop: 16 * u, background: color.paperDeep, borderRadius: 4 * u, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(isActive || i < active ? 1 : 0) * 100}%`, background: color.violet, transition: 'none' }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Outro({ outro, title, c }: WithClock) {
  const { u, t } = c;
  const last = outro[outro.length - 1]!;
  const statements = outro.slice(0, -1);
  const current = activeIndex(statements, t);
  if (t >= last.at) {
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 * u }}>
        <Arc draw={c.progress(last.at, last.at + 1.2)} width={300 * u} thickness={10} />
        <MaskLine p={c.enter(last.at)} m={c.move(last.at)} style={{ fontFamily: font.display, fontSize: 150 * u, fontWeight: 700 }}>
          {title.text}
        </MaskLine>
        <MaskLine p={c.enter(last.at + 0.5)} m={c.move(last.at + 0.5)} style={{ fontSize: 46 * u, color: color.mist }}>
          {last.text}
        </MaskLine>
      </AbsoluteFill>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 * u }}>
      {statements.map((line, i) =>
        i <= current ? (
          <div key={line.at} style={{ opacity: i === current ? 1 : 0.38 }}>
            <Words text={line.text} at={line.at} clock={c} style={{ fontFamily: font.display, fontSize: (i === current ? 84 : 52) * u, lineHeight: 1.15 }} />
          </div>
        ) : null,
      )}
    </div>
  );
}
