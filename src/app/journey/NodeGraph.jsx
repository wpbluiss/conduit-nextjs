"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";

/* ═══════════════════════════════════════════════════════════════════
   CATEGORIES
   ═══════════════════════════════════════════════════════════════════ */
const CATEGORIES = {
  core:      { color: "#0EA5E9", label: "Core Product" },
  infra:     { color: "#06B6D4", label: "Infrastructure" },
  business:  { color: "#10B981", label: "Revenue & Business" },
  marketing: { color: "#8B5CF6", label: "Content & Marketing" },
  clients:   { color: "#F59E0B", label: "Clients & Partnerships" },
};

/* ═══════════════════════════════════════════════════════════════════
   NODE DATA — every milestone in the Conduit AI journey
   size: 3 = center, 2 = major, 1 = standard
   ═══════════════════════════════════════════════════════════════════ */
const NODE_DATA = [
  // CENTER
  { id: "conduit", label: "Conduit AI", date: "January 2026", detail: "AI-powered voice agent platform for service businesses. The origin of everything.", cat: "core", size: 3 },

  // CORE FOUNDATION
  { id: "founded", label: "Conduit AI Founded", date: "January 2026", detail: "The beginning — building an AI-powered lead recovery platform from scratch.", cat: "core", size: 2 },
  { id: "platform", label: "Platform Built", date: "January 2026", detail: "Full SaaS platform: Vapi + Twilio + Stripe + Supabase. Entire stack built solo.", cat: "core", size: 2 },
  { id: "website", label: "Website Launch", date: "February 2026", detail: "conduitai.io live on Vercel with Next.js. Premium dark theme, animations, and SEO.", cat: "core", size: 2 },
  { id: "portal", label: "Client Portal", date: "February 2026", detail: "app.conduitai.io — React + Vite client dashboard hosted on Railway.", cat: "core", size: 2 },

  // PRODUCT
  { id: "voice_agent", label: "AI Voice Agent", date: "January 2026", detail: "Vapi-powered AI agent that answers calls 24/7 with natural conversation.", cat: "core", size: 2 },
  { id: "lead_capture", label: "Lead Capture System", date: "January 2026", detail: "Real-time email notifications with caller details and call summaries.", cat: "core", size: 1 },
  { id: "onboarding", label: "Smart Onboarding", date: "February 2026", detail: "6-step guided walkthrough for new clients to configure their AI agent.", cat: "core", size: 1 },
  { id: "affiliate_system", label: "Affiliate System", date: "February 2026", detail: "20% recurring commission with referral tracking and automatic payouts.", cat: "core", size: 1 },
  { id: "pricing", label: "4 Pricing Tiers", date: "February 2026", detail: "Solo $39, Business $199, Professional $299, and Enterprise custom pricing.", cat: "core", size: 1 },
  { id: "free_trial", label: "14-Day Free Trial", date: "February 2026", detail: "No credit card required. Full access to the platform for 14 days.", cat: "core", size: 1 },

  // MOBILE APP
  { id: "mobile_app", label: "Mobile App Built", date: "March 2026", detail: "18 screens built with Expo / React Native. Full client management on mobile.", cat: "core", size: 2 },
  { id: "premium_design", label: "Premium Design", date: "March 2026", detail: "Glassmorphism UI, particle effects, and haptic feedback throughout the app.", cat: "core", size: 1 },
  { id: "ai_customization", label: "AI Agent Customization", date: "March 2026", detail: "Voice, personality, greeting, and FAQ builder — all configurable from mobile.", cat: "core", size: 1 },
  { id: "call_playback", label: "Call Playback", date: "March 2026", detail: "Audio player with waveform visualization and synced call transcript.", cat: "core", size: 1 },
  { id: "sms_conversations", label: "SMS Conversations", date: "March 2026", detail: "Two-way messaging with leads directly from the app.", cat: "core", size: 1 },
  { id: "payment_capture", label: "Payment Capture", date: "March 2026", detail: "Stripe deposits, no-show fees, and payment tracking built in.", cat: "core", size: 1 },
  { id: "appointment_booking", label: "Appointment Booking", date: "March 2026", detail: "Calendar with AI-booked appointments synced to your schedule.", cat: "core", size: 1 },
  { id: "revenue_dashboard", label: "Revenue Dashboard", date: "March 2026", detail: "Gamification, streaks, and milestones to track business growth.", cat: "core", size: 1 },
  { id: "reviews_reputation", label: "Reviews & Reputation", date: "March 2026", detail: "Auto-review requests with sentiment tracking and reputation monitoring.", cat: "core", size: 1 },
  { id: "multi_location", label: "Multi-Location", date: "March 2026", detail: "Multiple business locations and agents, all managed from one account.", cat: "core", size: 1 },
  { id: "push_notifications", label: "Push Notifications", date: "March 2026", detail: "Real-time lead alerts sent straight to your phone.", cat: "core", size: 1 },

  // MARKETING & CONTENT
  { id: "blog_posts", label: "33+ SEO Blog Posts", date: "February 2026", detail: "All indexed in Google. Driving organic traffic to conduitai.io.", cat: "marketing", size: 2 },
  { id: "ai_commercial", label: "AI Commercial Pipeline", date: "February 2026", detail: "Kling 3.0, ElevenLabs, and CapCut for cinematic AI-generated commercials.", cat: "marketing", size: 1 },
  { id: "product_hunt", label: "Product Hunt Launch", date: "Feb 24, 2026", detail: "Official launch on Product Hunt. First major public debut of the platform.", cat: "marketing", size: 2 },
  { id: "first_signup", label: "First Signup", date: "Feb 25, 2026", detail: "First organic signup the day after Product Hunt launch. The funnel works.", cat: "marketing", size: 2 },
  { id: "platform_distribution", label: "5 Platform Distribution", date: "February 2026", detail: "TikTok, Instagram, YouTube, LinkedIn, and X — content distributed everywhere.", cat: "marketing", size: 1 },
  { id: "peerpush", label: "PeerPush Trending", date: "February 2026", detail: "Trending badge earned on PeerPush platform.", cat: "marketing", size: 1 },

  // CLIENTS & PARTNERSHIPS
  { id: "first_client", label: "First Client: The G Room", date: "January 2026", detail: "Christian's barbershop in South Florida. Proof of concept validated.", cat: "clients", size: 2 },
  { id: "affiliate_chris", label: "Affiliate: CHRIS20", date: "February 2026", detail: "First affiliate partner — 20% recurring commission.", cat: "clients", size: 1 },
  { id: "affiliate_bobby", label: "Affiliate: BOBBY20", date: "February 2026", detail: "Bobby Burcham — contractor network affiliate partner.", cat: "clients", size: 1 },

  // REVENUE & BUSINESS
  { id: "prospect_pipeline", label: "997 Prospect Pipeline", date: "February 2026", detail: "4 Instantly.ai email campaigns targeting service businesses.", cat: "business", size: 1 },
  { id: "demo_line", label: "Demo Line Live", date: "January 2026", detail: "(561) 730-3316 — call to hear the AI agent in action.", cat: "business", size: 1 },

  // INFRASTRUCTURE
  { id: "supabase", label: "Supabase", date: "January 2026", detail: "Auth, database, and real-time subscriptions.", cat: "infra", size: 1 },
  { id: "railway", label: "Railway", date: "January 2026", detail: "Backend hosting with automatic deployments.", cat: "infra", size: 1 },
  { id: "vercel_infra", label: "Vercel", date: "January 2026", detail: "Website hosting with edge network and instant deploys.", cat: "infra", size: 1 },
  { id: "stripe_infra", label: "Stripe", date: "January 2026", detail: "Payments, billing, and subscription management.", cat: "infra", size: 1 },
  { id: "twilio_infra", label: "Twilio", date: "January 2026", detail: "Telephony, SMS, and voice infrastructure.", cat: "infra", size: 1 },
  { id: "vapi_infra", label: "Vapi.ai", date: "January 2026", detail: "AI voice engine powering all agent conversations.", cat: "infra", size: 1 },
  { id: "zapier_infra", label: "Zapier", date: "February 2026", detail: "Calendar integrations and workflow automation.", cat: "infra", size: 1 },
  { id: "gsc", label: "Google Search Console", date: "February 2026", detail: "30+ pages indexed and monitored for search performance.", cat: "infra", size: 1 },
];

