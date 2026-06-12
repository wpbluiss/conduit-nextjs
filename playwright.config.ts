import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /* Run tests in parallel */
  fullyParallel: true,
  /* Fail fast in CI */
  forbidOnly: !!process.env.CI,
  /* Single retry in CI to handle transient flakes */
  retries: process.env.CI ? 1 : 0,
  /* Single worker in CI to avoid port conflicts with next start */
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    /* All tests hit the local Next.js server */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    /* Don't keep traces for speed */
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* Start next start before running tests; kill after */
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
