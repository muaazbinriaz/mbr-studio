import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/config/contact";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";

/**
 * SEO PASS (Prompt 20): title trimmed from "Privacy Policy | MBR Studio" to
 * just "Privacy Policy" (see layout.tsx comment for the duplication bug
 * this avoids). Added canonical URL and a BreadcrumbList schema per
 * Blueprint Part 2 Section 13.
 */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MBR Studio collects, uses, and protects your information.",
  alternates: {
    canonical: "/privacy",
  },
};

const LAST_UPDATED = "July 1, 2026";

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Privacy Policy", url: `${siteConfig.url}/privacy` },
        ])}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-32">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            Legal
          </p>
          <h1
            className="font-heading text-h1-secondary font-bold leading-tight tracking-tight text-text
"
          >
            Privacy Policy
          </h1>
          <p className="mt-4 font-body text-sm text-secondary-text">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="mt-12 flex flex-col gap-10">
            <PolicySection title="1. Overview">
              <p>
                MBR Studio (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
                respects your privacy. This policy explains what information we
                collect when you use this website, how we use it, and the
                choices you have. It applies to visitors of mbrstudio.co and
                anyone who submits the contact form.
              </p>
            </PolicySection>

            <PolicySection title="2. Information we collect">
              <p>We collect information in two ways:</p>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
                <li>
                  <strong className="text-text">
                    Information you provide.
                  </strong>{" "}
                  When you submit the contact form, we collect your name, email
                  address, and any other details you choose to share (company,
                  phone number, project description).
                </li>
                <li>
                  <strong className="text-text">
                    Information collected automatically.
                  </strong>{" "}
                  Standard analytics data such as pages visited, device and
                  browser type, and approximate location, gathered through
                  Vercel Analytics and Google Analytics.
                </li>
              </ul>
            </PolicySection>

            <PolicySection title="3. How we use your information">
              <ul className="flex list-disc flex-col gap-2 pl-5">
                <li>
                  To respond to inquiries submitted through the contact form.
                </li>
                <li>
                  To send a one-time confirmation email after form submission.
                </li>
                <li>To understand how visitors use the site and improve it.</li>
                <li>To meet legal and security obligations.</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal information, and we do not use
                contact form submissions for marketing without your consent.
              </p>
            </PolicySection>

            <PolicySection title="4. Third-party services">
              <p>
                We rely on a small number of trusted providers to run this site:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
                <li>
                  <strong className="text-text">Resend</strong> — delivers
                  contact form notifications and auto-reply emails.
                </li>
                <li>
                  <strong className="text-text">Vercel</strong> — hosting and
                  analytics.
                </li>
                <li>
                  <strong className="text-text">Google Analytics</strong> —
                  aggregate, anonymized usage statistics.
                </li>
              </ul>
              <p className="mt-3">
                Each of these providers processes data under its own privacy
                policy and is bound by industry-standard data protection
                practices.
              </p>
            </PolicySection>

            <PolicySection title="5. Data retention">
              <p>
                Contact form submissions are retained for as long as reasonably
                necessary to respond to your inquiry and maintain business
                records, after which they are deleted or anonymized.
              </p>
            </PolicySection>

            <PolicySection title="6. Your rights">
              <p>
                Depending on where you live, you may have the right to access,
                correct, or delete the personal information we hold about you.
                To exercise any of these rights, contact us using the details
                below.
              </p>
            </PolicySection>

            <PolicySection title="7. Changes to this policy">
              <p>
                We may update this policy from time to time. Material changes
                will be reflected by updating the &quot;last updated&quot; date
                at the top of this page.
              </p>
            </PolicySection>

            <PolicySection title="8. Contact">
              <p>
                Questions about this policy can be sent to{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary underline underline-offset-2 hover:text-accent"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </PolicySection>
          </div>

          {/*
            INTERNAL NOTE — not rendered, not visible to visitors:
            This is placeholder legal content generated for scaffolding
            purposes. Have it reviewed by a lawyer familiar with your
            jurisdiction and client base (including US, UK, and UAE regulations
            such as GDPR) before publishing.
          */}
        </div>
      </section>
    </>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-text">{title}</h2>
      <div className="mt-3 font-body text-sm leading-relaxed text-secondary-text">
        {children}
      </div>
    </div>
  );
}
