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
