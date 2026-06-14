"use client";

import { ALL_EMPLOYEES } from "@/lib/conduit/employees";
import { EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";

const BIOS: Record<string, string> = {
  jarvis:
    "Routes every request to the right specialist and stays in the loop to coordinate hand-offs and close gaps. One message reaches your whole team — Atlas is the connective tissue.",
  marketing:
    "Writes blog posts, social captions, ad copy, and launch announcements in your brand's voice. Tell Marketing the goal; it handles the brief, the draft, and the publish.",
  sales:
    "Builds cold-outreach sequences, researches prospects, and drafts follow-up emails that convert. Hand Sales a list of leads and a product one-pager; it comes back with a working campaign.",
  engineering:
    "Takes a ticket or a Figma link and turns it into working code with a PR, build logs, and a deploy preview. Engineering is the only specialist that ships files directly to your repo.",
  finance:
    "Models your P&L, projects cash flow, calculates commissions, and flags anomalies in real time. Give Finance your numbers and get back a clear picture of where your business stands.",
  compliance:
    "Maps relevant regulations to your industry, flags exposure, and drafts internal policies that satisfy auditors. Compliance watches the rulebook so you never have to read it yourself.",
  hr:
    "Writes job descriptions, offer letters, and employee handbooks that match your culture and jurisdiction. When someone is joining or leaving, HR handles the paperwork trail end-to-end.",
  ops:
    "Turns vague processes into documented SOPs, schedules recurring tasks, and coordinates internal logistics. Operations keeps the machine running so your team is never blocked waiting on each other.",
  legal:
    "First-drafts NDAs, contractor agreements, and basic licensing terms ready for attorney review. Legal removes the blank-page problem from every contract negotiation.",
};

export default function SpecialistShowcase() {
  return (
    <section
      id="meet-the-team"
      style={{
        background: "var(--color-surface, #0a0a0f)",
        borderTop: "1px solid var(--color-border, rgba(255,255,255,0.07))",
        padding: "80px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-accent-hi, var(--color-accent, #6366f1))",
              marginBottom: 12,
            }}
          >
            Nine specialists. Zero payroll.
          </p>
          <h2
            className="serif"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 400,
              color: "var(--color-text, #f5f5f5)",
              lineHeight: 1.15,
            }}
          >
            Meet your team
          </h2>
          <p
            style={{
              marginTop: 12,
              maxWidth: 480,
              marginInline: "auto",
              fontSize: 15,
              color: "var(--color-text-muted, rgba(245,245,245,0.55))",
              lineHeight: 1.6,
            }}
          >
            Each specialist runs autonomously, hands off seamlessly, and shares
            one unified memory of your business.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {ALL_EMPLOYEES.map((emp) => {
            const Icon = EMPLOYEE_ICON[emp.id];
            const bio = BIOS[emp.id] ?? emp.tagline;
            return (
              <SpecialistCard
                key={emp.id}
                icon={<Icon size={20} strokeWidth={1.75} />}
                name={emp.name}
                role={emp.role}
                bio={bio}
                color={emp.color}
                colorSoft={emp.colorSoft}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SpecialistCard({
  icon,
  name,
  role,
  bio,
  color,
  colorSoft,
}: {
  icon: React.ReactNode;
  name: string;
  role: string;
  bio: string;
  color: string;
  colorSoft: string;
}) {
  return (
    <div
      className="specialist-card"
      style={
        {
          "--dept-color": color,
          "--dept-color-soft": colorSoft,
        } as React.CSSProperties
      }
    >
      <div className="specialist-card-icon-wrap">{icon}</div>
      <div>
        <div className="specialist-card-name">{name}</div>
        <div className="specialist-card-role">{role}</div>
      </div>
      <p className="specialist-card-bio">{bio}</p>
      <style>{`
        .specialist-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--color-border, rgba(255,255,255,0.07));
          background: var(--color-surface-elevated, rgba(255,255,255,0.03));
          transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
          cursor: default;
        }
        .specialist-card:hover {
          border-color: var(--dept-color);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--dept-color) 18%, transparent);
        }
        .specialist-card-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--dept-color-soft);
          color: var(--dept-color);
          flex-shrink: 0;
        }
        .specialist-card-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text, #f5f5f5);
          line-height: 1.2;
        }
        .specialist-card-role {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--dept-color);
          margin-top: 2px;
        }
        .specialist-card-bio {
          font-size: 13px;
          color: var(--color-text-muted, rgba(245,245,245,0.55));
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
