import { MetadataRoute } from "next";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://conduitai.io";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/approach`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/products`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/products/praxis-console`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/products/praxis-hq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/products/praxis-mobile`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/customers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/customers/lunaro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/trust`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/engineering`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/changelog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  { url: `${BASE}/careers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE}/legal/acceptable-use`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
];

// Auto-include every static blog page in /public (blog.html + blog-*.html) so
// search engines can actually discover them. These were previously missing from
// the sitemap entirely — the root cause of zero organic indexing. New posts
// dropped into /public are picked up automatically. Wrapped in try/catch so a
// filesystem hiccup can never break the production build.
function blogRoutes(): MetadataRoute.Sitemap {
  try {
    const publicDir = join(process.cwd(), "public");
    return readdirSync(publicDir)
      .filter((f) => f.startsWith("blog") && f.endsWith(".html"))
      .map((f) => ({
        url: `${BASE}/${f}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: f === "blog.html" ? 0.7 : 0.6,
      }));
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [...STATIC_ROUTES, ...blogRoutes()];
}
