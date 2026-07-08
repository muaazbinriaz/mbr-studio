import { buildWhatsAppLink } from "@/config/contact";

export const siteConfig = {
  name: "MBR Studio",
  title: "MBR Studio — Digital products, built to grow your business.",
  founder: "Muaaz Bin Riaz",
  tagline: "Digital products, built to grow your business.",
  description:
    "MBR Studio is a premium software agency building websites, AI-powered automation, and digital products for growing businesses.",
  url: "https://mbrstudio.co",
  ogImage: "/og-images/default.png",
  email: "mbrstudio.dev@gmail.com",
  // Added fields for the chat route
  consultationUrl: "https://cal.com/mbr-studio/consultation",

  contactEmail: "mbrstudio.dev@gmail.com",
  links: {
    twitter: "https://twitter.com/mbrstudio",
    linkedin: "https://www.linkedin.com/in/muaaz-bin-riaz-92b395298/",
    github: "https://github.com/muaazbinriaz",
  },
} as const;

export const navLinks = [
  { label: "Services", href: "/services" },
  { label: "AI Agent", href: "/ai-agent" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const primaryCta = {
  label: "Book a Consultation",
  href: "/contact",
} as const;

export const secondaryCta = {
  label: "Start Free",
  href: "/signup",
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
