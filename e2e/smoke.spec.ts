/**
 * Smoke suite — public marketing pages + infrastructure endpoints.
 * Intentionally scope-limited: no auth, no Supabase writes, no AI calls.
 * Goal: fast signal (<3 min) that the core request paths are alive.
 */

import { test, expect } from "@playwright/test";

// ─── Public pages ────────────────────────────────────────────────────────────

test("homepage renders without console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  await page.goto("/");
  // Brand name or page title visible
  await expect(page).toHaveTitle(/Conduit AI/i);
  // Filter out known-benign third-party errors if any
  const blockers = consoleErrors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("supabase.co") && // auth SDK reconnect attempts are OK in CI
      !e.includes("__pw_"),
  );
  expect(blockers, `Console errors on /: ${blockers.join("\n")}`).toHaveLength(0);
});

test("/pricing renders with plan tiers", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.locator("body")).toBeVisible();
  // At least one pricing tier heading/label visible
  await expect(
    page.getByText(/Free|Starter|Pro|Enterprise|Growth/i).first(),
  ).toBeVisible();
});

test("/legal/terms renders", async ({ page }) => {
  await page.goto("/legal/terms");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByText(/terms/i).first()).toBeVisible();
});

test("/legal/privacy renders", async ({ page }) => {
  await page.goto("/legal/privacy");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByText(/privacy/i).first()).toBeVisible();
});

test("/auth/sign-in renders the sign-in form", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(page.locator("body")).toBeVisible();
  // The sign-in page should have an email or password input
  await expect(
    page.locator('input[type="email"], input[type="password"]').first(),
  ).toBeVisible();
});

// ─── Infrastructure endpoints ─────────────────────────────────────────────────

test("/api/health returns 200 with ok:true", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toMatchObject({ ok: true });
});

test("/sitemap.xml is accessible and valid XML", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("<urlset");
  expect(text).toContain("conduitai.io");
});

test("/robots.txt is accessible", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  // Must have at least a User-agent directive
  expect(text).toMatch(/User-agent/i);
});
