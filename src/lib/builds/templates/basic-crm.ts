import {
  SHARED_FILES,
  basePackageJson,
  baseGlobalsCss,
  baseLayout,
  readme,
} from "./shared";
import type { TemplateModule } from "./types";

const meta = {
  id: "basic-crm",
  name: "Basic CRM",
  description: "Single-user CRM — contacts list + simple kanban (localStorage).",
  tags: ["crm", "leads", "contacts", "pipeline", "kanban"],
  estimated_build_time_seconds: 70,
  customization_schema: {
    business_name: { type: "string" as const, required: true },
    pipeline_stages: {
      type: "array" as const,
      required: false,
      min_items: 2,
      max_items: 6,
    },
    primary_color: {
      type: "string" as const,
      format: "hex" as const,
      default: "#FF8A3D",
    },
  },
  marketing_handoff: [],
};

export const basicCrmTemplate: TemplateModule = {
  meta,
  generateFiles: (config) => {
    const businessName = String(config.business_name ?? "Your CRM");
    const stages = (
      Array.isArray(config.pipeline_stages)
        ? (config.pipeline_stages as string[])
        : ["Lead", "Qualified", "Proposal", "Closed Won"]
    ).map((s) => String(s));
    const primary = String(config.primary_color ?? "#FF8A3D");
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const stagesJson = JSON.stringify(stages);

    return {
      ...SHARED_FILES,
      "package.json": basePackageJson(slug ? `${slug}-crm` : "crm"),
      "src/app/globals.css": baseGlobalsCss(primary),
      "src/app/layout.tsx": baseLayout(`${businessName} — CRM`),
      "src/app/page.tsx": `"use client";
import { useEffect, useState } from "react";

const STAGES = ${stagesJson};

interface Contact {
  id: string;
  name: string;
  email: string;
  stage: string;
  notes: string;
}

const STORAGE_KEY = "conduit_crm_contacts_v1";

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setContacts(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setContacts([
      ...contacts,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim(),
        stage: STAGES[0],
        notes: "",
      },
    ]);
    setName("");
    setEmail("");
  };

  const move = (id: string, stage: string) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, stage } : c)));
  };

  const remove = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="max-w-6xl mx-auto mb-10">
        <h1 className="serif text-4xl">${businessName.replace(/`/g, "'")}</h1>
        <p className="text-[var(--color-fg-muted)] text-sm">Lightweight CRM. Data stays in your browser.</p>
      </header>

      <form onSubmit={add} className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3 mb-10">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="flex-1 hairline rounded-xl px-4 py-3 bg-transparent outline-none"
          required
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="flex-1 hairline rounded-xl px-4 py-3 bg-transparent outline-none"
          required
        />
        <button type="submit" className="btn-primary">
          Add contact
        </button>
      </form>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-${stages.length > 4 ? 4 : stages.length} gap-4">
        {STAGES.map((stage) => {
          const inStage = contacts.filter((c) => c.stage === stage);
          return (
            <div key={stage} className="hairline rounded-2xl p-4 min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="serif text-lg">{stage}</h3>
                <span className="text-xs text-[var(--color-fg-muted)]">
                  {inStage.length}
                </span>
              </div>
              <div className="space-y-2">
                {inStage.map((c) => (
                  <div key={c.id} className="hairline rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm">{c.name}</div>
                        <div className="text-xs text-[var(--color-fg-muted)]">
                          {c.email}
                        </div>
                      </div>
                      <button
                        onClick={() => remove(c.id)}
                        className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {STAGES.filter((s) => s !== stage).map((s) => (
                        <button
                          key={s}
                          onClick={() => move(c.id, s)}
                          className="text-[10px] uppercase tracking-[0.15em] hairline rounded-full px-2 py-1 hover:opacity-80"
                        >
                          → {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
`,
      "README.md": readme(`${businessName} CRM`, businessName),
    };
  },
};
