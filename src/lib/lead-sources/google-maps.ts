// Google Maps enrichment via Playwright. Pulls rating + review_count for
// already-discovered, intent-flagged leads only. Hard ceiling 50 fetches/run,
// 3s delay min. No UA rotation, no retry on bot wall, no proxies — if Maps
// returns a captcha, we mark enriched=false and move on.

import type { Browser, BrowserContext, Page } from "playwright-core";
import { type EnrichmentResult, sleep } from "./types";

const MAX_FETCHES_HARD_CEILING = 50;
const ENRICH_DELAY_MS = 3000;
const PAGE_TIMEOUT_MS = 20_000;
const NAV_TIMEOUT_MS = 15_000;

interface EnrichTarget {
  id: string;
  business_name: string;
  address?: string | null;
  city: string;
}

async function launchBrowser(): Promise<Browser | null> {
  try {
    const { chromium } = await import("playwright-core");
    const isServerless =
      Boolean(process.env.VERCEL) ||
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (isServerless) {
      const sparticuz = (await import("@sparticuz/chromium")).default;
      return chromium.launch({
        args: sparticuz.args,
        executablePath: await sparticuz.executablePath(),
        headless: true,
      });
    }
    // Local dev: use system Chrome. If unavailable, the catch below logs
    // and the caller falls back to no-enrichment.
    return chromium.launch({ channel: "chrome", headless: true });
  } catch (err) {
    console.error("[maps] browser launch failed:", err);
    return null;
  }
}

async function newContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
}

function parseRating(label: string | null): number | null {
  if (!label) return null;
  const m = label.match(/(\d+(?:\.\d+)?)\s*stars?/i);
  return m ? parseFloat(m[1]) : null;
}

function parseReviewCount(label: string | null): number | null {
  if (!label) return null;
  const m = label.match(/([\d,]+)\s*(reviews?|ratings?)/i);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ""), 10);
}

async function detectBotWall(page: Page): Promise<boolean> {
  const url = page.url();
  if (url.includes("/sorry/") || url.includes("consent.google")) return true;
  const captcha = await page.locator('form[action*="sorry"]').count();
  return captcha > 0;
}

async function enrichOne(
  context: BrowserContext,
  target: EnrichTarget,
): Promise<EnrichmentResult> {
  const page = await context.newPage();
  page.setDefaultTimeout(PAGE_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

  try {
    const query = [target.business_name, target.address, target.city]
      .filter(Boolean)
      .join(" ");
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    if (await detectBotWall(page)) {
      return { leadId: target.id, enriched: false, error: "bot_wall" };
    }

    // Maps either lands on a single result (detail panel) or a list. We
    // wait for either path's signal, then read rating/review count.
    await page
      .waitForSelector('[role="img"][aria-label*="stars"], [role="article"]', {
        timeout: 10_000,
      })
      .catch(() => null);

    const ratingLabel = await page
      .locator('[role="img"][aria-label*="stars"]')
      .first()
      .getAttribute("aria-label")
      .catch(() => null);

    const reviewLabel = await page
      .locator('button[aria-label*="review"], [aria-label*="reviews"]')
      .first()
      .getAttribute("aria-label")
      .catch(() => null);

    const rating = parseRating(ratingLabel);
    const reviewCount = parseReviewCount(reviewLabel);

    if (rating == null && reviewCount == null) {
      return {
        leadId: target.id,
        enriched: false,
        error: "no_rating_found",
      };
    }

    return {
      leadId: target.id,
      rating,
      review_count: reviewCount,
      last_review_date: null,
      enriched: true,
    };
  } catch (err) {
    return {
      leadId: target.id,
      enriched: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await page.close().catch(() => null);
  }
}

/**
 * Enrich already-discovered leads with Maps rating + review_count.
 *
 * Constraints (hardcoded, not env-overridable):
 *   - Hard ceiling: 50 enrichments per call.
 *   - 3s minimum delay between requests.
 *   - No retries on bot wall, no UA rotation, no proxies.
 *   - First bot wall hit aborts the rest of the batch (saves IP reputation).
 */
export async function enrichWithGoogleMaps(opts: {
  leads: EnrichTarget[];
  maxFetches?: number;
}): Promise<EnrichmentResult[]> {
  const max = Math.min(
    opts.maxFetches ?? MAX_FETCHES_HARD_CEILING,
    MAX_FETCHES_HARD_CEILING,
  );
  const slice = opts.leads.slice(0, max);
  if (slice.length === 0) return [];

  const browser = await launchBrowser();
  if (!browser) {
    return slice.map((t) => ({
      leadId: t.id,
      enriched: false,
      error: "browser_unavailable",
    }));
  }

  const results: EnrichmentResult[] = [];
  let context: BrowserContext | null = null;
  try {
    context = await newContext(browser);
    for (let i = 0; i < slice.length; i++) {
      if (i > 0) await sleep(ENRICH_DELAY_MS);
      const result = await enrichOne(context, slice[i]);
      results.push(result);
      if (result.error === "bot_wall") {
        // Stop the batch — push remaining leads as not-enriched to keep
        // the result shape stable for the caller.
        for (let j = i + 1; j < slice.length; j++) {
          results.push({
            leadId: slice[j].id,
            enriched: false,
            error: "skipped_after_bot_wall",
          });
        }
        break;
      }
    }
  } finally {
    if (context) await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }

  return results;
}
