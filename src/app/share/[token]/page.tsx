import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import {
  DEPT_COLOR,
  DEPT_COLOR_SOFT,
  employeeLabel,
} from "@/components/conduit/EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

const VALID_EMPLOYEES: EmployeeKey[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
  "finance",
  "compliance",
  "hr",
  "ops",
  "legal",
];

function asEmployee(s: string): EmployeeKey {
  return (VALID_EMPLOYEES.includes(s as EmployeeKey) ? s : "jarvis") as EmployeeKey;
}

interface SharedArtifact {
  title: string;
  content: string;
  type: string;
  produced_by: string;
  created_at: string;
}

async function fetchSharedArtifact(token: string): Promise<SharedArtifact | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("conduit_artifacts")
    .select("title, content, type, produced_by, created_at")
    .eq("share_token", token)
    .maybeSingle();
  return data as SharedArtifact | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const artifact = await fetchSharedArtifact(token);
  if (!artifact) return { title: "Not found — Praxis" };
  return {
    title: `${artifact.title} — Praxis`,
    description: `A deliverable from your Praxis AI team`,
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const artifact = await fetchSharedArtifact(token);
  if (!artifact) notFound();

  const emp = asEmployee(artifact.produced_by);
  const deptColor = DEPT_COLOR[emp];
  const deptColorSoft = DEPT_COLOR_SOFT[emp];
  const specialist = employeeLabel(emp);
  const date = new Date(artifact.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="praxis-root conduit-bg-canvas min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <Link href="/" aria-label="Praxis home">
          <PraxisLogo size={28} withWordmark />
        </Link>
        <Link
          href="/auth/sign-up"
          className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
        >
          Try Praxis →
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="inline-flex items-center justify-center rounded-lg px-3 py-1 text-[11px] uppercase tracking-[0.18em] font-semibold"
            style={{ background: deptColorSoft, color: deptColor }}
          >
            {specialist}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {(artifact.type as string).replace("_", " ")}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">·</span>
          <span className="text-xs text-[var(--color-text-muted)]">{date}</span>
        </div>

        {/* Title */}
        <h1 className="serif text-3xl sm:text-4xl leading-snug mb-8">
          {artifact.title}
        </h1>

        {/* Content */}
        <div
          className="conduit-card px-8 py-8 rounded-2xl"
          style={{ borderLeft: `3px solid ${deptColor}` }}
        >
          <pre className="text-sm text-[var(--color-text)] font-[var(--font-sans)] whitespace-pre-wrap leading-relaxed">
            {artifact.content}
          </pre>
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Delivered by{" "}
            <span className="font-medium text-[var(--color-text)]">Praxis</span>
            {" "}— your AI specialist team.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] text-white px-6 py-3 text-sm font-semibold hover:bg-[var(--color-accent-hi)] transition-colors"
          >
            Put your team to work →
          </Link>
        </div>
      </div>
    </main>
  );
}
