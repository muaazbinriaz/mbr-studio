export interface Service {
  slug: string;
  title: string;
  description: string;
  icon: string; // lucide-react icon name
}

export type ProjectCategory = "Website" | "AI Chatbot" | "E-commerce" | "SaaS";

export interface Project {
  slug: string;
  title: string;
  client: string;
  industry: string;
  summary: string;
  image: string;
  images?: string[];
  tags: string[];
  category: ProjectCategory;
  problem?: string;
  solution?: string;
  outcome?: { metric: string; label: string }[];
  visuals?: string[];
  link?: string; // ✅ live site link
  // Optional — when the project/write-up was published/last revised.
  // Left unset for now rather than guessing; fill in real dates as
  // case studies are written up. Powers datePublished/dateModified in
  // the case study's Article schema (lib/seo/schemas.ts) — projects
  // without a date simply omit those fields rather than emit a fake one.
  publishedAt?: string;
  updatedAt?: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContactFormValues {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  message: string;
}

export interface EstimateFormValues {
  serviceType: string;
  scope: string;
  timeline: string;
  budgetRange: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
