import { buildWhatsAppLink } from "@/config/contact";
import { Layers, Bot, Briefcase, Users, Newspaper, Mail } from "lucide-react";

export const siteConfig = {
  name: "MBR Studio",
  title: "MBR Studio — Digital products, built to grow your business.",
  founder: "Muaaz Bin Riaz",
  tagline:
    "Websites, SaaS & AI automation — built directly by the engineer who ships them.",
  description:
    "MBR Studio is a boutique software studio building websites, SaaS products, and AI-powered automation for growing businesses.",
  url: "https://mbrstudio.co",
  ogImage: "/opengraph-image",
  email: "mbrstudio.dev@gmail.com",
  // Added fields for the chat route
  consultationUrl: "https://cal.com/mbrstudio/consultation",

  contactEmail: "mbrstudio.dev@gmail.com",
  links: {
    twitter: "https://twitter.com/mbrstudio",
    linkedin: "https://www.linkedin.com/in/muaaz-bin-riaz-92b395298/",
    github: "https://github.com/muaazbinriaz",
  },
} as const;

export const navLinks = [
  { label: "Services", href: "/services", icon: Layers },
  // { label: "AI Agent", href: "/ai-agent", icon: Bot }, // paused — re-enable when product is client-ready
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "About", href: "/about", icon: Users },
  { label: "Blog", href: "/blog", icon: Newspaper },
  { label: "Contact", href: "/contact", icon: Mail },
] as const;

export const primaryCta = {
  label: "Book a Consultation",
  href: siteConfig.consultationUrl,
} as const;

/**
 * Delegates to config/contact.ts's buildWhatsAppLink() — that file is
 * the single source of truth for the WhatsApp number (WHATSAPP_DIGITS /
 * WHATSAPP_DISPLAY). This used to hardcode a second literal number here,
 * which risked the contact page and the AI chatbot handoff pointing at
 * two different numbers if only one was ever updated.
 *
 * Passes an empty message override so the chatbot's handoff link keeps
 * its previous behavior (no pre-filled WhatsApp message) rather than
 * picking up buildWhatsAppLink()'s default qualification message.
 */
export function getWhatsappLink(): string {
  return buildWhatsAppLink("");
}
