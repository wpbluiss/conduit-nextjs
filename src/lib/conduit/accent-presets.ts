export const ACCENT_PRESETS: Record<
  string,
  { label: string; accent: string; hi: string; deep: string }
> = {
  violet: { label: "Violet",        accent: "#7C6CFF", hi: "#9B8CFF", deep: "#5548CC" },
  blue:   { label: "Electric blue", accent: "#4E8EFF", hi: "#7DAEFF", deep: "#2563EB" },
  rose:   { label: "Rose",          accent: "#F43F5E", hi: "#FB7185", deep: "#BE123C" },
  sage:   { label: "Sage",          accent: "#5F9E6E", hi: "#7EB88D", deep: "#3A6B47" },
  amber:  { label: "Amber",         accent: "#F59E0B", hi: "#FCD34D", deep: "#D97706" },
  slate:  { label: "Slate",         accent: "#6B7A8D", hi: "#8FA0B5", deep: "#3D4F63" },
  ember:  { label: "Ember",         accent: "#FF8A3D", hi: "#FFA876", deep: "#D9532A" },
};

export const DEFAULT_ACCENT = "violet";
export const ACCENT_STORAGE_KEY = "praxis.accent";
