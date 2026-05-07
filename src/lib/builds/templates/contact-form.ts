import {
  SHARED_FILES,
  basePackageJson,
  baseGlobalsCss,
  baseLayout,
  readme,
} from "./shared";
import type { TemplateModule } from "./types";

const meta = {
  id: "contact-form",
  name: "Contact Form",
  description: "Standalone contact-form page that posts to a webhook.",
  tags: ["contact", "form", "support", "inbox"],
  estimated_build_time_seconds: 35,
  customization_schema: {
    business_name: { type: "string" as const, required: true },
    headline: { type: "string" as const, required: true },
    intro_copy: { type: "string" as const, required: true },
    submit_url: { type: "string" as const, default: "" },
    primary_color: {
      type: "string" as const,
      format: "hex" as const,
      default: "#FF8A3D",
    },
  },
  marketing_handoff: ["headline", "intro_copy"],
};

export const contactFormTemplate: TemplateModule = {
  meta,
  generateFiles: (config) => {
    const businessName = String(config.business_name ?? "Your Business");
    const headline = String(config.headline ?? "Get in touch");
    const intro = String(
      config.intro_copy ??
        "Drop us a note. We respond within one business day.",
    );
    const submitUrl = String(config.submit_url ?? "");
    const primary = String(config.primary_color ?? "#FF8A3D");
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return {
      ...SHARED_FILES,
      "package.json": basePackageJson(slug || "contact-form"),
      "src/app/globals.css": baseGlobalsCss(primary),
      "src/app/layout.tsx": baseLayout(`${businessName} — Contact`),
      "src/app/page.tsx": `"use client";
import { useState } from "react";

const SUBMIT_URL = ${JSON.stringify(submitUrl)};

export default function Page() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
        body: JSON.stringify({ name, email, message }),
      });
      setStatus(r.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="serif text-4xl mb-3">${headline.replace(/`/g, "'")}</h1>
        <p className="text-[var(--color-fg-muted)] mb-8">${intro.replace(/`/g, "'")}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full hairline rounded-xl px-4 py-3 bg-transparent outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full hairline rounded-xl px-4 py-3 bg-transparent outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="What's up?"
            required
            className="w-full hairline rounded-xl px-4 py-3 bg-transparent outline-none resize-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-primary w-full justify-center"
          >
            {status === "sending" ? "Sending…" : "Send"}
          </button>
        </form>
        {status === "ok" && (
          <p className="mt-4 text-center text-sm" style={{ color: "var(--color-accent)" }}>
            Thanks. We'll be in touch.
          </p>
        )}
        {status === "err" && (
          <p className="mt-4 text-center text-sm">
            Couldn't send right now. Try again in a moment.
          </p>
        )}
      </div>
    </main>
  );
}
`,
      "README.md": readme(businessName + " Contact Form", businessName),
    };
  },
};
