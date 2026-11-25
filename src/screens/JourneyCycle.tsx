import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';
import { ui } from '../content';
import { Icon } from '../components/Icon';
import { cycleArc, cyclePoint, labelSide } from '../remotion/cycle';

interface StageItem {
  id: string;
  number: number;
  title: string;
}

interface Props {
  stages: StageItem[];
  activeId: string | null;
  visitedIds: string[];
  onOpen: (id: string) => void;
  /** Show each stage's title beside its node (wide screens). On narrow screens only the numbers show. */
  labels: boolean;
  /** Node diameter as a fraction of the cycle's box. */
  nodeFraction: number;
}

const LABEL_POSITION: Record<ReturnType<typeof labelSide>, string> = {
  top: 'bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 text-center',
  bottom: 'top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 text-center',
  left: 'right-[calc(100%+0.75rem)] top-1/2 -translate-y-1/2 text-right',
  right: 'left-[calc(100%+0.75rem)] top-1/2 -translate-y-1/2 text-left',
};

/**
 * The five touchpoints as a repeating cycle: numbered nodes on a ring, joined
 * by arrows, the fifth leading back to the first. Each node is a button that
 * opens its touchpoint; the active one is highlighted. The box is square and
 * fills the largest square its container allows.
 */
export function JourneyCycle({ stages, activeId, visitedIds, onOpen, labels, nodeFraction }: Props) {
  const reduce = useReducedMotion();
  const markerId = useId();
  const n = stages.length;
  const node = `calc(min(100cqw, 100cqh) * ${nodeFraction})`;

  return (
    <div className="relative grid size-full place-items-center [container-type:size]">
      <div className="relative" style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)' }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
              <path d="M1 1 L8 5 L1 9" fill="none" style={{ stroke: 'var(--color-navy)' }} strokeOpacity={0.75} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
          {stages.map((s, i) => {
            const done = visitedIds.includes(s.id);
            return (
              <path
                key={s.id}
                d={cycleArc(i, n, nodeFraction)}
                fill="none"
                style={{ stroke: 'var(--color-navy)' }}
                strokeOpacity={done ? 0.9 : 0.35}
                strokeWidth={done ? 1.4 : 1.1}
                strokeDasharray={done ? undefined : '2.2 2.2'}
                strokeLinecap="round"
                markerEnd={`url(#${markerId})`}
                data-testid={`cycle-arc-${i + 1}`}
              />
            );
          })}
          {/* At the centre: the cycle repeats. */}
          <g transform="translate(50 50)" style={{ stroke: 'var(--color-violet)' }} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <path d="M -7 -3.5 A 8 8 0 0 1 7 -3.5" />
            <path d="M 7 -3.5 l 0.4 -3.6 M 7 -3.5 l -3.5 -0.9" />
            <path d="M 7 3.5 A 8 8 0 0 1 -7 3.5" />
            <path d="M -7 3.5 l -0.4 3.6 M -7 3.5 l 3.5 0.9" />
          </g>
        </svg>

        <ol className="absolute inset-0">
          {stages.map((s, i) => {
            const p = cyclePoint(i, n);
            const visited = visitedIds.includes(s.id);
            const isActive = s.id === activeId;
            return (
              // The hit area is never under 44px, even where the drawn node is smaller (phones).
              <li key={s.id} className="absolute" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `max(${node}, 2.75rem)`, height: `max(${node}, 2.75rem)`, transform: 'translate(-50%, -50%)', zIndex: isActive ? 2 : 1 }}>
                <button
                  type="button"
                  onClick={() => onOpen(s.id)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`${s.number}. ${s.title} – ${visited ? ui.journey.visited : ui.journey.notVisited}`}
                  data-testid={`stage-${s.id}`}
                  data-visited={visited}
                  data-active={isActive}
                  className="group grid size-full place-items-center rounded-full"
                >
                  <motion.span
                    aria-hidden
                    className="relative block"
                    style={{ width: node, height: node }}
                    initial={false}
                    animate={{ scale: isActive ? 1.12 : 1 }}
                    transition={reduce ? { duration: 0 } : { type: 'spring', damping: 20, stiffness: 260 }}
                  >
                    {isActive && (
                      // Brand ring: the logo's gradient around the active node.
                      <motion.span
                        className="absolute -inset-1.5 rounded-full"
                        style={{ background: 'var(--gradient-brand)' }}
                        initial={false}
                        animate={reduce ? { scale: 1 } : { scale: [1, 1.08, 1] }}
                        transition={reduce ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    <span
                      className={`relative grid size-full place-items-center rounded-full font-display text-lg font-bold transition-colors sm:text-xl ${
                        isActive
                          ? 'border-2 border-white bg-violet-ink text-white shadow-lg'
                          : visited
                            ? 'bg-navy text-white group-hover:bg-navy/90'
                            : 'border-2 border-dashed border-navy/45 bg-white text-navy group-hover:border-navy'
                      }`}
                    >
                      {visited && !isActive ? <Icon name="check" className="size-[45%]" strokeWidth={3} /> : s.number}
                    </span>
                  </motion.span>
                </button>
                {labels && (
                  <span aria-hidden className={`pointer-events-none absolute w-36 leading-tight xl:w-40 ${LABEL_POSITION[labelSide(i, n)]}`}>
                    <span className={`block text-sm xl:text-base ${isActive ? 'font-bold text-navy' : 'font-semibold text-ink/80'}`}>{s.title}</span>
                    <span className={`block text-xs ${visited ? 'text-navy' : 'text-ink/60'}`}>{visited ? ui.journey.visited : ui.journey.notVisited}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
