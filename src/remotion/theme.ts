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
  paper: '#F6F4EF',
  paperDeep: '#ECE8DF',
  mist: '#DCE6F2',
  white: '#FFFFFF',
} as const;

/** The logo's heart gradient stops, left to right as drawn in the logo. */
export const logoGradient = ['#00B9FF', '#339AFF', '#677BFF', '#8D65FF', '#A457FF', '#AD52FF'] as const;

export const font = {
  display: "'Frank Ruhl Libre Variable', 'Frank Ruhl Libre', 'David', serif",
  sans: "'Heebo Variable', 'Heebo', 'Arial Hebrew', Arial, sans-serif",
} as const;

export const FPS = 30;
