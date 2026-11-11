import type { Dispatch } from 'react';
import type { Screen } from '../content/schema';
import type { FlowAction, FlowState } from '../engine/flow';

export interface ScreenProps {
  screen: Screen;
  state: FlowState;
  dispatch: Dispatch<FlowAction>;
  /** Whether the learner has already completed this screen's activity (e.g. on revisiting). */
  done: boolean;
}
