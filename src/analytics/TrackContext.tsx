import { createContext, useContext } from 'react';
import type { EventName, EventPayload } from './events';
import type { TrackFields } from './tracker';

/** track() bound to the learner's current role and screen; `extra` overrides or adds fields. */
export type TrackFn = <N extends EventName>(eventName: N, payload: EventPayload<N>, extra?: Partial<TrackFields>) => void;

export const TrackContext = createContext<TrackFn>(() => {});

export const useTrack = () => useContext(TrackContext);