/* ═══════════════════════════════════════════════════════════════════
   LINK DATA — connections between nodes
   ═══════════════════════════════════════════════════════════════════ */
const LINK_DATA = [
  // Center → core foundation
  { source: "conduit", target: "founded" },
  { source: "conduit", target: "platform" },
  { source: "conduit", target: "website" },
  { source: "conduit", target: "portal" },

  // Platform → product features
  { source: "platform", target: "voice_agent" },
  { source: "platform", target: "lead_capture" },
  { source: "platform", target: "onboarding" },
  { source: "platform", target: "affiliate_system" },
  { source: "platform", target: "pricing" },
  { source: "onboarding", target: "free_trial" },
  { source: "pricing", target: "free_trial" },

  // Portal → mobile app
  { source: "portal", target: "mobile_app" },

  // Mobile app chains
  { source: "mobile_app", target: "premium_design" },
  { source: "premium_design", target: "ai_customization" },
  { source: "mobile_app", target: "call_playback" },
  { source: "call_playback", target: "sms_conversations" },
  { source: "mobile_app", target: "payment_capture" },
  { source: "payment_capture", target: "appointment_booking" },
  { source: "mobile_app", target: "revenue_dashboard" },
  { source: "revenue_dashboard", target: "reviews_reputation" },
  { source: "mobile_app", target: "multi_location" },
  { source: "multi_location", target: "push_notifications" },
  { source: "sms_conversations", target: "push_notifications" },
  { source: "reviews_reputation", target: "push_notifications" },

  // Product → infrastructure
  { source: "voice_agent", target: "vapi_infra" },
  { source: "voice_agent", target: "twilio_infra" },
  { source: "lead_capture", target: "supabase" },
  { source: "sms_conversations", target: "twilio_infra" },
  { source: "payment_capture", target: "stripe_infra" },
  { source: "website", target: "vercel_infra" },
  { source: "portal", target: "railway" },
  { source: "portal", target: "supabase" },
  { source: "pricing", target: "stripe_infra" },
  { source: "appointment_booking", target: "zapier_infra" },

  // Marketing
  { source: "conduit", target: "blog_posts" },
  { source: "conduit", target: "product_hunt" },
  { source: "conduit", target: "ai_commercial" },
  { source: "product_hunt", target: "first_signup" },
  { source: "first_signup", target: "peerpush" },
  { source: "blog_posts", target: "platform_distribution" },
  { source: "blog_posts", target: "gsc" },
  { source: "ai_commercial", target: "platform_distribution" },

  // Clients & business
  { source: "conduit", target: "first_client" },
  { source: "conduit", target: "demo_line" },
  { source: "conduit", target: "prospect_pipeline" },
  { source: "first_client", target: "affiliate_chris" },
  { source: "first_client", target: "affiliate_bobby" },
  { source: "affiliate_system", target: "affiliate_chris" },
  { source: "affiliate_system", target: "affiliate_bobby" },
  { source: "demo_line", target: "twilio_infra" },
  { source: "demo_line", target: "vapi_infra" },

  // Platform → infrastructure
  { source: "platform", target: "supabase" },
  { source: "platform", target: "stripe_infra" },
  { source: "platform", target: "twilio_infra" },
  { source: "platform", target: "vapi_infra" },
];

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
function getRadius(node) {
  if (node.id === "conduit") return 40;
  if (node.size === 2) return 24;
  return 17;
}

