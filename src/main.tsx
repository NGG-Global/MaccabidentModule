import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, flow } from './App';
import { createAdapter } from './analytics/adapter';
import { getAnonymousLearnerId, newSessionId } from './analytics/identity';
import { createTracker } from './analytics/tracker';
import { env } from './config/env';
import { content } from './content';
import { createLocalProgressStore } from './engine/progress';
import './styles/index.css';

const { courseId, courseVersion } = content.course;

const store = createLocalProgressStore({ courseId, courseVersion, restore: flow.restore });

const tracker = createTracker({
  adapter: createAdapter(env.analyticsAdapter),
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
