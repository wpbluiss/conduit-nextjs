import { test, expect } from "@playwright/test";

// Public-route smoke suite. No auth required; tests run against `next start`.
// Target: < 3 minutes total. All assertions use soft expectations so one
// flaky selector doesn't mask other failures in the same test.

test("marketing homepage renders without errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const response = await page.goto("/");
  expect.soft(response?.status()).toBe(200);

  // Core content sections must be visible.
  await expect.soft(page.locator("nav")).toBeVisible();
  await expect.soft(page.locator("footer")).toBeVisible();

  // Filter out third-party / extension noise from console errors.
  const appErrors = consoleErrors.filter(
    (e) => !e.includes("chrome-extension") && !e.includes("favicon"),
  );
  expect.soft(appErrors, "no console errors on homepage").toHaveLength(0);
});

test("/pricing renders with tier cards", async ({ page }) => {
  const response = await page.goto("/pricing");
  expect.soft(response?.status()).toBe(200);
  // Page must have at least one pricing block/card.
  await expect
    .soft(page.locator("main"))
    .toContainText(/(free|pro|enterprise|\$)/i);
});

test("/legal/terms renders", async ({ page }) => {
  const response = await page.goto("/legal/terms");
  expect.soft(response?.status()).toBe(200);
  await expect
    .soft(page.locator("main, article, h1"))
    .toContainText(/(terms|service|use)/i);
});

test("/legal/privacy renders", async ({ page }) => {
  const response = await page.goto("/legal/privacy");
  expect.soft(response?.status()).toBe(200);
  await expect
    .soft(page.locator("main, article, h1"))
    .toContainText(/(privacy|policy|data)/i);
});

test("sign-in page renders", async ({ page }) => {
  const response = await page.goto("/auth/sign-in");
  // Allow 200 or a redirect (302/303) to the sign-in form.
  expect.soft(response?.status()).toBeLessThan(400);
  // Must have at least an email field.
  await expect.soft(page.locator("input[type='email']")).toBeVisible();
});

test("/api/health returns 200 with ok:true", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(typeof body.ts).toBe("string");
});

test("sitemap.xml resolves as valid XML", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect.soft(response.status()).toBe(200);
  const text = await response.text();
  expect.soft(text).toContain("<urlset");
  expect.soft(text).toContain("<url>");
});

test("robots.txt resolves", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect.soft(response.status()).toBe(200);
  const text = await response.text();
  expect.soft(text).toMatch(/user-agent/i);
});
