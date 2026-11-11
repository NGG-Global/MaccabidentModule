import type { Screen } from '../content/schema';

/** Editorial heading block: eyebrow, display title, optional lead. */
export function ScreenHeading({ screen, lead, className = '' }: { screen: Screen; lead?: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {screen.eyebrow && <p className="text-sm font-semibold tracking-wide text-violet">{screen.eyebrow}</p>}
      <h1 tabIndex={-1} className="font-display text-4xl font-bold leading-[1.1] text-navy outline-none sm:text-5xl md:text-6xl">
        {screen.title}
      </h1>
      {lead && <p className="max-w-2xl text-lg leading-relaxed text-ink/80">{lead}</p>}
    </div>
  );
}
