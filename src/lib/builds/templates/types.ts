// Build templates produce the exact set of files Engineering pushes to a new
// repo. Generators are functions of the customization payload — no static
// "files/" directory; the file contents are derived at build time. This keeps
// the template surface easy to maintain and easy to extend.

export type CustomizationField =
  | { type: "string"; required?: boolean; default?: string; format?: "hex" | "email" | "url" }
  | { type: "array"; required?: boolean; itemSchema?: Record<string, unknown>; min_items?: number; max_items?: number }
  | { type: "boolean"; default?: boolean };

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  tags: string[];
  estimated_build_time_seconds: number;
  customization_schema: Record<string, CustomizationField>;
  /** Fields that Marketing fills in via a focused brief. */
  marketing_handoff: string[];
}

export interface TemplateModule {
  meta: TemplateMetadata;
  /** Returns a map of relative path → file contents. */
  generateFiles: (config: Record<string, unknown>) => Record<string, string>;
}
