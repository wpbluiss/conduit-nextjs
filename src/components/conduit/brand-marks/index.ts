// Top-10 brand-mark registry for the Praxis Design Language.
//
// IMPORTANT — these are SIMPLIFIED PLACEHOLDER MARKS, not licensed
// official brand assets. They preserve recognizable color + simple
// geometric form so the wall-of-real-logos signal works in dev /
// internal preview, but the official artwork should replace them
// before any public-facing release. Each component is a single SVG;
// swapping is per-file with no API change.

import type { ComponentType } from "react";

import { BrandMarkGithub } from "./BrandMarkGithub";
import { BrandMarkGmail } from "./BrandMarkGmail";
import { BrandMarkDrive } from "./BrandMarkDrive";
import { BrandMarkNotion } from "./BrandMarkNotion";
import { BrandMarkSlack } from "./BrandMarkSlack";
import { BrandMarkStripe } from "./BrandMarkStripe";
import { BrandMarkSupabase } from "./BrandMarkSupabase";
import { BrandMarkVercel } from "./BrandMarkVercel";
import { BrandMarkTelegram } from "./BrandMarkTelegram";
import { BrandMarkWhatsapp } from "./BrandMarkWhatsapp";

export {
  BrandMarkGithub,
  BrandMarkGmail,
  BrandMarkDrive,
  BrandMarkNotion,
  BrandMarkSlack,
  BrandMarkStripe,
  BrandMarkSupabase,
  BrandMarkVercel,
  BrandMarkTelegram,
  BrandMarkWhatsapp,
};

export type BrandKind =
  | "github"
  | "gmail"
  | "drive"
  | "notion"
  | "slack"
  | "stripe"
  | "supabase"
  | "vercel"
  | "telegram"
  | "whatsapp";

export interface BrandMarkProps {
  size?: number;
  className?: string;
}

export const BRAND_MARKS: Record<BrandKind, ComponentType<BrandMarkProps>> = {
  github: BrandMarkGithub,
  gmail: BrandMarkGmail,
  drive: BrandMarkDrive,
  notion: BrandMarkNotion,
  slack: BrandMarkSlack,
  stripe: BrandMarkStripe,
  supabase: BrandMarkSupabase,
  vercel: BrandMarkVercel,
  telegram: BrandMarkTelegram,
  whatsapp: BrandMarkWhatsapp,
};

export const BRAND_LABELS: Record<BrandKind, string> = {
  github: "GitHub",
  gmail: "Gmail",
  drive: "Google Drive",
  notion: "Notion",
  slack: "Slack",
  stripe: "Stripe",
  supabase: "Supabase",
  vercel: "Vercel",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};
