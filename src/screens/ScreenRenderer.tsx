import type { ComponentType } from 'react';
import { ui } from '../content';
import { env } from '../config/env';
import type { InteractionType } from '../content/schema';
import { MediaSlot } from '../media/MediaSlot';
import { IntroScreen } from './IntroScreen';
import { PendingScreen } from './PendingScreen';
import { RoleSelectScreen } from './RoleSelectScreen';
import { ScenarioScreen } from './ScenarioScreen';
import { SummaryScreen } from './SummaryScreen';
import { ValuesScreen } from './ValuesScreen';
import type { ScreenProps } from './types';

/** interactionType → component. Types without an entry fall back to PendingScreen. */
const registry: Partial<Record<InteractionType, ComponentType<ScreenProps>>> = {
  intro: IntroScreen,
  roleSelect: RoleSelectScreen,
  valuesMatch: ValuesScreen,
  scenario: ScenarioScreen,
  summary: SummaryScreen,
};

export function ScreenRenderer(props: ScreenProps) {
  const { screen } = props;

  if (screen.approvalStatus === 'DRAFT' && !env.showDraftContent) {
    return <p data-testid="draft-hidden">{ui.draftHidden}</p>;
  }

  const Body = registry[screen.interactionType] ?? PendingScreen;
  return (
    <>
      {screen.mediaIds.map((id) => (
        <MediaSlot key={id} mediaId={id} />
      ))}
      {screen.onScreenText.map((text) => (
        <p key={text} className="text-lg leading-relaxed">
          {text}
        </p>
      ))}
      {/* key: a fresh component per screen, so no local state leaks between screens */}
      <Body key={screen.screenId} {...props} />
    </>
  );
}
