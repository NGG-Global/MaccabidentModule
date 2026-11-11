import type { ComponentType } from 'react';
import type { CompositionId } from '../content/schema';
import { Chapter } from './compositions/Chapter';
import { CompareFeedback } from './compositions/CompareFeedback';
import { Journey } from './compositions/Journey';
import { MeetYossi } from './compositions/MeetYossi';
import { Opening } from './compositions/Opening';
import { ValueAccompanying, ValueAdapting, ValueSeeing, ValuesIntro } from './compositions/Values';
import { compositionPropSchemas } from './props';

/** Composition id → React component rendered inside @remotion/player. Props are validated against props.ts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const compositions: Record<CompositionId, ComponentType<any>> = {
  opening: Opening,
  chapter: Chapter,
  meetYossi: MeetYossi,
  compareFeedback: CompareFeedback,
  valuesIntro: ValuesIntro,
  valueSeeing: ValueSeeing,
  valueAdapting: ValueAdapting,
  valueAccompanying: ValueAccompanying,
  journey: Journey,
};

export function parseCompositionProps(id: CompositionId, props: unknown): Record<string, unknown> {
  return compositionPropSchemas[id].parse(props) as Record<string, unknown>;
}

/** Frame sizes: wide on desktop and tablet, portrait 4:5 on narrow screens. */
export const FRAME = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1350 },
} as const;
