import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Clock } from "lucide-react";

import { ContactForm } from "@/components/forms/ContactForm";
import {
  CONTACT_EMAIL,
  WHATSAPP_DISPLAY,
  WHATSAPP_DEFAULT_MESSAGE,
  buildWhatsAppLink,
} from "@/config/contact";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with MBR Studio to talk about your project — book a consultation, send a message, or chat on WhatsApp.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const whatsappHref = buildWhatsAppLink(WHATSAPP_DEFAULT_MESSAGE);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Contact", url: `${siteConfig.url}/contact` },
        ])}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              Contact
            </p>
            <h1
              className="font-heading text-h1-secondary font-bold leading-tight tracking-tight text-text
"
            >
              Let&apos;s talk about your project.
            </h1>
            <p className="mt-4 font-body text-base text-secondary-text sm:text-lg">
              Fill out the form, email directly, or message us on WhatsApp —
              whichever&apos;s easiest.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
            {/* Form */}
            <ContactForm />

            {/* Contact info */}
            <div className="space-y-6">
              <h2 className="sr-only">Other ways to reach us</h2>
              <InfoCard
                icon={Mail}
                title="Email"
                description="For detailed inquiries or file attachments."
              >
                <Link
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-body text-sm font-medium text-primary hover:text-accent"
                >
                  {CONTACT_EMAIL}
                </Link>
              </InfoCard>

              <InfoCard
                icon={MessageCircle}
                title="WhatsApp"
                description="Fastest way to reach us directly."
              >
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2.5 font-body text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-success/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </Link>
                <p className="mt-2 font-body text-xs text-secondary-text">
                  {WHATSAPP_DISPLAY}
                </p>
              </InfoCard>

              <InfoCard
                icon={Clock}
                title="Response time"
                description="We reply to every message the same day. Urgent? WhatsApp is faster."
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mb-1.5 font-heading text-base font-semibold text-text">
        {title}
      </h3>
      <p className="mb-3 font-body text-sm leading-relaxed text-secondary-text">
        {description}
      </p>
      {children}
    </div>
  );
}
