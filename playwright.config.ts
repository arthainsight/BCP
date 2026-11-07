import { defineConfig, devices } from '@playwright/test';

// Browser tests (e2e/*.spec.ts): run the production build and walk the main views.
// `npm run build` first, then `npm run test:e2e`.
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  // The page opens with the chart of now at Porvoo; the tests start from the blank page they were written for, and the one
  // test of the opening (e2e/opening.spec.ts) puts the choice back.
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    storageState: { cookies: [], origins: [{ origin: 'http://localhost:3100', localStorage: [{ name: 'openWithNowChart', value: 'blank' }] }] },
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 }, browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npx next start -p 3100',
    url: 'http://localhost:3100',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});
