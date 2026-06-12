import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright smoke suite — public routes only.
 * Run locally:
 *   npm run build && npx playwright test
 * Run against a live URL (skip the local server):
 *   BASE_URL=https://conduitai.io npx playwright test
 *
 * In CI, set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY as
 * repository secrets before `next start` so the proxy can initialize.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // When BASE_URL is set (e.g. against production), skip local server.
  ...(process.env.BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run start",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
