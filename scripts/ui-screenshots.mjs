// Screenshots key live pages at desktop + mobile widths into .ui-review/ for the
// visual design-review loop (ui-design-review.yml). Best-effort: never hard-fails,
// but logs a final count so a silent zero-capture is visible.
import { chromium } from "playwright";
import { mkdirSync, readdirSync } from "node:fs";

const BASE = process.env.UI_BASE || "https://conduitai.io";
const ROUTES = ["/", "/pricing", "/about", "/approach", "/trust", "/auth/sign-in", "/auth/sign-up"];
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

mkdirSync(".ui-review", { recursive: true });
const browser = await chromium.launch();
let shot = 0;
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const slug = route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    try {
      // domcontentloaded (NOT networkidle — this site never goes idle: analytics,
      // motion, streaming keep connections open, so networkidle always timed out
      // and every screenshot was silently skipped).
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      // Let fonts, hero motion, and scroll-reveal settle.
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `.ui-review/${slug}-${vp.name}.png`, fullPage: true });
      shot++;
      console.log(`shot ${slug}-${vp.name}`);
    } catch (e) {
      console.log(`skip ${slug}-${vp.name}: ${String(e).slice(0, 120)}`);
    }
  }
  await ctx.close();
}
await browser.close();
const files = readdirSync(".ui-review").filter((f) => f.endsWith(".png"));
console.log(`screenshots done — captured ${shot}, files on disk: ${files.length} [${files.join(", ")}]`);
if (files.length === 0) {
  console.error("WARNING: zero screenshots captured — the design review will have nothing to look at.");
}
