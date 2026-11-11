import { defineConfig } from '@playwright/test';

const PORT = 5199;

// E2E runs against the dev server on purpose: it enables the console analytics
// adapter, DRAFT content and the dev-only stage seam used to fast-forward narration.
// Autoplay is allowed in the browser so the tests check the app's own gesture rule
// (counting play() calls), not the browser's.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, locale: 'he-IL', launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-360', use: { browserName: 'chromium', viewport: { width: 360, height: 740 } } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
