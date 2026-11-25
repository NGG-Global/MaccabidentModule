import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { color, logoGradient } from '../../src/remotion/theme';

const css = readFileSync(resolve(__dirname, '../../src/styles/index.css'), 'utf8');
const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toUpperCase();
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

describe('brand palette', () => {
  it('keeps the Remotion colours equal to the CSS design tokens', () => {
    const pairs: [keyof typeof color, string][] = [
      ['navy', 'navy'],
      ['violet', 'violet'],
      ['violetInk', 'violet-ink'],
      ['sky', 'sky'],
      ['ink', 'ink'],
      ['paper', 'paper'],
      ['paperDeep', 'paper-deep'],
      ['mist', 'mist'],
    ];
    for (const [ts, cssName] of pairs) expect(token(cssName), cssName).toBe(color[ts]);
  });

  it('takes every brand hue from the logo', () => {
    expect([1, 2, 3, 4, 5, 6].map((i) => token(`logo-${i}`))).toEqual([...logoGradient]);
    expect(token('navy')).toBe(token('logo-navy'));
    expect(logoGradient).toContain(color.violet);
    expect(logoGradient).toContain(color.sky);
  });

  it('derives the small-text violet as 65% logo violet mixed with 35% logo navy', () => {
    const [v, n] = [hex(color.violet), hex(color.navy)];
    const mix = v.map((c, i) => Math.round(c * 0.65 + n[i]! * 0.35));
    expect(hex(color.violetInk)).toEqual(mix);
  });
});
