/**
 * TEMPORARY SCRATCH ROUTE — Phase 2+3 verification of the R15 design
 * system tokens, primitives, and components.
 *
 * Delete this directory before the Phase 9 PR merges
 * (per tasks.md T025, T040).
 *
 * Visit: http://localhost:3000/app/praxis-scratch
 *
 * What to verify here (Phase 3 additions):
 *  - PraxisAvatar (atlas variant, ghosted variant, all sizes)
 *  - PraxisCard (kpi / team / stat / activity, locked state)
 *  - PraxisPulsePip (ambient / streaming / rest)
 *  - PraxisWelcomeHero (with primaryEvent + activity bucket)
 *  - PraxisLiveStrip (with rejoin CTA)
 *  - PraxisSuggestionTile (4 tiles, attributed)
 *  - PraxisTeamRoster (full 9-card grid with mock data)
 *  - PraxisHandoffBaton (Atlas → Engineering animation)
 *  - PraxisComposerPill (pin dropdown, focus ring, mic, send)
 *  - PraxisCanvasTintProvider (hover-tint follows team-card hover)
 *
 * Phase 4+ will consume these on the real /app/workspace and /app
 * surfaces; this scratch route is the only place they coexist with
 * mock data.
 */

"use client";

import { useState } from "react";
import { PraxisAvatar } from "@/components/conduit/praxis/PraxisAvatar";
import { PraxisCard } from "@/components/conduit/praxis/PraxisCard";
import { PraxisPulsePip } from "@/components/conduit/praxis/PraxisPulsePip";
import { PraxisWelcomeHero } from "@/components/conduit/praxis/PraxisWelcomeHero";
import { PraxisLiveStrip } from "@/components/conduit/praxis/PraxisLiveStrip";
import { PraxisSuggestionTile } from "@/components/conduit/praxis/PraxisSuggestionTile";
import { PraxisTeamRoster } from "@/components/conduit/praxis/PraxisTeamRoster";
import { PraxisHandoffBaton } from "@/components/conduit/praxis/PraxisHandoffBaton";
import { PraxisComposerPill, type PinValue } from "@/components/conduit/praxis/PraxisComposerPill";
import { PraxisCanvasTintProvider } from "@/components/conduit/praxis/PraxisCanvasTintProvider";
import type { EmployeeId } from "@/lib/conduit/employees";
import type { TeamActivityBundle } from "@/lib/conduit/team-activity";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

// Mock data for team-roster preview
function mockBundle(): TeamActivityBundle {
  const employees = Object.fromEntries(
    EMPLOYEE_ORDER.map((e) => [e, {
      last_active_at: new Date(Date.now() - Math.random() * 3600_000).toISOString(),
      last_artifact_title: null as string | null,
      last_artifact_created_at: null as string | null,
      in_flight_build_id: null as string | null,
      top_lead_score: null as number | null,
      top_lead_name: null as string | null,
    }]),
  ) as TeamActivityBundle["employees"];
  // Marketing shipped something 12 min ago
  employees.marketing.last_artifact_title = "3-post blog draft on cold outreach";
  employees.marketing.last_artifact_created_at = new Date(Date.now() - 12 * 60_000).toISOString();
  // Engineering has a build in flight
  employees.engineering.in_flight_build_id = "build-123";
  // Sales has a hot lead
  employees.sales.top_lead_score = 92;
  employees.sales.top_lead_name = "Acme Corp";
  return {
    employees,
    voice_live: null,
  };
}

const ALL_PIN_OPTIONS = [
  { value: "auto" as PinValue, label: "Atlas (auto-route)" },
  { value: "team" as PinValue, label: "Team round-table" },
  { value: "jarvis" as PinValue, label: "Atlas only" },
  { value: "marketing" as PinValue, label: "Marketing" },
  { value: "sales" as PinValue, label: "Sales" },
  { value: "engineering" as PinValue, label: "Engineering" },
  { value: "finance" as PinValue, label: "Finance" },
  { value: "compliance" as PinValue, label: "Compliance" },
  { value: "hr" as PinValue, label: "HR" },
  { value: "ops" as PinValue, label: "Operations" },
  { value: "legal" as PinValue, label: "Legal" },
];

const FREE_TIER_ALLOWED: EmployeeId[] = ["jarvis", "marketing", "sales"];

