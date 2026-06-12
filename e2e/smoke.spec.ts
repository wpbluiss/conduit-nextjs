import { test, expect } from "@playwright/test";

test.describe("Public page smoke tests", () => {
  test("marketing homepage renders without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Core landmark elements should be present
    await expect(page.locator("main")).toBeVisible();

    // No console errors on initial load (excludes network errors from
    // missing env-var-dependent API routes which are expected locally)
    const jsErrors = errors.filter(
      (e) =>
        !e.includes("net::ERR") &&
        !e.includes("Failed to load resource") &&
        !e.includes("favicon"),
    );
    expect(jsErrors).toHaveLength(0);
  });

  test("/pricing renders with tier cards", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    // Expect at least one pricing tier to be present
    await expect(page.getByText("Free", { exact: true }).first()).toBeVisible();
  });

  test("/legal/privacy renders", async ({ page }) => {
    const response = await page.goto("/legal/privacy");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("/legal/terms renders", async ({ page }) => {
    const response = await page.goto("/legal/terms");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("/legal/acceptable-use renders", async ({ page }) => {
    const response = await page.goto("/legal/acceptable-use");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  });

  test("sign-in page renders", async ({ page }) => {
    const response = await page.goto("/auth/sign-in");
    expect(response?.status()).toBe(200);
    await expect(page.locator("input[type=email]")).toBeVisible();
  });
});

test.describe("API health checks", () => {
  test("/api/health returns 200 with ok:true", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(typeof body.ts).toBe("string");
  });
});

test.describe("SEO / crawler files", () => {
  test("sitemap.xml resolves and contains urls", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<url>");
  });

  test("robots.txt resolves", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-agent");
  });
});
