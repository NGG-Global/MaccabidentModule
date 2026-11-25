/**
 * Colours for the Remotion compositions. They mirror the design tokens in
 * src/styles/index.css (the source of truth); tests/unit/brand.test.ts fails
 * if the two drift apart. Brand hues come from the "בידיים טובות" logo.
 */
export const color = {
  violet: '#8D65FF',
  violetInk: '#6858D3',
  navy: '#243F82',
  sky: '#00B9FF',
  ink: '#0B1F3A',
  inkSoft: '#2A3B55',
  paper: '#F6F7FF',
  paperDeep: '#EDEFFF',
  mist: '#E7EAFF',
  white: '#FFFFFF',
} as const;

/** The logo's heart gradient stops, left to right as drawn in the logo. */
export const logoGradient = ['#00B9FF', '#339AFF', '#677BFF', '#8D65FF', '#A457FF', '#AD52FF'] as const;

const alpha = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`;

/**
 * Brand surfaces, matching .bg-night and .bg-dawn in src/styles/index.css:
 * the logo's violet and cyan as soft glows over a navy-to-ink ground (night)
 * or over the tinted paper (dawn).
 */
export const surface = {
  night: `radial-gradient(120% 90% at 100% 0%, ${alpha(logoGradient[5], 0.3)}, transparent 55%), radial-gradient(90% 80% at 0% 100%, ${alpha(logoGradient[0], 0.22)}, transparent 60%), linear-gradient(160deg, ${color.navy} 0%, ${color.ink} 70%)`,
  dawn: `radial-gradient(70% 60% at 88% 8%, ${alpha(logoGradient[5], 0.1)}, transparent 70%), radial-gradient(60% 60% at 8% 92%, ${alpha(logoGradient[0], 0.1)}, transparent 70%), ${color.paper}`,
} as const;

export const font = {
  display: "'Frank Ruhl Libre Variable', 'Frank Ruhl Libre', 'David', serif",
  sans: "'Heebo Variable', 'Heebo', 'Arial Hebrew', Arial, sans-serif",
} as const;

export const FPS = 30;
