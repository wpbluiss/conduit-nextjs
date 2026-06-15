"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Loader2,
  PhoneCall,
  Search,
  Send,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/conduit/ui/Button";
import {
  VERTICALS,
  VERTICAL_LABELS,
  type Vertical,
} from "@/lib/lead-sources/types";

interface Lead {
  id: string;
  source: string;
  business_name: string;
  vertical: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  intent_signal_text: string | null;
  intent_signal_score: number;
  status: "new" | "contacted" | "qualified" | "dead";
  enriched: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  initialLeads: Lead[];
  cities: string[];
  deptColor: string;
  deptColorSoft: string;
}

interface RefreshResponse {
  ok?: boolean;
  added?: number;
  updated?: number;
  skipped?: number;
  signals_found?: number;
  enriched?: number;
  errors_per_source?: Record<string, string | null>;
  error?: string;
}

const STATUS_LABELS: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  dead: "Discarded",
};

export default function LeadsTableClient({
  initialLeads,
  cities,
  deptColor,
  deptColorSoft,
}: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filterVertical, setFilterVertical] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [minIntent, setMinIntent] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [_, startTransition] = useTransition();
  const [refetching, setRefetching] = useState(false);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filterVertical && l.vertical !== filterVertical) return false;
      if (filterCity && l.city !== filterCity) return false;
      if (filterStatus && l.status !== filterStatus) return false;
      if (l.intent_signal_score < minIntent) return false;
      return true;
    });
  }, [leads, filterVertical, filterCity, filterStatus, minIntent]);

  async function refetchLeads(opts?: {
    vertical?: string;
    city?: string;
    status?: string;
    minScore?: number;
  }) {
    setRefetching(true);
    try {
      const params = new URLSearchParams();
      if (opts?.vertical) params.set("vertical", opts.vertical);
      if (opts?.city) params.set("city", opts.city);
      if (opts?.status) params.set("status", opts.status);
      if (opts?.minScore) params.set("min_intent_score", String(opts.minScore));
      const res = await fetch(`/api/sales/leads?${params.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as { leads: Lead[] };
      setLeads(json.leads ?? []);
    } finally {
      setRefetching(false);
    }
  }

  async function updateStatus(id: string, status: Lead["status"]) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l)),
    );
    try {
      await fetch("/api/sales/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (err) {
      console.error("status update failed", err);
    }
  }

  function draftOutreach(lead: Lead) {
    const ctx = [
      `Lead: ${lead.business_name}`,
      lead.address ? `Address: ${lead.address}` : null,
      `City: ${lead.city}, ${lead.state}`,
      lead.phone ? `Phone: ${lead.phone}` : null,
      lead.website ? `Website: ${lead.website}` : null,
      lead.rating != null ? `Rating: ${lead.rating} (${lead.review_count ?? 0} reviews)` : null,
      lead.intent_signal_text
        ? `Intent signal: "${lead.intent_signal_text}" (score ${lead.intent_signal_score})`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    const prompt = `Draft a cold outreach email for this real prospect. Keep it short, warm, and reference the intent signal if there is one. Do not exaggerate.\n\n${ctx}`;
    window.location.href = `/app?pin=sales&prompt=${encodeURIComponent(prompt)}`;
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 md:px-8 py-6 md:py-8 space-y-6">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: deptColor }}
            >
              Fresh Leads
            </div>
            <h2 className="serif text-xl mt-0.5">
              {filtered.length}{" "}
              <span className="text-[var(--color-text-muted)] text-sm font-normal">
                {filtered.length === 1 ? "prospect" : "prospects"}
              </span>
            </h2>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="!text-sm inline-flex items-center gap-2"
            style={{ background: deptColor, color: "var(--cx-canvas, #0B0B0F)" }}
          >
            <Search size={14} />
            Run Discovery
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FilterSelect
            label="Vertical"
            value={filterVertical}
            onChange={setFilterVertical}
            options={[
              { value: "", label: "All" },
              ...VERTICALS.map((v) => ({
                value: v,
                label: VERTICAL_LABELS[v],
              })),
            ]}
          />
          <FilterSelect
            label="City"
            value={filterCity}
            onChange={setFilterCity}
            options={[
              { value: "", label: "All" },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "", label: "All" },
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" },
              { value: "qualified", label: "Qualified" },
              { value: "dead", label: "Discarded" },
            ]}
          />
          <FilterSelect
            label="Min intent"
            value={String(minIntent)}
            onChange={(v) => setMinIntent(parseInt(v, 10) || 0)}
            options={[
              { value: "0", label: "Any" },
              { value: "21", label: "21+" },
              { value: "51", label: "51+" },
              { value: "81", label: "81+" },
            ]}
          />
          {refetching && (
            <span className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              refreshing
            </span>
          )}
        </div>

        {/* Leads list — card layout, mobile-first */}
        {filtered.length === 0 ? (
          <div
            className="conduit-card p-8 text-center"
            style={{
              boxShadow: `inset 0 0 0 1px ${deptColorSoft}`,
              background: `linear-gradient(180deg, ${deptColorSoft}, transparent 80%)`,
            }}
          >
            <p className="text-[var(--color-text)]">
              No leads match these filters.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-3 text-sm"
              style={{ color: deptColor }}
            >
              Run Discovery →
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                deptColor={deptColor}
                deptColorSoft={deptColorSoft}
                onDraft={() => draftOutreach(lead)}
                onMarkContacted={() => updateStatus(lead.id, "contacted")}
                onDiscard={() => updateStatus(lead.id, "dead")}
              />
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <RunDiscoveryModal
          deptColor={deptColor}
          onClose={() => setShowModal(false)}
          onComplete={() => {
            setShowModal(false);
            startTransition(() => refetchLeads());
          }}
        />
      )}
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-[var(--color-text-muted)] uppercase tracking-[0.12em]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--color-bg-elevated,rgba(255,255,255,0.03))] border border-[var(--color-border)] rounded-md px-2 py-1 text-[var(--color-text)] text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LeadCard({
  lead,
  deptColor,
  deptColorSoft,
  onDraft,
  onMarkContacted,
  onDiscard,
}: {
  lead: Lead;
  deptColor: string;
  deptColorSoft: string;
  onDraft: () => void;
  onMarkContacted: () => void;
  onDiscard: () => void;
}) {
  const isDead = lead.status === "dead";
  return (
    <li>
      <div
        className="conduit-card border-l-[3px] px-4 py-3 transition-colors"
        style={{
          borderLeftColor:
            lead.intent_signal_score >= 51
              ? deptColor
              : lead.intent_signal_score >= 21
                ? deptColorSoft
                : "var(--color-border)",
          opacity: isDead ? 0.45 : 1,
        }}
      >
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[var(--color-text)] font-medium truncate">
                {lead.business_name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                {lead.vertical.replace("_", " ")} · {lead.city}
              </span>
              {lead.intent_signal_score > 0 && (
                <span
                  className="text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded"
                  style={{ background: deptColorSoft, color: deptColor }}
                >
                  intent {lead.intent_signal_score}
                </span>
              )}
              {lead.status !== "new" && (
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {STATUS_LABELS[lead.status]}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-muted)] truncate">
              {lead.address || "—"}
              {lead.phone && ` · ${lead.phone}`}
              {lead.rating != null && ` · ★ ${lead.rating}`}
              {lead.review_count != null && ` (${lead.review_count})`}
            </div>
            {lead.intent_signal_text && (
              <div className="mt-1.5 text-xs italic text-[var(--color-text-muted)] line-clamp-2">
                “{lead.intent_signal_text}”
              </div>
            )}
          </div>
          {!isDead && (
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onDraft}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)]"
                title="Draft cold outreach"
              >
                <Send size={12} />
                <span className="hidden sm:inline">Draft</span>
              </button>
              <button
                type="button"
                onClick={onMarkContacted}
                disabled={lead.status === "contacted"}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] disabled:opacity-50"
                title="Mark contacted"
              >
                {lead.status === "contacted" ? (
                  <Check size={12} />
                ) : (
                  <PhoneCall size={12} />
                )}
                <span className="hidden sm:inline">
                  {lead.status === "contacted" ? "Contacted" : "Mark contacted"}
                </span>
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
                title="Discard"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

interface ModalProps {
  deptColor: string;
  onClose: () => void;
  onComplete: () => void;
}

function RunDiscoveryModal({ deptColor, onClose, onComplete }: ModalProps) {
  const [vertical, setVertical] = useState<Vertical>("med_spa");
  const [city, setCity] = useState<string>("West Palm Beach");
  const [useOverpass, setUseOverpass] = useState(true);
  const [useReddit, setUseReddit] = useState(true);
  const [useMaps, setUseMaps] = useState(true);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<string>("");
  const [result, setResult] = useState<RefreshResponse | null>(null);

  async function start() {
    setRunning(true);
    setResult(null);
    setPhase("Discovering on OpenStreetMap…");

    const sources: string[] = [];
    if (useOverpass) sources.push("overpass");
    if (useReddit) sources.push("reddit");
    if (useMaps) sources.push("google_maps");

    // Soft progress hints — actual work happens server-side in one round-trip.
    const hint = setInterval(() => {
      setPhase((p) => {
        if (p.startsWith("Discovering")) return "Reading Reddit for intent…";
        if (p.startsWith("Reading Reddit")) return "Enriching with Maps…";
        return p;
      });
    }, 8000);

    try {
      const res = await fetch("/api/sales/refresh-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vertical, city, sources }),
      });
      const json = (await res.json()) as RefreshResponse;
      setResult(json);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      clearInterval(hint);
      setRunning(false);
      setPhase("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !running) onClose();
      }}
    >
      <div className="conduit-card max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="serif text-xl">Run Discovery</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="block text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em] mb-1">
              Vertical
            </span>
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value as Vertical)}
              disabled={running}
              className="w-full bg-[var(--color-bg-elevated,rgba(255,255,255,0.03))] border border-[var(--color-border)] rounded-md px-3 py-2"
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {VERTICAL_LABELS[v]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em] mb-1">
              City
            </span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={running}
              className="w-full bg-[var(--color-bg-elevated,rgba(255,255,255,0.03))] border border-[var(--color-border)] rounded-md px-3 py-2"
            >
              <option>West Palm Beach</option>
              <option>Boca Raton</option>
              <option>Delray Beach</option>
              <option>Jupiter</option>
            </select>
          </label>

          <fieldset className="space-y-1.5">
            <legend className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.12em] mb-1">
              Sources
            </legend>
            <SourceToggle
              label="OpenStreetMap (discovery)"
              checked={useOverpass}
              onChange={setUseOverpass}
              disabled={running}
            />
            <SourceToggle
              label="Reddit (intent signals)"
              checked={useReddit}
              onChange={setUseReddit}
              disabled={running}
            />
            <SourceToggle
              label="Google Maps (rating + reviews)"
              checked={useMaps}
              onChange={setUseMaps}
              disabled={running}
            />
          </fieldset>
        </div>

        {running && (
          <div
            className="rounded-md p-3 text-sm flex items-center gap-2"
            style={{
              background: `color-mix(in srgb, ${deptColor} 10%, transparent)`,
              color: deptColor,
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            <span>{phase || "Working…"}</span>
          </div>
        )}

        {result && !result.error && (
          <div className="rounded-md p-3 text-sm space-y-1 border border-[var(--color-border)]">
            <div className="font-medium text-[var(--color-text)]">
              {result.added ?? 0} new · {result.updated ?? 0} boosted ·{" "}
              {result.enriched ?? 0} enriched
            </div>
            {result.signals_found != null && (
              <div className="text-xs text-[var(--color-text-muted)]">
                {result.signals_found} intent signal
                {result.signals_found === 1 ? "" : "s"} captured.
              </div>
            )}
            {result.errors_per_source &&
              Object.entries(result.errors_per_source).some(
                ([, v]) => v != null,
              ) && (
                <div className="text-xs text-[var(--color-text-muted)]">
                  {Object.entries(result.errors_per_source)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </div>
              )}
          </div>
        )}

        {result?.error && (
          <div className="rounded-md p-3 text-sm border border-red-500/30 text-red-400">
            {result.error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {result ? (
            <Button
              onClick={onComplete}
              className="!text-sm"
              style={{ background: deptColor, color: "var(--cx-canvas, #0B0B0F)" }}
            >
              Done
            </Button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={running}
                className="text-sm px-3 py-1.5 text-[var(--color-text-muted)] disabled:opacity-30"
              >
                Cancel
              </button>
              <Button
                onClick={start}
                disabled={running || (!useOverpass && !useReddit && !useMaps)}
                className="!text-sm disabled:opacity-50"
                style={{ background: deptColor, color: "var(--cx-canvas, #0B0B0F)" }}
              >
                {running ? "Running…" : "Start"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceToggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="accent-current"
      />
      <span className="text-[var(--color-text)]">{label}</span>
    </label>
  );
}
