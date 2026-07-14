/**
 * Shared contact constants.
 *
 * WHATSAPP_DIGITS must be full international format, digits only
 * (no "+", spaces, or dashes) for the wa.me link to resolve, e.g.
 * "923001234567" for +92 300 1234567.
 */
export const CONTACT_EMAIL = "mbrstudio.dev@gmail.com";
export const WHATSAPP_DISPLAY = "+92-334-0819120";
export const WHATSAPP_DIGITS = "923340819120";
export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi MBR Studio — I'm interested in working together on a project. Can we talk?";

export const SERVICE_OPTIONS = [
  { value: "digital-product", label: "Digital Product Development" },
  { value: "ai-automation", label: "AI-Powered Business Automation" },
  { value: "whatsapp-automation", label: "WhatsApp Automation" },
  { value: "landing-page", label: "Landing Pages" },
  { value: "saas-development", label: "SaaS Development" },
  { value: "dashboard", label: "Dashboard Development" },
  { value: "ui-ux", label: "UI/UX Design" },
  { value: "api-integration", label: "API Integration" },
  { value: "seo", label: "SEO Optimization" },
  { value: "maintenance", label: "Website Maintenance" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const BUDGET_OPTIONS = [
  { value: "under-1k", label: "Under $1,000" },
  { value: "1k-5k", label: "$1,000 – $5,000" },
  { value: "5k-15k", label: "$5,000 – $15,000" },
  { value: "15k-plus", label: "$15,000+" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export function buildWhatsAppLink(message: string = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(message)}`;
}
