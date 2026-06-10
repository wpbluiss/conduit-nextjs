// Shared `cn()` class-name helper.
//
// Required by shadcn-registry components (Watermelon UI / Cult UI) which call
// `cn(...)` from `@/lib/utils`. Self-contained clsx-style implementation so we
// take no new runtime dependency yet. When the full rebrand lands we can swap
// the body for `twMerge(clsx(inputs))` once `tailwind-merge` is added.

type ClassValue =
  | string
  | number
  | null
  | boolean
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue): void => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (typeof value === "object") {
      for (const [key, on] of Object.entries(value)) if (on) out.push(key);
    }
  };
  inputs.forEach(walk);
  return out.join(" ");
}
