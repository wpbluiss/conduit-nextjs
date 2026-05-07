import { landingPageTemplate } from "./landing-page";
import { blogTemplate } from "./blog";
import { contactFormTemplate } from "./contact-form";
import { leadCaptureTemplate } from "./lead-capture";
import { basicCrmTemplate } from "./basic-crm";
import type { TemplateModule } from "./types";

export const TEMPLATES: Record<string, TemplateModule> = {
  "landing-page": landingPageTemplate,
  "basic-crm": basicCrmTemplate,
  blog: blogTemplate,
  "lead-capture": leadCaptureTemplate,
  "contact-form": contactFormTemplate,
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export function getTemplate(id: string): TemplateModule | undefined {
  return TEMPLATES[id];
}
