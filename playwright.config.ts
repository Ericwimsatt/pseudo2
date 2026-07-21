import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30000,
  use: {
    headless: true,
    baseURL: 'http://localhost:5174',
  },
  webServer: {
    command: 'vite --port 5174',
    port: 5174,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
