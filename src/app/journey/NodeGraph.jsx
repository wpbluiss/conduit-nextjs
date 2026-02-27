import { useState, useRef, useEffect, useCallback } from "react";

const CATEGORIES = {
  launch: { color: "#00d4ff", label: "Launch" },
  product: { color: "#0066ff", label: "Product" },
  marketing: { color: "#ff6b35", label: "Marketing" },
  revenue: { color: "#00ff88", label: "Revenue" },
  milestone: { color: "#ffd700", label: "Milestone" },
  infrastructure: { color: "#a855f7", label: "Infrastructure" },
};

const NODES = [
  // Foundation
  { id: "founding", label: "Conduit AI Founded", date: "Dec 2025", cat: "milestone", detail: "Luis Garcia, 21, starts building an AI-powered lead recovery platform while working full-time at a fire alarm company. No funding, no co-founder, just execution.", x: 0.12, y: 0.15 },
  { id: "stack", label: "Tech Stack Built", date: "Dec 2025", cat: "product", detail: "FastAPI backend, React frontend, Supabase for auth & data, Vapi.ai for voice AI, Twilio for telephony, Stripe for payments. Entire platform built solo.", x: 0.28, y: 0.1 },
  { id: "first_agent", label: "First AI Agent Live", date: "Jan 2026", cat: "product", detail: "Demo agent configured and live at (561) 730-3316. Natural voice conversations that capture caller details, qualify leads, and send instant notifications.", x: 0.42, y: 0.18 },
  
  // Early Growth
  { id: "first_client", label: "First Client: The G Room", date: "Jan 2026", cat: "revenue", detail: "Christian from The G Room barbershop becomes first client. Also sets up 20% referral commission structure. Proof of concept validated.", x: 0.15, y: 0.35 },
  { id: "multi_vertical", label: "Multi-Vertical Strategy", date: "Jan 2026", cat: "marketing", detail: "Expanded from contractor-focused to beauty/wellness, medical/dental, and roofing markets. Built specialized AI assistants for each vertical.", x: 0.32, y: 0.32 },
  { id: "cold_outreach", label: "Cold Outreach System", date: "Jan 2026", cat: "marketing", detail: "Apollo.io + Instantly.ai campaigns tracking hundreds of prospects. Breakthrough conversations by repositioning as 'lead recovery' instead of 'AI technology'.", x: 0.48, y: 0.28 },
  { id: "website_v1", label: "Website V1 Launch", date: "Jan 2026", cat: "launch", detail: "First website live on tiiny.host. Basic landing page with pricing and demo. Established conduitai.io domain.", x: 0.58, y: 0.12 },

  // February Buildout
  { id: "vercel_migration", label: "Vercel Migration", date: "Feb 2026", cat: "infrastructure", detail: "Migrated from tiiny.host to Vercel + Next.js for better performance, SEO, and deployment pipeline. One-command pushes via GitHub.", x: 0.65, y: 0.28 },
  { id: "seo_content", label: "SEO Blog Engine", date: "Feb 2026", cat: "marketing", detail: "5 SEO-optimized blog posts published. Topics: missed call costs, HVAC revenue loss, salon booking automation, AI vs answering services, phone statistics.", x: 0.52, y: 0.42 },
  { id: "affiliate", label: "Affiliate Program", date: "Feb 2026", cat: "revenue", detail: "20% recurring commission affiliate program launched. Partners earn on every referral, every month, forever.", x: 0.35, y: 0.48 },
  { id: "directory_blitz", label: "Directory Submissions", date: "Feb 2026", cat: "marketing", detail: "Submitted to BetaList, SaaSHub, G2, PeerPush, Product Hunt, and 10+ directories. Building backlinks and discovery channels.", x: 0.68, y: 0.42 },
  { id: "google_ads", label: "Google Ads Campaign", date: "Feb 2026", cat: "marketing", detail: "$500 Google Ads credit activated. Targeting 'AI receptionist', 'missed call recovery', 'answering service alternative' keywords.", x: 0.78, y: 0.18 },
  { id: "business_infra", label: "Business Infrastructure", date: "Feb 2026", cat: "infrastructure", detail: "Wells Fargo business account, Google Search Console verified, email forwarding for luis@conduitai.io, Stripe payments configured.", x: 0.22, y: 0.52 },

  // Launch Week
  { id: "product_hunt", label: "Product Hunt Launch", date: "Feb 24", cat: "launch", detail: "Conduit AI launched on Product Hunt. First major public debut of the platform to the startup community.", x: 0.82, y: 0.35 },
  { id: "first_signup", label: "First Signup!", date: "Feb 25", cat: "milestone", detail: "First organic signup received the day after Product Hunt launch. The funnel works — traffic → landing page → trial signup.", x: 0.88, y: 0.48 },
  { id: "heygen", label: "HeyGen Avatar Setup", date: "Feb 2026", cat: "marketing", detail: "AI avatar created for talking-head video content. Combined with CapCut editing for TikTok/Instagram distribution.", x: 0.75, y: 0.52 },
  { id: "mark_thomas", label: "Mark Thomas DM", date: "Feb 2026", cat: "milestone", detail: "Mark Thomas, influencer with 4.5M followers, DM'd about Conduit AI. Warm lead for potential partnership/promotion.", x: 0.6, y: 0.55 },
  { id: "vinny", label: "Vinny Amendola Lead", date: "Feb 2026", cat: "revenue", detail: "Senior exec at Orangetheory Fitness (500+ employees, fleet of studios) reached out about lead generation services. Enterprise opportunity.", x: 0.45, y: 0.6 },

  // Tonight's Rebuild
  { id: "website_v2", label: "Website V2 Rebuild", date: "Feb 26", cat: "launch", detail: "Complete website rebuild: animated particle hero, 4-tier pricing, 29 industries, comparison table, ROI calculator, FAQ. Premium dark theme.", x: 0.88, y: 0.62 },
  { id: "portal_fix", label: "Portal Overhaul", date: "Feb 26", cat: "product", detail: "Fixed broken emoji rendering, added all 29 industries, updated to no-setup-fee pricing model, 3 plans including Personal at $19.99/mo.", x: 0.72, y: 0.65 },
  { id: "personal_plan", label: "Personal Plan: $19.99/mo", date: "Feb 26", cat: "product", detail: "New tier for individuals who want an AI assistant for their personal phone. Expands TAM from service businesses to literally anyone with a phone.", x: 0.55, y: 0.72 },
  { id: "multilang", label: "Multi-Language Support", date: "Feb 26", cat: "product", detail: "English, Spanish, French, Portuguese and more. Users choose their language. Full customization — a viral selling point nobody else offers at this price.", x: 0.38, y: 0.7 },

  // Future
  { id: "app", label: "Mobile App", date: "Mar 2026", cat: "launch", detail: "React Native app for iOS & Android. Push notifications replace SMS. Self-serve agent configuration. This weekend's build.", x: 0.2, y: 0.75 },
  { id: "zapier", label: "Zapier + 5,000 Integrations", date: "Mar 2026", cat: "product", detail: "ServiceTitan, Housecall Pro, Jobber, Booksy, Google Calendar, HubSpot, Salesforce — leads flow directly into existing tools.", x: 0.4, y: 0.85 },
  { id: "target_10k", label: "$10K Revenue Target", date: "Mar 31", cat: "milestone", detail: "Goal: $10K total revenue by March 31. Path: 2-3 founding members ($999), 3-5 monthly plans, 1 enterprise deal.", x: 0.65, y: 0.82 },
  { id: "first_100", label: "First 100 Clients", date: "2026", cat: "milestone", detail: "Milestone #1 on the roadmap. At average $250/mo MRR per client = $25K MRR. This is when Conduit AI becomes a real business.", x: 0.82, y: 0.78 },
];

