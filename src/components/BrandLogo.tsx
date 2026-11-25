/**
 * The "בידיים טובות" service-concept logo.
 *
 * The file is picked up from assets/brand/ at build time: an SVG is preferred,
 * then a PNG. Replacing the logo only takes placing the new file there
 * (bidayim-tovot-logo.svg or .png). Without a file, a clearly marked
 * placeholder of the same size is shown, so layouts do not shift.
 */
const files = import.meta.glob<string>('/assets/brand/bidayim-tovot-logo.{svg,png}', { eager: true, query: '?url', import: 'default' });
const src = files['/assets/brand/bidayim-tovot-logo.svg'] ?? files['/assets/brand/bidayim-tovot-logo.png'];

/** Width-to-height ratio of the supplied artwork (1998 × 1600). */
const RATIO = 1998 / 1600;

interface Props {
  /** Rendered height in pixels; the width follows the artwork's ratio. */
  height: number;
  /** Accessible name. Pass an empty string when the name is already written next to the logo. */
  alt: string;
  className?: string;
}

export function BrandLogo({ height, alt, className = '' }: Props) {
  const width = Math.round(height * RATIO);
  if (src) {
    return <img src={src} alt={alt} width={width} height={height} className={`shrink-0 object-contain ${className}`} data-testid="brand-logo" draggable={false} />;
  }
  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      data-testid="brand-logo-placeholder"
      style={{ width, height }}
      className={`grid shrink-0 place-items-center rounded-lg border-2 border-dashed border-current text-[10px] font-semibold leading-tight opacity-70 ${className}`}
    >
      לוגו
    </span>
  );
}
