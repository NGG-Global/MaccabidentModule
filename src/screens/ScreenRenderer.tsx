import type { ComponentType } from 'react';
import { ui } from '../content';
import { env } from '../config/env';
import type { InteractionType } from '../content/schema';
import { MediaSlot } from '../media/MediaSlot';
import { CompareScreen } from './CompareScreen';
import { IntroScreen } from './IntroScreen';
import { JourneyScreen } from './JourneyScreen';
import { PendingScreen } from './PendingScreen';
import { RoleSelectScreen } from './RoleSelectScreen';
import { ScenarioScreen } from './ScenarioScreen';
import { ScreenHeading } from './ScreenHeading';
import { SummaryScreen } from './SummaryScreen';
import { ValuesScreen } from './ValuesScreen';
import type { ScreenProps } from './types';

/** interactionType → screen component. Types without an entry fall back to PendingScreen. */
const registry: Partial<Record<InteractionType, ComponentType<ScreenProps>>> = {
  intro: IntroScreen,
  roleSelect: RoleSelectScreen,
  compare: CompareScreen,
  valuesMatch: ValuesScreen,
  journey: JourneyScreen,
  scenario: ScenarioScreen,
  summary: SummaryScreen,
};

/** Screens that lay out their own heading and media. Older screen types get a generic frame. */
const selfContained: InteractionType[] = ['intro', 'roleSelect', 'compare', 'valuesMatch', 'journey'];

export function ScreenRenderer(props: ScreenProps) {
  const { screen } = props;

  if (screen.approvalStatus === 'DRAFT' && !env.showDraftContent) {
    return (
      <div className="space-y-6">
        <ScreenHeading screen={screen} />
        <p data-testid="draft-hidden">{ui.draftHidden}</p>
      </div>
    );
  }

  const Body = registry[screen.interactionType] ?? PendingScreen;
  if (selfContained.includes(screen.interactionType)) return <Body {...props} />;
  return (
    <div className="space-y-5">
      {Body !== PendingScreen && <ScreenHeading screen={screen} />}
      {screen.mediaIds.map((id) => (
        <MediaSlot key={id} mediaId={id} />
      ))}
      <Body {...props} />
    </div>
  );
}
