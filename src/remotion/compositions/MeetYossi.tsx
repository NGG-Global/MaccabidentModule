import { MaskLine, Photo, Stage, Words, activeIndex, url, useClock } from '../primitives';
import type { CommonProps, MeetYossiPropsT } from '../props';
import { color, font } from '../theme';

/** S02 introduction: a portrait of the patient opens like a shutter while his situation is described. */
export function MeetYossi(props: MeetYossiPropsT & CommonProps) {
  const c = useClock(props.reducedMotion);
  const { u, portrait, t } = c;
  const current = activeIndex(props.lines, t);
  const [first, ...rest] = props.lines;
  return (
    <Stage background={color.paper}>
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: portrait ? '100%' : '54%',
          height: portrait ? '52%' : '100%',
        }}
      >
        <Photo src={url(props, props.photoId)} clock={c} reveal={c.move(0, { damping: 40, stiffness: 45 })} from={1.08} to={1.18} style={{ inset: 0 }} />
        <div
          style={{
            position: 'absolute',
            insetInlineStart: 50 * u,
            bottom: 50 * u,
            background: color.paper,
            padding: `${14 * u}px ${30 * u}px`,
            borderRadius: 999,
            fontSize: 38 * u,
            fontWeight: 700,
            color: color.navy,
            opacity: c.enter(0.6),
            transform: `translateY(${(1 - c.move(0.6)) * 20 * u}px)`,
          }}
        >
          {props.name}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: portrait ? '52%' : 0,
          width: portrait ? '100%' : '46%',
          height: portrait ? '48%' : '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingInline: (portrait ? 70 : 90) * u,
          gap: 22 * u,
        }}
      >
        {first && (
          <MaskLine p={c.enter(first.at)} m={c.move(first.at)} style={{ fontFamily: font.display, fontSize: 92 * u, fontWeight: 700, color: color.navy }}>
            {first.text}
          </MaskLine>
        )}
        {rest.map((line, i) =>
          t >= line.at ? (
            <div key={line.at} style={{ opacity: i + 1 === current ? 1 : 0.42, transition: 'none' }}>
              <Words text={line.text} at={line.at} clock={c} style={{ fontSize: 42 * u, lineHeight: 1.3, color: color.ink }} />
            </div>
          ) : null,
        )}
      </div>
    </Stage>
  );
}
