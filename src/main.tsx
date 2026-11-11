import '@fontsource-variable/frank-ruhl-libre';
import '@fontsource-variable/heebo';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, flow } from './App';
import { CompositeAdapter, ConsoleAdapter, MemoryAdapter, type AnalyticsAdapter } from './analytics/adapter';
import { getAnonymousLearnerId, newSessionId } from './analytics/identity';
import { createTracker } from './analytics/tracker';
import { env } from './config/env';
import { content } from './content';
import { createLocalProgressStore } from './engine/progress';
import './styles/index.css';

const { courseId, courseVersion } = content.course;

const store = createLocalProgressStore({ courseId, courseVersion, restore: flow.restore });

// Local-only analytics: events stay in this page (and the console in development). Nothing is transmitted.
const memory = new MemoryAdapter();
const adapters: AnalyticsAdapter[] = [memory];
if (env.analyticsAdapter === 'console') adapters.push(new ConsoleAdapter());
if (env.isDev) (window as unknown as { __goodHandsEvents: unknown }).__goodHandsEvents = memory.events;

const tracker = createTracker({
  adapter: new CompositeAdapter(adapters),
  courseId,
  courseVersion,
  sessionId: newSessionId(),
  anonymousLearnerId: getAnonymousLearnerId(),
  onProblem: (eventName, problems) => {
    if (env.isDev) console.warn(`[analytics] dropped ${eventName}:`, problems);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App store={store} tracker={tracker} />
  </StrictMode>,
);