const EDGES = [
  ["founding", "stack"], ["stack", "first_agent"], ["first_agent", "website_v1"],
  ["founding", "first_client"], ["first_client", "multi_vertical"], ["multi_vertical", "cold_outreach"],
  ["cold_outreach", "seo_content"], ["website_v1", "vercel_migration"],
  ["first_client", "affiliate"], ["first_client", "business_infra"],
  ["vercel_migration", "directory_blitz"], ["vercel_migration", "google_ads"],
  ["seo_content", "directory_blitz"],
  ["directory_blitz", "product_hunt"], ["product_hunt", "first_signup"],
  ["multi_vertical", "heygen"], ["product_hunt", "mark_thomas"],
  ["cold_outreach", "vinny"],
  ["first_signup", "website_v2"], ["website_v2", "portal_fix"],
  ["portal_fix", "personal_plan"], ["personal_plan", "multilang"],
  ["website_v2", "app"], ["multilang", "zapier"],
  ["zapier", "target_10k"], ["vinny", "target_10k"],
  ["target_10k", "first_100"], ["app", "first_100"],
  ["heygen", "portal_fix"],
  ["mark_thomas", "target_10k"],
];

function getNodePos(node, w, h) {
  return { x: node.x * w, y: node.y * h };
}

export default function NodeGraph() {
  const svgRef = useRef(null);
  const [dims, setDims] = useState({ w: 1400, h: 900 });
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [filter, setFilter] = useState(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const resize = () => {
      const w = Math.min(window.innerWidth - 40, 1400);
      const h = Math.max(window.innerHeight - 200, 600);
      setDims({ w, h });
    };
    resize();
    window.addEventListener("resize", resize);
    setTimeout(() => setAnimate(true), 100);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const { w, h } = dims;
  const nodeMap = {};
  NODES.forEach(n => { nodeMap[n.id] = n; });

  const filteredNodes = filter ? NODES.filter(n => n.cat === filter) : NODES;
  const filteredIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = EDGES.filter(([a, b]) => filteredIds.has(a) && filteredIds.has(b));

  const selectedNode = selected ? nodeMap[selected] : null;
  const connectedToHover = new Set();
  if (hovered) {
    EDGES.forEach(([a, b]) => {
      if (a === hovered) connectedToHover.add(b);
      if (b === hovered) connectedToHover.add(a);
    });
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>
      {/* Grid background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, padding: "32px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 22 }}>Conduit</span>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 22, background: "linear-gradient(135deg, #00d4ff, #0066ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>Journey Map</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Every milestone from founding to the future. Click any node to explore.</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setFilter(null)} style={{ padding: "6px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600, border: "1px solid", cursor: "pointer", background: !filter ? "rgba(255,255,255,0.1)" : "transparent", borderColor: !filter ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)", color: !filter ? "#fff" : "rgba(255,255,255,0.4)" }}>All</button>
            {Object.entries(CATEGORIES).map(([key, { color, label }]) => (
              <button key={key} onClick={() => setFilter(filter === key ? null : key)} style={{
                padding: "6px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: filter === key ? `${color}15` : "transparent",
                border: `1px solid ${filter === key ? `${color}50` : "rgba(255,255,255,0.06)"}`,
                color: filter === key ? color : "rgba(255,255,255,0.4)",
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Graph */}
      <div style={{ position: "relative", zIndex: 5, padding: "16px" }}>
        <svg ref={svgRef} width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {Object.entries(CATEGORIES).map(([key, { color }]) => (
              <radialGradient key={key} id={`grad-${key}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Edges */}
          {filteredEdges.map(([a, b], i) => {
            const p1 = getNodePos(nodeMap[a], w, h);
            const p2 = getNodePos(nodeMap[b], w, h);
            const isHoverConnected = hovered && (a === hovered || b === hovered);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - 20;
            return (
              <path key={i}
                d={`M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`}
                fill="none"
                stroke={isHoverConnected ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.06)"}
                strokeWidth={isHoverConnected ? 2 : 1}
                style={{
                  opacity: animate ? 1 : 0,
                  transition: `opacity 0.8s ease ${i * 0.03}s, stroke 0.3s`,
                }}
              />
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node, i) => {
            const pos = getNodePos(node, w, h);
            const cat = CATEGORIES[node.cat];
            const isSelected = selected === node.id;
            const isHovered = hovered === node.id;
            const isConnected = connectedToHover.has(node.id);
            const dimmed = hovered && !isHovered && !isConnected;
            const r = isSelected ? 18 : isHovered ? 16 : 12;

            return (
              <g key={node.id}
                style={{
                  cursor: "pointer",
                  opacity: animate ? (dimmed ? 0.25 : 1) : 0,
                  transition: `opacity 0.6s ease ${i * 0.04}s, transform 0.3s`,
                }}
                onClick={() => setSelected(isSelected ? null : node.id)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Glow */}
                <circle cx={pos.x} cy={pos.y} r={r * 2.5} fill={`url(#grad-${node.cat})`} style={{ opacity: isHovered || isSelected ? 1 : 0, transition: "opacity 0.3s" }} />
                {/* Ring */}
                <circle cx={pos.x} cy={pos.y} r={r + 3} fill="none" stroke={cat.color} strokeWidth={1} strokeOpacity={isSelected ? 0.5 : 0} style={{ transition: "all 0.3s" }} />
                {/* Node */}
                <circle cx={pos.x} cy={pos.y} r={r} fill={cat.color} fillOpacity={isSelected ? 0.9 : 0.7} filter={isHovered ? "url(#glow)" : ""} style={{ transition: "all 0.3s" }} />
                {/* Inner dot */}
                <circle cx={pos.x} cy={pos.y} r={3} fill="#fff" fillOpacity={0.8} />
                {/* Label */}
                <text x={pos.x} y={pos.y + r + 16} textAnchor="middle" fill={isHovered || isSelected ? "#fff" : "rgba(255,255,255,0.55)"} fontSize={11} fontWeight={600} fontFamily="'DM Sans', sans-serif" style={{ transition: "fill 0.3s", pointerEvents: "none" }}>
                  {node.label}
                </text>
                <text x={pos.x} y={pos.y + r + 30} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={10} fontFamily="'DM Sans', sans-serif" style={{ pointerEvents: "none" }}>
                  {node.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail Panel */}
      {selectedNode && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          maxWidth: 520, width: "calc(100% - 48px)", padding: "24px 28px",
          borderRadius: 16, background: "rgba(10,10,10,0.95)", border: `1px solid ${CATEGORIES[selectedNode.cat].color}30`,
          backdropFilter: "blur(20px)", zIndex: 50,
          animation: "slideUp 0.3s ease",
        }}>
          <style>{`@keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(20px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORIES[selectedNode.cat].color }} />
                <span style={{ fontSize: 11, color: CATEGORIES[selectedNode.cat].color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{CATEGORIES[selectedNode.cat].label}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{selectedNode.date}</span>
              </div>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700 }}>{selectedNode.label}</h3>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{selectedNode.detail}</p>
        </div>
      )}

      {/* Stats Bar */}
      <div style={{
        position: "relative", zIndex: 10, padding: "0 32px 32px",
        display: "flex", gap: 32, flexWrap: "wrap",
      }}>
        {[
          { label: "Total Milestones", value: NODES.length },
          { label: "Days Since Founding", value: Math.floor((new Date("2026-02-26") - new Date("2025-12-01")) / 86400000) },
          { label: "Lines of Code Written", value: "15,000+" },
          { label: "Platforms Submitted", value: "12+" },
        ].map((stat, i) => (
          <div key={i}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, background: "linear-gradient(135deg, #00d4ff, #fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
