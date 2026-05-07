import {
  SHARED_FILES,
  basePackageJson,
  baseGlobalsCss,
  baseLayout,
  readme,
} from "./shared";
import type { TemplateModule } from "./types";

interface Feature {
  title: string;
  body: string;
}

const meta = {
  id: "landing-page",
  name: "Landing Page",
  description: "Single-page marketing site with hero, features, and CTA.",
  tags: ["marketing", "website", "site", "landing", "homepage"],
  estimated_build_time_seconds: 50,
  customization_schema: {
    business_name: { type: "string" as const, required: true },
    tagline: { type: "string" as const, required: true },
    hero_copy: { type: "string" as const, required: true },
    features: {
      type: "array" as const,
      required: true,
      min_items: 3,
      max_items: 6,
    },
    cta_text: { type: "string" as const, default: "Get started" },
    cta_url: { type: "string" as const, default: "#" },
    primary_color: {
      type: "string" as const,
      format: "hex" as const,
      default: "#FF8A3D",
    },
  },
  marketing_handoff: ["tagline", "hero_copy", "features", "cta_text"],
};

export const landingPageTemplate: TemplateModule = {
  meta,
  generateFiles: (config) => {
    const businessName = String(config.business_name ?? "Your Business");
    const tagline = String(config.tagline ?? "What we do, in a sentence.");
    const heroCopy = String(
      config.hero_copy ??
        "We help our customers do something specific, faster than the alternative.",
    );
    const features = (Array.isArray(config.features) ? config.features : [
      { title: "Built for speed", body: "Ship in days, not months." },
      { title: "Designed for clarity", body: "No noise, just outcomes." },
      { title: "Made to scale", body: "Grows with your business." },
    ]) as Feature[];
    const ctaText = String(config.cta_text ?? "Get started");
    const ctaUrl = String(config.cta_url ?? "#");
    const primary = String(config.primary_color ?? "#FF8A3D");
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const featuresJson = JSON.stringify(features);

    return {
      ...SHARED_FILES,
      "package.json": basePackageJson(slug || "site"),
      "src/app/globals.css": baseGlobalsCss(primary),
      "src/app/layout.tsx": baseLayout(`${businessName} — ${tagline}`),
      "src/app/page.tsx": `import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
`,
      "src/components/Hero.tsx": `export default function Hero() {
  return (
    <section className="px-6 pt-32 pb-20 max-w-5xl mx-auto text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)] mb-6">
        ${tagline.replace(/`/g, "'")}
      </p>
      <h1 className="serif text-4xl md:text-6xl leading-[1.05]">
        ${heroCopy.replace(/`/g, "'")}
      </h1>
      <div className="mt-10">
        <a href="${ctaUrl}" className="btn-primary">${ctaText} →</a>
      </div>
    </section>
  );
}
`,
      "src/components/Features.tsx": `const FEATURES = ${featuresJson};

export default function Features() {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto border-t border-[var(--color-border)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <div key={i} className="hairline rounded-2xl p-6">
            <h3 className="serif text-xl mb-2">{f.title}</h3>
            <p className="text-[var(--color-fg-muted)]">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
`,
      "src/components/CTA.tsx": `export default function CTA() {
  return (
    <section className="px-6 py-24 text-center border-t border-[var(--color-border)]">
      <h2 className="serif text-3xl md:text-4xl mb-6">Ready when you are.</h2>
      <a href="${ctaUrl}" className="btn-primary">${ctaText} →</a>
    </section>
  );
}
`,
      "src/components/Footer.tsx": `export default function Footer() {
  return (
    <footer className="px-6 py-10 text-center text-xs text-[var(--color-fg-muted)] border-t border-[var(--color-border)]">
      © ${new Date().getFullYear()} ${businessName.replace(/`/g, "'")}. All rights reserved.
    </footer>
  );
}
`,
      "README.md": readme(businessName, businessName),
    };
  },
};
