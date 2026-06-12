import { test, expect } from "@playwright/test";

// Public-page smoke suite. Tests run against `next start` (localhost:3000).
// All pages under test are either static or need no auth / real Supabase
// connection, so CI can run with stub NEXT_PUBLIC_* env vars.

test("marketing homepage renders without error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Conduit AI/i);
  expect(errors).toHaveLength(0);
});

test("/pricing renders with tier names", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.locator("body")).toContainText("Free");
  await expect(page.locator("body")).toContainText("Pro");
  await expect(page.locator("body")).toContainText("Enterprise");
});

test("/legal/terms renders", async ({ page }) => {
  await page.goto("/legal/terms");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("/legal/privacy renders", async ({ page }) => {
  await page.goto("/legal/privacy");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("/auth/sign-in renders sign-in form", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(
    page.locator('input[type="email"], input[name="email"]').first(),
  ).toBeVisible();
});

test("/api/health returns 200 with ok:true", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
});

test("/sitemap.xml returns 200", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("<urlset");
});

test("/robots.txt returns 200", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text.toLowerCase()).toContain("user-agent");
});
