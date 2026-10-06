import { defineConfig, devices } from '@playwright/test';

// Browser smoke test: runs the production build and walks the main views.
// `npm run build` first, then `npm run test:e2e`.
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
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
