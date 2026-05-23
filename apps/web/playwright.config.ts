import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list']],
  retries: 0,
  testDir: './tests',
  testMatch: '**/*.pw.ts',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'off'
  },
  webServer: {
    command: 'bun run start -- -p 3000',
    port: 3000,
    reuseExistingServer: true,
    timeout: 60_000
  }
})
