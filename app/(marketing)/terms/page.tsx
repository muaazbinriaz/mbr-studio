import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/config/contact";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";

/**
 * SEO PASS (Prompt 20): title trimmed from "Terms of Service | MBR Studio"
 * to just "Terms of Service" (see layout.tsx comment for the duplication
 * bug this avoids). Added canonical URL and a BreadcrumbList schema per
 * Blueprint Part 2 Section 13.
 */
export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern use of the MBR Studio website and services.",
  alternates: {
    canonical: "/terms",
  },
};

const LAST_UPDATED = "July 1, 2026";

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Terms of Service", url: `${siteConfig.url}/terms` },
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
            Terms of Service
          </h1>
          <p className="mt-4 font-body text-sm text-secondary-text">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="mt-12 flex flex-col gap-10">
            <TermsSection title="1. Acceptance of terms">
              <p>
                By accessing mbrstudio.co, you agree to these terms. If you do
                not agree, please do not use this website.
              </p>
            </TermsSection>

            <TermsSection title="2. Use of this website">
              <p>
                This website is provided to share information about MBR
                Studio&apos;s services and to allow prospective clients to get
                in touch. You agree not to misuse the site, including attempting
                to disrupt its operation, submitting the contact form for spam,
                or scraping content without permission.
              </p>
            </TermsSection>

            <TermsSection title="3. Services and engagements">
              <p>
                Information on this website (including services, pricing ranges,
                and timelines) is general and for informational purposes only.
                It does not constitute a binding offer. Any actual engagement
                with MBR Studio is governed by a separate signed agreement or
                statement of work that sets out scope, deliverables, timeline,
                and pricing.
              </p>
            </TermsSection>

            <TermsSection title="4. Intellectual property">
              <p>
                Unless otherwise noted, the content on this site — including
                copy, design, and code — is the property of MBR Studio and may
                not be reproduced without permission. Client work shown in the
                Portfolio and Case Studies sections is shared with permission
                and remains the property of its respective owner unless stated
                otherwise.
              </p>
            </TermsSection>

            <TermsSection title="5. No warranty">
              <p>
                This website is provided &quot;as is&quot; without warranties of
                any kind. While we aim to keep information accurate and up to
                date, we make no guarantees about completeness or accuracy.
              </p>
            </TermsSection>

            <TermsSection title="6. Limitation of liability">
              <p>
                To the fullest extent permitted by law, MBR Studio is not liable
                for any indirect, incidental, or consequential damages arising
                from your use of this website.
              </p>
            </TermsSection>

            <TermsSection title="7. Changes to these terms">
              <p>
                We may update these terms from time to time. Continued use of
                the site after changes are posted constitutes acceptance of the
                revised terms.
              </p>
            </TermsSection>

            <TermsSection title="8. Contact">
              <p>
                Questions about these terms can be sent to{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary underline underline-offset-2 hover:text-accent"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </TermsSection>
          </div>

          {/*
            INTERNAL NOTE — not rendered, not visible to visitors:
            This is placeholder legal content generated for scaffolding
            purposes. Have it reviewed by a lawyer familiar with your
            jurisdiction and client base before publishing.
          */}
        </div>
      </section>
    </>
  );
}

function TermsSection({
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