export default function ScratchVerificationPage() {
  const [bundle] = useState(mockBundle);
  const [pin, setPin] = useState<PinValue>("auto");
  const [composerValue, setComposerValue] = useState("");
  const [showLive, setShowLive] = useState(false);
  const [showLockedTier, setShowLockedTier] = useState(false);

  const allowedSet = new Set<EmployeeId>(
    showLockedTier ? FREE_TIER_ALLOWED : EMPLOYEE_ORDER,
  );

  return (
    <PraxisCanvasTintProvider initialDept={null}>
      <div className="praxis-canvas-tint flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto max-w-5xl space-y-12">

          {/* Page header */}
          <header className="space-y-3">
            <p className="praxis-eyebrow">
              <span className="praxis-pulse-pip" data-dept="sales" data-state="ambient" aria-hidden />
              Scratch route · Phase 2+3 verification
            </p>
            <h1 className="praxis-display-1">
              Praxis design system — full primitive set
            </h1>
            <p className="praxis-body-lg" style={{ maxWidth: "44rem" }}>
              Every primitive + every component rendered against mock data.
              Hover team cards to confirm canvas tint follows. Toggle
              locked-tier + voice-live below. Delete this route before
              merge.
            </p>
          </header>

          {/* Mode toggles */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">Mode</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLive((v) => !v)}
                className="praxis-tag-locked"
                style={{ cursor: "pointer" }}
              >
                Voice live: {showLive ? "ON" : "OFF"}
              </button>
              <button
                type="button"
                onClick={() => setShowLockedTier((v) => !v)}
                className="praxis-tag-locked"
                style={{ cursor: "pointer" }}
              >
                Tier: {showLockedTier ? "Free (6 locked)" : "Internal (all)"}
              </button>
            </div>
          </section>

          {/* PraxisLiveStrip (conditional) */}
          {showLive && (
            <section>
              <PraxisLiveStrip employee="engineering" rejoinHref="/app/voice" />
            </section>
          )}

          {/* PraxisWelcomeHero */}
          <section>
            <PraxisWelcomeHero
              activityBucket="high"
              copy={{
                eyebrow: "While you were away",
                headline: "Welcome back, Luis. Marketing finished the 3-post draft.",
                subline: "Marketing shipped this on its own. Take a look.",
                primaryEventEmployee: "marketing",
                primaryEventHref: "/app/team/marketing",
              }}
            />
          </section>

          {/* KPI tiles */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">KPI tiles (operational row)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "var(--space-3)" }}>
              <PraxisCard variant="kpi" dept="jarvis" href="/app/team/jarvis">
                <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
                  ATLAS PINGED YOU
                </p>
                <p className="praxis-body-sm" style={{ color: "var(--color-text)" }}>
                  You mentioned wanting to grow LinkedIn presence — I have a draft plan
                </p>
              </PraxisCard>
              <PraxisCard variant="kpi" dept="sales" href="/app/team/sales">
                <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
                  PIPELINE
                </p>
                <p className="praxis-numeric-display">12</p>
                <p className="praxis-microlabel" style={{ marginTop: "var(--space-2)" }}>
                  Top: Acme Corp
                </p>
              </PraxisCard>
              <PraxisCard variant="kpi" dept="marketing" href="/app?c=mock">
                <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
                  LAST CONVERSATION
                </p>
                <p className="praxis-body-sm" style={{ color: "var(--color-text)" }}>
                  Cold outreach campaign draft
                </p>
              </PraxisCard>
              <PraxisCard variant="kpi" href="/app/voice">
                <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
                  VOICE TODAY
                </p>
                <p className="praxis-numeric-display">23 <span style={{ fontSize: "1rem", color: "var(--color-text-muted)" }}>/ 60</span></p>
              </PraxisCard>
            </div>
          </section>

          {/* Team roster */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">Team roster — hover to tint canvas</p>
            <PraxisTeamRoster
              initial={bundle}
              allowedEmployees={allowedSet}
              mostEngagedDept="marketing"
              pollIntervalMs={0}
            />
          </section>

          {/* Stat tiles */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">Stat tiles (in-page, no hover)</p>
            <div className="grid grid-cols-3" style={{ gap: "var(--space-3)" }}>
              {[
                { label: "Artifacts produced", value: "38" },
                { label: "Conversations", value: "12" },
                { label: "Last active", value: "3m ago" },
              ].map((s) => (
                <PraxisCard key={s.label} variant="stat">
                  <p className="praxis-microlabel">{s.label}</p>
                  <p className="praxis-numeric-display" style={{ marginTop: "var(--space-1)" }}>
                    {s.value}
                  </p>
                </PraxisCard>
              ))}
            </div>
          </section>

          {/* Suggestion tiles */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">Suggestion tiles (chat empty)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-3)" }}>
              <PraxisSuggestionTile
                dept="jarvis"
                hint="Atlas will route this"
                prompt="Help me grow my business"
              />
              <PraxisSuggestionTile
                dept="marketing"
                pin="marketing"
                hint="Marketing builds the play"
                prompt="Write me 3 blog posts about getting my first 10 customers"
              />
              <PraxisSuggestionTile
                dept="engineering"
                pin="engineering"
                hint="Engineering plans the build"
                prompt="How would you build me a CRM?"
              />
              <PraxisSuggestionTile
                dept="sales"
                pin="sales"
                hint="Sales drafts the campaign"
                prompt="Draft me a cold outreach campaign"
              />
            </div>
          </section>

          {/* Handoff baton */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">Handoff baton — Atlas → Engineering</p>
            <PraxisHandoffBaton from="jarvis" to="engineering" />
          </section>

          {/* Avatar matrix */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">Avatar sizes (Atlas auto-promotes to lg)</p>
            <div className="flex items-end gap-4">
              <PraxisAvatar employee="jarvis" size="sm" />
              <PraxisAvatar employee="jarvis" size="md" />
              <PraxisAvatar employee="jarvis" size="lg" />
              <PraxisAvatar employee="jarvis" size="xl" />
              <PraxisAvatar employee="jarvis" size="2xl" />
              <span className="praxis-microlabel" style={{ marginLeft: "var(--space-3)" }}>
                Atlas (spine)
              </span>
            </div>
            <div className="flex items-end gap-4" style={{ marginTop: "var(--space-3)" }}>
              <PraxisAvatar employee="marketing" size="sm" />
              <PraxisAvatar employee="marketing" size="md" />
              <PraxisAvatar employee="marketing" size="lg" />
              <PraxisAvatar employee="marketing" size="xl" />
              <PraxisAvatar employee="marketing" size="2xl" />
              <span className="praxis-microlabel" style={{ marginLeft: "var(--space-3)" }}>
                Marketing (peer)
              </span>
            </div>
            <div className="flex items-end gap-4" style={{ marginTop: "var(--space-3)" }}>
              <PraxisAvatar employee="compliance" size="lg" ghosted />
              <PraxisAvatar employee="hr" size="lg" ghosted />
              <PraxisAvatar employee="legal" size="lg" ghosted />
              <span className="praxis-microlabel" style={{ marginLeft: "var(--space-3)" }}>
                Ghosted (tier-locked)
              </span>
            </div>
          </section>

          {/* Pulse pips */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">Pulse pips — states</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <PraxisPulsePip employee="engineering" state="ambient" />
                <span className="praxis-microlabel">Ambient (2s)</span>
              </span>
              <span className="flex items-center gap-2">
                <PraxisPulsePip employee="engineering" state="streaming" />
                <span className="praxis-microlabel">Streaming (1.1s)</span>
              </span>
              <span className="flex items-center gap-2">
                <PraxisPulsePip employee="engineering" state="rest" />
                <span className="praxis-microlabel">Rest</span>
              </span>
            </div>
          </section>

          {/* Composer pill */}
          <section className="space-y-3">
            <p className="praxis-eyebrow">Composer pill (demoted rest / dept focus ring on pin)</p>
            <PraxisComposerPill
              value={composerValue}
              onChange={setComposerValue}
              onSubmit={() => alert(`would send: ${composerValue}`)}
              pin={pin}
              pinOptions={ALL_PIN_OPTIONS}
              onPinChange={setPin}
              speechSupported={true}
              speechListening={false}
              onSpeechToggle={() => {}}
              loading={false}
              streamingEmployee={null}
            />
            <p className="praxis-microlabel" style={{ marginTop: "var(--space-2)" }}>
              Try pinning Marketing or Engineering — canvas tints accordingly.
            </p>
          </section>

          {/* Footer */}
          <footer style={{ paddingTop: "var(--space-10)", borderTop: "1px solid var(--color-border)" }}>
            <p className="praxis-microlabel">
              Phase 2+3 scratch route · delete before final merge · tasks.md T025+T040
            </p>
          </footer>

        </div>
      </div>
    </PraxisCanvasTintProvider>
  );
}
