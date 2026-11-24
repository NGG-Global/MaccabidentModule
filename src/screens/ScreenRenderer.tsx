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
import { ScreenFrame, ScreenHeading } from './ScreenHeading';
import { ValuesScreen } from './ValuesScreen';
import { AssessmentScreen } from './AssessmentScreen';
import { ConclusionScreen } from './ConclusionScreen';
import { MeasurementScreen } from './MeasurementScreen';
import type { ScreenProps } from './types';

/** interactionType → screen component. Types without an entry fall back to PendingScreen. */
const registry: Partial<Record<InteractionType, ComponentType<ScreenProps>>> = {
  intro: IntroScreen,
  roleSelect: RoleSelectScreen,
  compare: CompareScreen,
  valuesMatch: ValuesScreen,
  journey: JourneyScreen,
  scenario: ScenarioScreen,
  measurement: MeasurementScreen,
  assessment: AssessmentScreen,
  summary: ConclusionScreen,
};

/** Screens that lay out their own heading and media. Older screen types get a generic frame. */
const selfContained: InteractionType[] = ['intro', 'roleSelect', 'compare', 'valuesMatch', 'journey', 'scenario', 'measurement', 'assessment', 'summary'];

export function ScreenRenderer(props: ScreenProps) {
  const { screen } = props;

  if (screen.approvalStatus === 'DRAFT' && !env.showDraftContent) {
    return (
      <ScreenFrame heading={<ScreenHeading screen={screen} />}>
        <p data-testid="draft-hidden">{ui.draftHidden}</p>
      </ScreenFrame>
    );
  }

  const Body = registry[screen.interactionType] ?? PendingScreen;
  if (selfContained.includes(screen.interactionType)) return <Body {...props} />;
  return (
    <ScreenFrame heading={Body !== PendingScreen ? <ScreenHeading screen={screen} /> : undefined}>
      <div className="space-y-5">
        {screen.mediaIds.map((id) => (
          <MediaSlot key={id} mediaId={id} />
        ))}
        <Body {...props} />
      </div>
    </ScreenFrame>
  );
}
