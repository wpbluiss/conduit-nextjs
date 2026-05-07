import type { EmployeeKey } from "@/lib/ai/provider";

// ElevenLabs stock voice IDs. Hardcoded so we have a sane default per
// employee even if the per-account override row is missing.
export const DEFAULT_EMPLOYEE_VOICES: Record<string, string> = {
  jarvis: "nPczCjzI2devNBz1zQrb", // Brian — warm British male, COO energy
  marketing: "EXAVITQu4vr4xnSDxMaL", // Sarah — energetic professional female
  sales: "pNInz6obpgDQGcFmaJgB", // Adam — confident, deal-closer male
  engineering: "TxGEqnHWrfWFTfGW9XjX", // Josh — clear technical male
  // Reserved for future employees:
  finance: "CYw3kZ02Hs0563khs1Fj", // Dave
  compliance: "oWAxZDx7w5VEj9dCyTzz", // Grace
  hr: "pFZP5JQG7iQjIQuC4Bku", // Lily
  ops: "IKne3meq5aSn9XLyUdCD", // Charlie
  legal: "onwK4e9ZLuTAKqWW03F9", // Daniel
};

// Stock voice id → display name. Independent of employee identity (a voice
// can be assigned to any employee), so this stays as ElevenLabs voice
// labels rather than employee labels.
export const VOICE_NAMES: Record<string, string> = {
  nPczCjzI2devNBz1zQrb: "Brian",
  EXAVITQu4vr4xnSDxMaL: "Sarah",
  pNInz6obpgDQGcFmaJgB: "Adam",
  TxGEqnHWrfWFTfGW9XjX: "Josh",
  CYw3kZ02Hs0563khs1Fj: "Dave",
  oWAxZDx7w5VEj9dCyTzz: "Grace",
  pFZP5JQG7iQjIQuC4Bku: "Lily",
  IKne3meq5aSn9XLyUdCD: "Charlie",
  onwK4e9ZLuTAKqWW03F9: "Daniel",
  "21m00Tcm4TlvDq8ikWAM": "Rachel",
};

export const DEFAULT_VOICE_SPEED = 1.0;
export const DEFAULT_AUTO_PLAY = true;

export function defaultVoiceFor(employee: EmployeeKey | string): string {
  return DEFAULT_EMPLOYEE_VOICES[employee] ?? DEFAULT_EMPLOYEE_VOICES.jarvis;
}

export function previewLineFor(employee: EmployeeKey | string): string {
  const labels: Record<string, string> = {
    jarvis: "Atlas",
    marketing: "Marketing",
    sales: "Sales",
    engineering: "Engineering",
    finance: "Finance",
    compliance: "Compliance",
    hr: "HR",
    ops: "Operations",
    legal: "Legal",
  };
  const name = labels[employee] ?? "your team";
  return `Hi, I'm ${name}. Ready when you are.`;
}
