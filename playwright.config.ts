import { defineConfig } from '@playwright/test';

const PORT = 5199;

// E2E runs against the dev server on purpose: it enables the Console analytics
// adapter and DRAFT content, both of which are disabled in a production build.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, locale: 'he-IL' },
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
