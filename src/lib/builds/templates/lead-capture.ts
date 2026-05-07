import {
  SHARED_FILES,
  basePackageJson,
  baseGlobalsCss,
  baseLayout,
  readme,
} from "./shared";
import type { TemplateModule } from "./types";

const meta = {
  id: "lead-capture",
  name: "Lead Capture",
  description: "One-page lead-capture site with hero + email form.",
  tags: ["lead", "capture", "email", "signup", "waitlist"],
  estimated_build_time_seconds: 40,
  customization_schema: {
    business_name: { type: "string" as const, required: true },
    headline: { type: "string" as const, required: true },
    sub_copy: { type: "string" as const, required: true },
    submit_url: { type: "string" as const, default: "" },
    cta_text: { type: "string" as const, default: "Notify me" },
    primary_color: {
      type: "string" as const,
      format: "hex" as const,
      default: "#FF8A3D",
    },
  },
  marketing_handoff: ["headline", "sub_copy", "cta_text"],
};

export const leadCaptureTemplate: TemplateModule = {
  meta,
  generateFiles: (config) => {
    const businessName = String(config.business_name ?? "Your Business");
    const headline = String(config.headline ?? "Coming soon");
    const subCopy = String(
      config.sub_copy ?? "Drop your email — we'll let you know when we launch.",
    );
    const submitUrl = String(config.submit_url ?? "");
    const ctaText = String(config.cta_text ?? "Notify me");
    const primary = String(config.primary_color ?? "#FF8A3D");
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return {
      ...SHARED_FILES,
      "package.json": basePackageJson(slug || "lead-capture"),
      "src/app/globals.css": baseGlobalsCss(primary),
      "src/app/layout.tsx": baseLayout(`${businessName} — ${headline}`),
      "src/app/page.tsx": `"use client";
import { useState } from "react";

const SUBMIT_URL = ${JSON.stringify(submitUrl)};

export default function Page() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    if (!SUBMIT_URL) {
      setStatus("ok");
      return;
    }
    try {
      const r = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(r.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)] mb-6">
          ${businessName.replace(/`/g, "'")}
        </p>
        <h1 className="serif text-5xl md:text-6xl leading-[1.05] mb-6">
          ${headline.replace(/`/g, "'")}
        </h1>
        <p className="text-[var(--color-fg-muted)] mb-10 max-w-md mx-auto">
          ${subCopy.replace(/`/g, "'")}
        </p>
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 hairline rounded-full px-5 py-3 bg-transparent outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-primary justify-center"
          >
            {status === "sending" ? "…" : "${ctaText.replace(/`/g, "'")}"}
          </button>
        </form>
        {status === "ok" && (
          <p className="mt-4 text-sm" style={{ color: "var(--color-accent)" }}>
            You're on the list.
          </p>
        )}
        {status === "err" && (
          <p className="mt-4 text-sm">
            Couldn't add you right now. Try again in a moment.
          </p>
        )}
      </div>
    </main>
  );
}
`,
      "README.md": readme(businessName + " Lead Capture", businessName),
    };
  },
};
