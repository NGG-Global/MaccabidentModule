import { content, ui } from '../content';
import { RoleSchema } from '../content/schema';
import { OptionList } from '../components/OptionList';
import { useNarrationClip } from '../narration/NarrationProvider';
import type { ScreenProps } from './types';

/** Track choice. It decides which role scenarios follow; the shared core is the same for everyone. */
export function RoleSelectScreen({ screen, state, dispatch }: ScreenProps) {
  useNarrationClip(screen.narration);
  return (
    <OptionList
      legend={ui.roleLegend}
      value={state.role}
      options={content.roles.map((r) => ({ id: r.id, label: r.label, description: r.description }))}
      onChange={(id) => dispatch({ type: 'SELECT_ROLE', role: RoleSchema.parse(id) })}
    />
  );
}
