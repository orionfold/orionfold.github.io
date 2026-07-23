import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'output/playwright/test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4325',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    // Exercise the generated Pages artifact as a static directory tree.
    // Astro preview returns 404 for trailing-slash directory routes even when
    // dist/<route>/index.html exists, which makes it unlike GitHub Pages.
    command: 'python3 -m http.server 4325 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:4325/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
