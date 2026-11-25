/**
 * Geometry of the patient-journey cycle, shared by the interactive navigator
 * (src/screens/JourneyCycle.tsx) and the Remotion composition (Journey.tsx).
 *
 * Step 1 sits at the top and the steps run counter-clockwise, so the order
 * moves right to left, as Hebrew is read. The last step connects back to the
 * first: the process repeats.
 *
 * Coordinates are fractions of a square box (0..1).
 */
export const CYCLE_RADIUS = 0.36;

const angle = (i: number, n: number) => -Math.PI / 2 - (i * 2 * Math.PI) / n;

export function cyclePoint(i: number, n: number, r = CYCLE_RADIUS) {
  const a = angle(i, n);
  return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) };
}

/**
 * SVG path (in a box of `size` units) for the arc from step i to the next step,
 * the last one returning to the first. `nodeFraction` is the node diameter as a
 * fraction of the box, so the arc stops short of both nodes, leaving room for an arrowhead.
 */
export function cycleArc(i: number, n: number, nodeFraction: number, size = 100, r = CYCLE_RADIUS) {
  const gap = Math.asin(Math.min(0.95, nodeFraction / 2 / r)) + 0.09;
  const from = angle(i, n) - gap;
  const to = angle(i + 1, n) + gap;
  const R = r * size;
  const p = (a: number) => `${(0.5 * size + R * Math.cos(a)).toFixed(2)} ${(0.5 * size + R * Math.sin(a)).toFixed(2)}`;
  // Counter-clockwise on screen (y grows downwards) is sweep-flag 0.
  return `M ${p(from)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 0 0 ${p(to)}`;
}

/** Where a step's label goes, so it sits outside the ring and reads towards its node. */
export function labelSide(i: number, n: number): 'top' | 'bottom' | 'left' | 'right' {
  const { x, y } = cyclePoint(i, n);
  if (Math.abs(x - 0.5) < 0.05) return y < 0.5 ? 'top' : 'bottom';
  return x < 0.5 ? 'left' : 'right';
}
