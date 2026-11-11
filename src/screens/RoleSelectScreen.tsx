import { motion } from 'motion/react';
import { content, ui } from '../content';
import { RoleSchema } from '../content/schema';
import { StageControls } from '../stage/StageControls';
import { NarrationPanel } from './NarrationPanel';
import { ScreenHeading } from './ScreenHeading';
import { useEnterSequence } from './useEnterSequence';
import type { ScreenProps } from './types';

/** S01. Track choice decides later role scenarios; the shared core is the same for everyone. */
export function RoleSelectScreen({ screen, state, dispatch, done }: ScreenProps) {
  useEnterSequence(done);
  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
      <div className="space-y-8">
        <ScreenHeading screen={screen} lead={screen.onScreenText[0]} />
        <fieldset>
          <legend className="sr-only">{ui.roleLegend}</legend>
          <ol className="divide-y divide-ink/10 border-y border-ink/10">
            {content.roles.map((role, i) => {
              const checked = state.role === role.id;
              return (
                <li key={role.id}>
                  <label className="group relative flex cursor-pointer items-center gap-5 py-5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet">
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={checked}
                      onChange={() => dispatch({ type: 'SELECT_ROLE', role: RoleSchema.parse(role.id) })}
                      className="peer sr-only"
                    />
                    <span className={`font-display text-3xl tabular-nums ${checked ? 'text-violet' : 'text-ink/25'}`} aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">
                      <span className={`block font-display text-2xl font-semibold sm:text-3xl ${checked ? 'text-navy' : 'text-ink'}`}>{role.label}</span>
                      <span className="block text-ink/65">{role.description}</span>
                    </span>
                    <span
                      aria-hidden
                      className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition ${checked ? 'border-navy bg-navy text-white' : 'border-ink/25 group-hover:border-ink/50'}`}
                    >
                      {checked && '✓'}
                    </span>
                    {checked && <motion.span layoutId="role-marker" className="absolute inset-y-2 -start-3 w-1 rounded-full bg-violet" aria-hidden />}
                  </label>
                </li>
              );
            })}
          </ol>
        </fieldset>
      </div>
      <div className="space-y-4 lg:sticky lg:top-36">
        <NarrationPanel />
        <StageControls />
      </div>
    </div>
  );
}
