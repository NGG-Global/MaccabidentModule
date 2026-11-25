import { motion } from 'motion/react';
import { content, ui } from '../content';
import { RoleSchema } from '../content/schema';
import { Icon } from '../components/Icon';
import { useScreenNav } from '../components/ScreenNav';
import { StageControls } from '../stage/StageControls';
import { NarrationPanel } from './NarrationPanel';
import { ScreenFrame, ScreenHeading } from './ScreenHeading';
import { useEnterSequence } from './useEnterSequence';
import type { ScreenProps } from './types';

/** S01. Track choice decides later role scenarios; the shared core is the same for everyone. */
export function RoleSelectScreen({ screen, state, dispatch, done }: ScreenProps) {
  useEnterSequence(done);
  useScreenNav(screen.screenId, { hint: state.role ? undefined : ui.nav.chooseRole, ready: state.role !== null });

  return (
    <ScreenFrame heading={<ScreenHeading screen={screen} />}>
      <div className="grid min-h-0 flex-1 content-start gap-4 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div className="space-y-2.5 sm:space-y-4">
          <p className="max-w-2xl text-[15px] leading-snug text-ink/80 sm:text-lg">{screen.onScreenText[0]}</p>
          <fieldset>
            <legend className="sr-only">{ui.roleLegend}</legend>
            <ol className="space-y-2">
              {content.roles.map((role, i) => {
                const checked = state.role === role.id;
                return (
                  <li key={role.id}>
                    <label
                      className={`group relative flex cursor-pointer items-center gap-4 rounded-xl border-2 bg-white px-4 py-2.5 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet sm:py-4 ${
                        checked ? 'border-navy shadow-md' : 'border-transparent hover:border-ink/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={checked}
                        onChange={() => dispatch({ type: 'SELECT_ROLE', role: RoleSchema.parse(role.id) })}
                        className="peer sr-only"
                      />
                      <span className={`font-display text-2xl tabular-nums ${checked ? 'text-violet-ink' : 'text-ink/25'}`} aria-hidden>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block font-display text-xl font-semibold leading-tight sm:text-2xl ${checked ? 'text-navy' : 'text-ink'}`}>{role.label}</span>
                        <span className="block text-sm text-ink/65 sm:text-base">{role.description}</span>
                      </span>
                      <span
                        aria-hidden
                        className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition ${checked ? 'border-navy bg-navy text-white' : 'border-ink/25 group-hover:border-ink/50'}`}
                      >
                        {checked && <Icon name="check" className="size-4" strokeWidth={3} />}
                      </span>
                      {checked && <motion.span layoutId="role-marker" className="absolute inset-y-3 -start-1 w-1 rounded-full bg-violet" aria-hidden />}
                    </label>
                  </li>
                );
              })}
            </ol>
          </fieldset>
        </div>
        <div className="order-first space-y-2 lg:order-none">
          <NarrationPanel />
          <StageControls />
        </div>
      </div>
    </ScreenFrame>
  );
}
