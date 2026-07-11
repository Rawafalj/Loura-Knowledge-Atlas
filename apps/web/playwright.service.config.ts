import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e-service",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium-service", use: { ...devices["Desktop Chrome"] } },
  ],
});
