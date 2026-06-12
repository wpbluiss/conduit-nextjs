import { test, expect } from "@playwright/test";

/**
 * Smoke suite — public routes that must work for every PR.
 * All checks are against unauthenticated, public pages.
 * No sign-in, no DB writes.
 */

test.describe("marketing pages", () => {
  test("homepage renders without JS errors", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    const resp = await page.goto("/");
    expect(resp?.status(), "GET / should be 200").toBe(200);
    await page.waitForLoadState("domcontentloaded");

    expect(jsErrors, `No uncaught JS errors: ${jsErrors.join("; ")}`).toHaveLength(0);
    await expect(page).toHaveTitle(/Conduit AI/i);
  });

  test("/pricing renders with tier content", async ({ page }) => {
    const resp = await page.goto("/pricing");
    expect(resp?.status(), "GET /pricing should be 200").toBe(200);
    await page.waitForLoadState("domcontentloaded");
    // Should contain at least one pricing reference
    await expect(page.locator("body")).toContainText(/free|pro|enterprise|plan|month/i);
  });

  test("/legal/terms renders", async ({ page }) => {
    const resp = await page.goto("/legal/terms");
    expect(resp?.status(), "GET /legal/terms should be 200").toBe(200);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toContainText(/terms/i);
  });

  test("/legal/privacy renders", async ({ page }) => {
    const resp = await page.goto("/legal/privacy");
    expect(resp?.status(), "GET /legal/privacy should be 200").toBe(200);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toContainText(/privacy/i);
  });

  test("/auth/sign-in renders sign-in form", async ({ page }) => {
    const resp = await page.goto("/auth/sign-in");
    expect(resp?.status(), "GET /auth/sign-in should be 200").toBe(200);
    await page.waitForLoadState("domcontentloaded");
    // Must contain an email input or a recognisable sign-in heading
    const hasEmail = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const hasSignInText = await page.locator("body").textContent().then((t) => /sign.?in/i.test(t ?? ""));
    expect(hasEmail || hasSignInText, "sign-in page should have email field or sign-in copy").toBe(true);
  });
});

test.describe("API / meta routes", () => {
  test("/api/health returns 200 with ok:true", async ({ request }) => {
    const resp = await request.get("/api/health");
    expect(resp.status(), "GET /api/health should be 200").toBe(200);
    const body = await resp.json();
    expect(body.ok, "/api/health body.ok should be true").toBe(true);
  });

  test("/sitemap.xml is a valid XML sitemap", async ({ request }) => {
    const resp = await request.get("/sitemap.xml");
    expect(resp.status(), "GET /sitemap.xml should be 200").toBe(200);
    const text = await resp.text();
    expect(text, "sitemap.xml should contain <urlset").toContain("<urlset");
    expect(text, "sitemap.xml should contain at least one <loc>").toContain("<loc>");
  });

  test("/robots.txt resolves and mentions User-agent", async ({ request }) => {
    const resp = await request.get("/robots.txt");
    expect(resp.status(), "GET /robots.txt should be 200").toBe(200);
    const text = await resp.text();
    expect(text, "robots.txt should contain User-agent").toContain("User-agent");
  });
});
