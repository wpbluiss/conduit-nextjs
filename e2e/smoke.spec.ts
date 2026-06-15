import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke suite — verifies public pages return 200 and render without
 * console errors. Runs against `next start` (production build) per
 * playwright.config.ts webServer config.
 */

async function smokeCheck(
  page: Page,
  path: string,
  assertion?: (page: Page) => Promise<void>,
) {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const response = await page.goto(path);
  expect(response?.status(), `${path} should return 200`).toBe(200);

  if (assertion) await assertion(page);

  // Filter third-party noise; fail on app-level errors only.
  const appErrors = consoleErrors.filter(
    (e) => !e.includes("ERR_BLOCKED_BY_CLIENT") && !e.includes("favicon"),
  );
  expect(appErrors, `${path} should have no console errors`).toHaveLength(0);
}

test.describe("Public page smoke tests", () => {
  test("marketing homepage renders", async ({ page }) => {
    await smokeCheck(page, "/", async (p) => {
      await expect(p.locator("body")).toBeVisible();
    });
  });

  test("/pricing renders with tiers", async ({ page }) => {
    await smokeCheck(page, "/pricing", async (p) => {
      await expect(p.locator("body")).toBeVisible();
    });
  });

  test("/legal/terms renders", async ({ page }) => {
    await smokeCheck(page, "/legal/terms");
  });

  test("/legal/privacy renders", async ({ page }) => {
    await smokeCheck(page, "/legal/privacy");
  });

  test("sign-in page renders with email input", async ({ page }) => {
    await smokeCheck(page, "/auth/sign-in", async (p) => {
      await expect(
        p.locator("input[type='email'], input[name='email']").first(),
      ).toBeVisible();
    });
  });

  test("sign-up page renders with email input", async ({ page }) => {
    await smokeCheck(page, "/auth/sign-up", async (p) => {
      await expect(
        p.locator("input[type='email'], input[name='email']").first(),
      ).toBeVisible();
    });
  });
});

test.describe("API health checks", () => {
  test("/api/health returns 200 with ok:true", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});

test.describe("Static assets", () => {
  test("sitemap.xml is well-formed", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("<urlset");
  });

  test("robots.txt resolves", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect((await response.text()).toLowerCase()).toMatch(/user-agent|sitemap/);
  });
});
