// Screenshots key live pages at desktop + mobile widths into .ui-review/ for the
// visual design-review loop (ui-design-review.yml). Best-effort: never hard-fails.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.UI_BASE || "https://conduitai.io";
const ROUTES = ["/", "/pricing", "/about", "/approach", "/trust", "/auth/sign-in"];
const VIEWPORTS = [{ name: "desktop", width: 1280, height: 900 }, { name: "mobile", width: 390, height: 844 }];

mkdirSync(".ui-review", { recursive: true });
const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const slug = (route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""));
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `.ui-review/${slug}-${vp.name}.png`, fullPage: true });
      console.log(`shot ${slug}-${vp.name}`);
    } catch (e) {
      console.log(`skip ${slug}-${vp.name}: ${String(e).slice(0, 80)}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log("screenshots done");
