import type { EmployeeKey } from "./provider";

export interface HandoffParseResult {
  visibleContent: string;
  handoff?: { to: EmployeeKey; brief: string };
}

const VALID_EMPLOYEES: EmployeeKey[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
];

export function parseHandoff(content: string): HandoffParseResult {
  const handoffMatch = content.match(/\[HANDOFF:\s*([a-zA-Z]+)\s*\]/i);
  if (!handoffMatch) return { visibleContent: content.trim() };

  const candidate = handoffMatch[1].toLowerCase();
  if (!VALID_EMPLOYEES.includes(candidate as EmployeeKey)) {
    return { visibleContent: content.trim() };
  }
  if (candidate === "jarvis") {
    return { visibleContent: content.trim() };
  }

  const briefMatch = content.match(/\[BRIEF:\s*([\s\S]*?)\]/i);
  const brief = briefMatch ? briefMatch[1].trim() : "";

  // Strip both tags and anything after the HANDOFF tag from visible content
  const handoffIdx = content.indexOf(handoffMatch[0]);
  const visible = content.slice(0, handoffIdx).trim();

  return {
    visibleContent: visible,
    handoff: { to: candidate as EmployeeKey, brief },
  };
}

export interface ArtifactBlock {
  type: "blog_post" | "document" | "code" | "plan" | "image" | "other";
  title: string;
  content: string;
}

export interface ArtifactParseResult {
  visibleContent: string;
  artifacts: ArtifactBlock[];
}

const VALID_TYPES = [
  "blog_post",
  "document",
  "code",
  "plan",
  "image",
  "other",
] as const;

export function parseArtifacts(content: string): ArtifactParseResult {
  const artifacts: ArtifactBlock[] = [];
  // Match [ARTIFACT: type]\n[TITLE: ...]\n[CONTENT: ...]\n[/ARTIFACT]
  const regex =
    /\[ARTIFACT:\s*([a-z_]+)\s*\][\s\S]*?\[TITLE:\s*([\s\S]*?)\]\s*\[CONTENT:\s*([\s\S]*?)\]\s*\[\/ARTIFACT\]/gi;

  let visible = content;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const rawType = match[1].toLowerCase().trim();
    const type = (
      VALID_TYPES.includes(rawType as (typeof VALID_TYPES)[number])
        ? rawType
        : "other"
    ) as ArtifactBlock["type"];
    artifacts.push({
      type,
      title: match[2].trim(),
      content: match[3].trim(),
    });
    visible = visible.replace(match[0], "");
  }

  let trimmedVisible = visible.trim();

  // Defensive fallback: if the visible content after stripping is empty,
  // whitespace, just horizontal-rule punctuation, or under 10 chars while we
  // produced an artifact, replace with a sensible default. Prevents the chat
  // from rendering a stray "---" when an employee forgets the preface.
  if (artifacts.length > 0) {
    const stripped = trimmedVisible.replace(/[-*_=\s]/g, "");
    if (trimmedVisible.length < 10 || stripped.length === 0) {
      trimmedVisible = "Done. Artifact ready — open below or in /app/artifacts.";
    }
  }

  return { visibleContent: trimmedVisible, artifacts };
}
