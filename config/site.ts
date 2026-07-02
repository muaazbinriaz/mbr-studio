export const siteConfig = {
  name: "MBR Studio",
  title: "MBR Studio — Digital products, built to grow your business.",
  founder: "Muaaz Bin Riaz",
  tagline: "Digital products, built to grow your business.",
  description:
    "MBR Studio is a premium software agency building websites, AI-powered automation, and digital products for growing businesses.",
  url: "https://mbrstudio.com",
  ogImage: "/og-images/default.png",
  email: "hello@mbrstudio.com",
  // Added fields for the chat route
  consultationUrl: "https://cal.com/mbr-studio/consultation",
  contactEmail: "mbrstudio.dev@gmail.com",
  links: {
    twitter: "https://twitter.com/mbrstudio",
    linkedin: "https://linkedin.com/company/mbrstudio",
    github: "https://github.com/mbrstudio",
  },
} as const;

export const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const primaryCta = {
  label: "Book a Consultation",
  href: "/contact",
} as const;

// New helper function for WhatsApp handoff
export function getWhatsappLink(): string {
  // Replace with your actual WhatsApp number (include country code, e.g., "923001234567")
  return "https://wa.me/923340819120";
}
