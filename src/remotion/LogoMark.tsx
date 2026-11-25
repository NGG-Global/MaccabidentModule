import { useId } from 'react';
import { color, logoGradient } from './theme';

/*
 * The "בידיים טובות" logo as vector paths, so it can be animated: the hands
 * and the heart outline draw themselves in, and the gradient heart fills.
 * Geometry follows the supplied logo (assets/brand/bidayim-tovot-logo.*),
 * in its own coordinate space (viewBox below). Static screens use the logo
 * file itself (src/components/BrandLogo.tsx); if an official vector file
 * replaces it, update these paths to match.
 */
const VIEWBOX = '-0.6 -0.48 85.64 68.59';
const RATIO = 85.64 / 68.59;
const SHIFT = 'translate(-128.73 -176.13)';

const HAND_RIGHT =
  'M194.64 212.7C194.64 212.7 192.74 217.98 189.64 220.51M200 225C208.667 217.154 213.364 205.838 212.8 194.16 212.61 189.55 209.05 187.7 207.9 192.88 206.886 197.055 205.459 201.118 203.64 205.01 201.8 208.66 198.15 210.62 194.54 212.74 196.093 210.108 197.112 207.196 197.54 204.17 198.14 200.17 194.69 197.85 193.02 203.09 191.826 206.906 189.509 210.273 186.37 212.75 182.62 215.55 177.95 219.04 177.95 226.21L177.95 238.69M188.13 238.69C188.08 238.44 188.04 231.78 188.34 231.69 190.914 230.858 193.376 229.713 195.67 228.28';
const HAND_LEFT =
  'M147.21 213C147.21 213 149.11 218.28 152.21 220.81M141.83 225.33C133.159 217.491 128.461 206.176 129.03 194.5 129.22 189.89 132.78 188.04 133.93 193.22 134.943 197.395 136.371 201.458 138.19 205.35 140.03 209 143.68 210.96 147.29 213.08 145.743 210.445 144.724 207.534 144.29 204.51 143.69 200.51 147.14 198.19 148.81 203.43 150.004 207.246 152.321 210.613 155.46 213.09 159.21 215.89 163.88 219.38 163.88 226.55L163.88 238.39M153.7 238.69C153.7 238.44 153.79 232.08 153.49 231.99 150.916 231.158 148.454 230.013 146.16 228.58';
const HEART_FILL =
  'M182.25 176.27C177.98 176.31 174.043 178.588 171.88 182.27 169.711 178.589 165.772 176.313 161.5 176.27L161.45 176.27C159.394 176.277 157.38 176.852 155.63 177.93 155.525 177.999 155.427 178.079 155.34 178.17L155.34 178.17C153.91 179.225 152.675 180.521 151.69 182 150.442 184.15 149.897 186.635 150.13 189.11 150.5 193.11 152.41 197.26 155.8 201.39 159.786 206.028 164.518 209.969 169.8 213.05 171.097 213.769 172.673 213.769 173.97 213.05 179.252 209.969 183.984 206.028 187.97 201.39 191.36 197.26 193.27 193.13 193.64 189.11 193.956 185.782 192.868 182.473 190.64 179.98 188.527 177.618 185.509 176.265 182.34 176.26Z';
const HEART_LINE =
  'M148.69 190.55C149.06 194.55 150.96 198.7 154.35 202.83 158.336 207.468 163.068 211.409 168.35 214.49 169.647 215.209 171.223 215.209 172.52 214.49 177.802 211.409 182.534 207.468 186.52 202.83 189.91 198.7 191.81 194.56 192.18 190.55 192.495 187.222 191.408 183.913 189.18 181.42 187.07 179.053 184.05 177.7 180.88 177.7L180.83 177.7C176.561 177.746 172.628 180.022 170.46 183.7 168.291 180.019 164.352 177.743 160.08 177.7L160.08 177.7C158.029 177.707 156.019 178.278 154.27 179.35 154.158 179.414 154.06 179.499 153.98 179.6 152.608 180.729 151.376 182.018 150.31 183.44';

interface Props {
  /** Rendered width in pixels; the height follows the logo's ratio. */
  width: number;
  /** 0→1: the hands and the heart outline draw in. */
  draw?: number;
  /** 0→1: the gradient heart (and the cuffs) fill in. */
  fill?: number;
  /** Scale of the heart, e.g. a gentle beat around 1. */
  beat?: number;
  /** Line colour; the brand navy by default. */
  line?: string;
  /** Accessible name; omit when the name is written beside the logo. */
  title?: string;
}

export function LogoMark({ width, draw = 1, fill = 1, beat = 1, line = color.navy, title }: Props) {
  const id = useId().replace(/:/g, '');
  const stroke = (w: number) => ({ fill: 'none', stroke: line, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw });
  const stops = logoGradient.map((c, i) => <stop key={c} offset={i / (logoGradient.length - 1)} stopColor={c} />);
  const heartScale = Math.max(0, fill) * beat;
  return (
    <svg viewBox={VIEWBOX} width={width} height={width / RATIO} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={`${id}-heart`} x1="0" y1="0" x2="1" y2="0">
          {stops}
        </linearGradient>
        <linearGradient id={`${id}-cuff`} x1="1" y1="0" x2="0" y2="0">
          {stops}
        </linearGradient>
      </defs>
      <g transform={SHIFT}>
        {/* The gradient heart grows from its centre, slightly off the outline, as in the logo. */}
        <path d={HEART_FILL} fill={`url(#${id}-heart)`} style={{ transformBox: 'fill-box', transformOrigin: '50% 55%', transform: `scale(${heartScale})` }} opacity={Math.min(1, fill * 1.5)} />
        <path d={HAND_RIGHT} {...stroke(0.61)} />
        <path d={HAND_LEFT} {...stroke(0.61)} />
        <path d={HEART_LINE} {...stroke(0.67)} />
      </g>
      <g opacity={fill}>
        <rect x="24.68" y="62.03" width="12.49" height="4.55" rx="0.44" fill={`url(#${id}-cuff)`} />
        <rect x="48.62" y="62.03" width="12.48" height="4.55" rx="0.44" fill={`url(#${id}-cuff)`} />
      </g>
      <g fill="none" stroke={line} strokeWidth={0.61} strokeLinejoin="round" opacity={draw > 0.6 ? 1 : draw / 0.6}>
        <rect x="48.05" y="62.65" width="12.48" height="4.55" />
        <rect x="24.07" y="62.65" width="12.48" height="4.55" />
      </g>
    </svg>
  );
}

/** Width-to-height ratio of the logo. */
export const LOGO_RATIO = RATIO;