function splitLabel(label, maxChars) {
  if (label.length <= maxChars) return [label];
  const words = label.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxChars) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

const CAT_ANGLES = { core: 0, infra: Math.PI * 0.4, business: Math.PI * 0.8, marketing: Math.PI * 1.2, clients: Math.PI * 1.6 };

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function NodeGraph() {
  /* ── state ── */
  const [dims, setDims] = useState({ w: 1200, h: 800 });
  const [camera, _setCamera] = useState({ x: 0, y: 0, scale: 0.85 });
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [, setTick] = useState(0); // force re-renders from simulation

  /* ── refs ── */
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const simRef = useRef(null);
  const cameraRef = useRef(camera);
  const dimsRef = useRef(dims);
  const rafRef = useRef(null);

  // drag / pan / pinch state
  const dragNodeRef = useRef(null);
  const isPanRef = useRef(false);
  const lastPtrRef = useRef({ x: 0, y: 0 });
  const pointersRef = useRef(new Map());
  const pinchDistRef = useRef(0);
  const velRef = useRef([]);

  const setCamera = useCallback((fn) => {
    _setCamera(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      cameraRef.current = next;
      return next;
    });
  }, []);

  /* ── coordinate conversion: screen → simulation ── */
  const screenToSim = useCallback((clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const cam = cameraRef.current;
    const d = dimsRef.current;
    return {
      x: (clientX - rect.left - cam.x - d.w / 2) / cam.scale,
      y: (clientY - rect.top - cam.y - d.h / 2) / cam.scale,
    };
  }, []);

  /* ════════════════════════════════════════════════════════════════
     FORCE SIMULATION SETUP
     ════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const nodes = NODE_DATA.map((d, i) => {
      const copy = { ...d };
      if (copy.id === "conduit") {
        copy.fx = 0;
        copy.fy = 0;
      } else {
        const base = CAT_ANGLES[copy.cat] || 0;
        const spread = (Math.random() - 0.5) * 1.0;
        const angle = base + spread;
        const r = (copy.size === 2 ? 160 : 260) + Math.random() * 120;
        copy.x = Math.cos(angle) * r;
        copy.y = Math.sin(angle) * r;
      }
      return copy;
    });

    const links = LINK_DATA.map(l => ({ ...l }));

    nodesRef.current = nodes;
    linksRef.current = links;

    const sim = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).distance(110).strength(0.4))
      .force("charge", forceManyBody().strength(-350))
      .force("center", forceCenter(0, 0).strength(0.04))
      .force("collision", forceCollide().radius(d => getRadius(d) + 14))
      .alphaDecay(0.015)
      .velocityDecay(0.35);

    simRef.current = sim;

    let needsRender = false;
    sim.on("tick", () => { needsRender = true; });

    function loop() {
      if (needsRender) { needsRender = false; setTick(t => t + 1); }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => { sim.stop(); cancelAnimationFrame(rafRef.current); };
  }, []);

  /* ════════════════════════════════════════════════════════════════
     RESIZE
     ════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDims({ w, h });
      dimsRef.current = { w, h };
      if (canvasRef.current) { canvasRef.current.width = w; canvasRef.current.height = h; }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ════════════════════════════════════════════════════════════════
     PARTICLE BACKGROUND (canvas)
     ════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.4,
      speed: Math.random() * 0.25 + 0.05,
      opacity: Math.random() * 0.25 + 0.05,
      phase: Math.random() * Math.PI * 2,
    }));

    let id;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;
      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
        const a = p.opacity * (0.5 + 0.5 * Math.sin(t * 0.8 + p.phase));
        ctx.fillStyle = `rgba(14,165,233,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      id = requestAnimationFrame(animate);
    }
    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  /* ════════════════════════════════════════════════════════════════
     POINTER / DRAG / PAN / ZOOM HANDLERS
     ════════════════════════════════════════════════════════════════ */

  const handleNodePointerDown = useCallback((e, nodeId) => {
    e.stopPropagation();
    e.preventDefault();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node || !simRef.current) return;
    dragNodeRef.current = nodeId;
    node.fx = node.x;
    node.fy = node.y;
    simRef.current.alphaTarget(0.3).restart();
    velRef.current = [];
    svgRef.current?.setPointerCapture?.(e.pointerId);
  }, []);

  const handleBgPointerDown = useCallback((e) => {
    if (dragNodeRef.current) return;
    // if it's a second pointer → ignore for panning, pinch handled via pointersRef
    if (pointersRef.current.size >= 1 && !pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      return;
    }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    isPanRef.current = true;
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e) => {
    // update pointer map
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // PINCH ZOOM (2 pointers)
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchDistRef.current > 0) {
        const factor = dist / pinchDistRef.current;
        setCamera(prev => ({
          ...prev,
          scale: Math.max(0.15, Math.min(4, prev.scale * factor)),
        }));
      }
      pinchDistRef.current = dist;
      return;
    }

    // NODE DRAG
    if (dragNodeRef.current) {
      const node = nodesRef.current.find(n => n.id === dragNodeRef.current);
      if (!node) return;
      const sim = screenToSim(e.clientX, e.clientY);
      // velocity tracking for throw
      velRef.current.push({ x: sim.x - (node.fx || 0), y: sim.y - (node.fy || 0), t: Date.now() });
      if (velRef.current.length > 5) velRef.current.shift();
      node.fx = sim.x;
      node.fy = sim.y;
      return;
    }

    // PAN
    if (isPanRef.current) {
      const dx = e.clientX - lastPtrRef.current.x;
      const dy = e.clientY - lastPtrRef.current.y;
      lastPtrRef.current = { x: e.clientX, y: e.clientY };
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }
  }, [screenToSim, setCamera]);

  const handlePointerUp = useCallback((e) => {
    pointersRef.current.delete(e.pointerId);
    pinchDistRef.current = 0;

    // release dragged node with momentum
    if (dragNodeRef.current) {
      const node = nodesRef.current.find(n => n.id === dragNodeRef.current);
      if (node) {
        // compute throw velocity from recent samples
        const samples = velRef.current;
        if (samples.length >= 2) {
          const last = samples[samples.length - 1];
          const prev = samples[Math.max(0, samples.length - 3)];
          const dt = (last.t - prev.t) || 1;
          node.vx = (last.x + prev.x) / 2 * (1000 / dt) * 0.04;
          node.vy = (last.y + prev.y) / 2 * (1000 / dt) * 0.04;
        }
        node.fx = null;
        node.fy = null;
        // keep center node fixed
        if (node.id === "conduit") { node.fx = 0; node.fy = 0; }
      }
      dragNodeRef.current = null;
      simRef.current?.alphaTarget(0);
    }
    isPanRef.current = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.92 : 1.08;

    setCamera(prev => {
      const newScale = Math.max(0.15, Math.min(4, prev.scale * factor));
      const ratio = newScale / prev.scale;
      const dx = mx - prev.x - dimsRef.current.w / 2;
      const dy = my - prev.y - dimsRef.current.h / 2;
      return { x: prev.x - dx * (ratio - 1), y: prev.y - dy * (ratio - 1), scale: newScale };
    });
  }, [setCamera]);

  // attach wheel with { passive: false } to allow preventDefault
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleNodeClick = useCallback((nodeId) => {
    if (dragNodeRef.current) return;
    setSelected(prev => prev === nodeId ? null : nodeId);
  }, []);

  /* ════════════════════════════════════════════════════════════════
     COMPUTED VALUES
     ════════════════════════════════════════════════════════════════ */
  const connectedNodes = new Set();
  if (hovered) {
    connectedNodes.add(hovered);
    for (const link of linksRef.current) {
      const sId = typeof link.source === "object" ? link.source.id : link.source;
      const tId = typeof link.target === "object" ? link.target.id : link.target;
      if (sId === hovered) connectedNodes.add(tId);
      if (tId === hovered) connectedNodes.add(sId);
    }
  }

  const selectedNode = selected ? nodesRef.current.find(n => n.id === selected) : null;
  const { w, h } = dims;

  /* ════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: "#030712", minHeight: "100vh", overflow: "hidden", position: "relative", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

      {/* Keyframe animations */}
      <style>{`
        @keyframes dashMove { to { stroke-dashoffset: -33; } }
        @keyframes centerPulse {
          0%, 100% { r: 45; stroke-opacity: 0.3; }
          50% { r: 58; stroke-opacity: 0.06; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 20, padding: "28px 28px 0", animation: "fadeIn 1s ease" }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          The Journey
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
          Every node represents a milestone. Drag them around.
        </p>

        {/* Category legend */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          {Object.entries(CATEGORIES).map(([key, { color, label }]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}60` }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        width={w}
        height={h}
        style={{ display: "block", position: "relative", zIndex: 10, touchAction: "none", cursor: isPanRef.current ? "grabbing" : "grab" }}
        onPointerDown={handleBgPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
          </filter>
        </defs>

        <g transform={`translate(${camera.x + w / 2}, ${camera.y + h / 2}) scale(${camera.scale})`}>

          {/* ── LINKS ── */}
          {linksRef.current.map((link, i) => {
            const src = typeof link.source === "object" ? link.source : null;
            const tgt = typeof link.target === "object" ? link.target : null;
            if (!src || !tgt) return null;
            const isHighlighted = hovered && (src.id === hovered || tgt.id === hovered);
            const dimmed = hovered && !isHighlighted;
            const color = CATEGORIES[src.cat]?.color || "#fff";

            return (
              <g key={`link-${i}`} style={{ opacity: dimmed ? 0.08 : 1, transition: "opacity 0.3s" }}>
                {/* base line */}
                <line
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={isHighlighted ? color : "rgba(255,255,255,0.06)"}
                  strokeWidth={isHighlighted ? 1.5 : 0.8}
                  style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                />
                {/* animated pulse */}
                <line
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={isHighlighted ? 0.4 : 0.1}
                  strokeDasharray="3 30"
                  style={{ animation: `dashMove ${2.5 + (i % 7) * 0.4}s linear infinite`, transition: "stroke-opacity 0.3s" }}
                />
              </g>
            );
          })}

          {/* ── NODES ── */}
          {nodesRef.current.map((node) => {
            const r = getRadius(node);
            const cat = CATEGORIES[node.cat];
            const isCenter = node.id === "conduit";
            const isHov = hovered === node.id;
            const isSel = selected === node.id;
            const isConn = connectedNodes.has(node.id);
            const dimmed = hovered && !isHov && !isConn;
            const active = isHov || isSel;
            const lines = splitLabel(node.label, isCenter ? 20 : 15);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x || 0},${node.y || 0})`}
                style={{ cursor: "grab", opacity: dimmed ? 0.15 : 1, transition: "opacity 0.3s" }}
                onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                onPointerEnter={() => setHovered(node.id)}
                onPointerLeave={() => setHovered(null)}
                onClick={() => handleNodeClick(node.id)}
              >
                {/* Outer soft glow */}
                <circle r={r * 2.5} fill={cat.color} opacity={active ? 0.12 : 0.03} filter="url(#softGlow)" />

                {/* Center node pulsing ring */}
                {isCenter && (
                  <>
                    <circle r={45} fill="none" stroke={cat.color} strokeWidth={1.5} strokeOpacity={0.3}>
                      <animate attributeName="r" values="42;56;42" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.3;0.06;0.3" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle r={55} fill="none" stroke={cat.color} strokeWidth={1} strokeOpacity={0.1}>
                      <animate attributeName="r" values="50;68;50" dur="4s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.1;0.02;0.1" dur="4s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}

                {/* Glass body */}
                <circle
                  r={r}
                  fill="rgba(3,7,18,0.85)"
                  stroke={active ? `${cat.color}80` : "rgba(255,255,255,0.08)"}
                  strokeWidth={active ? 2 : 1}
                  filter={active ? "url(#glow)" : undefined}
                  style={{ transition: "stroke 0.25s, stroke-width 0.25s" }}
                />

                {/* Color ring */}
                <circle
                  r={r - 2}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth={active ? 1.5 : 0.8}
                  strokeOpacity={active ? 0.7 : 0.25}
                  style={{ transition: "stroke-opacity 0.25s, stroke-width 0.25s" }}
                />

                {/* Inner color wash */}
                <circle r={r * 0.55} fill={cat.color} opacity={0.08} />

                {/* Center dot */}
                <circle r={isCenter ? 6 : 3} fill={cat.color} opacity={0.9} />

                {/* Label lines */}
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={0}
                    y={r + 14 + li * 13}
                    textAnchor="middle"
                    fill={active ? "#fff" : "rgba(255,255,255,0.55)"}
                    fontSize={isCenter ? 12 : 10}
                    fontWeight={600}
                    fontFamily="'DM Sans', sans-serif"
                    style={{ pointerEvents: "none", transition: "fill 0.25s" }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Detail panel */}
      {selectedNode && (() => {
        const cat = CATEGORIES[selectedNode.cat];
        return (
          <div style={{
            position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
            maxWidth: 500, width: "calc(100% - 40px)", padding: "22px 26px", borderRadius: 16,
            background: "rgba(3,7,18,0.92)", border: `1px solid ${cat.color}30`,
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", zIndex: 50,
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, boxShadow: `0 0 8px ${cat.color}80`, display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: cat.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{cat.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{selectedNode.date}</span>
                </div>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedNode.label}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20, padding: 4, lineHeight: 1 }}>
                &times;
              </button>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>
              {selectedNode.detail}
            </p>
          </div>
        );
      })()}

      {/* Mobile hint */}
      <div style={{
        position: "fixed", bottom: selectedNode ? 140 : 20, left: "50%", transform: "translateX(-50%)",
        fontSize: 11, color: "rgba(255,255,255,0.2)", zIndex: 15, pointerEvents: "none",
        transition: "bottom 0.3s",
      }}>
        Scroll to zoom &middot; Drag to pan &middot; Grab nodes to move
      </div>
    </div>
  );
}
