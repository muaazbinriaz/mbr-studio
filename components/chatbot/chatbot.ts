export type ChatOption = {
  id: string;
  label: string;
  /** If present, renders as a navigation link instead of a scripted reply. */
  href?: string;
};

export const OPENING_OPTIONS: ChatOption[] = [
  { id: "quote", label: "Get a quote" },
  { id: "consultation", label: "Book a consultation" },
  { id: "services", label: "Explore our services" },
  { id: "work", label: "See past work" },
];

export const SERVICE_OPTIONS: ChatOption[] = [
  { id: "digital-product", label: "Website / digital product" },
  { id: "ai-automation", label: "AI automation" },
  { id: "whatsapp-automation", label: "WhatsApp automation" },
  { id: "saas-development", label: "SaaS development" },
  { id: "not-sure", label: "Not sure yet" },
];

export const BUDGET_OPTIONS: ChatOption[] = [
  { id: "under-1k", label: "Under $1,000" },
  { id: "1k-5k", label: "$1,000–$5,000" },
  { id: "5k-15k", label: "$5,000–$15,000" },
  { id: "15k-plus", label: "$15,000+" },
];

export const WORK_OPTIONS: ChatOption[] = [
  { id: "portfolio", label: "View portfolio", href: "/portfolio" },
  { id: "case-studies", label: "Read case studies", href: "/case-studies" },
];
