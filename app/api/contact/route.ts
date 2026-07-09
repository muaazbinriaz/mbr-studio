import { NextResponse } from "next/server";
import { Resend } from "resend";

import { contactFormSchema } from "@/lib/validations/contact";
import { getClientIp } from "@/lib/rate-limit";
import {
  CONTACT_EMAIL,
  SERVICE_OPTIONS,
  BUDGET_OPTIONS,
  WHATSAPP_DISPLAY,
} from "@/config/contact";

// Simple in-memory rate limit. Resets on cold start, which is fine for
// a low-volume contact form — swap for Upstash/Redis if traffic grows.
const submissionsByIp = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  recent.push(now);
  submissionsByIp.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function labelFor(
  options: readonly { value: string; label: string }[],
  value?: string,
) {
  return options.find((o) => o.value === value)?.label ?? "—";
}

// Visitor-supplied fields get interpolated into HTML emails below —
// escape them so a message containing markup/links can't inject into
// the internal notification or the visitor's own auto-reply.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please check the form for errors and try again.",
        },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      company,
      phone,
      service,
      budget,
      message,
      company_website,
    } = parsed.data;

    // Honeypot tripped — return a fake success so bots learn nothing,
    // but skip sending any email.
    if (company_website) {
      return NextResponse.json({ success: true });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = company ? escapeHtml(company) : "";
    const safePhone = phone ? escapeHtml(phone) : "";
    const safeMessage = escapeHtml(message);

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set.");
      return NextResponse.json(
        { success: false, error: "Email service is not configured." },
        { status: 500 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const serviceLabel = labelFor(SERVICE_OPTIONS, service);
    const budgetLabel = budget
      ? labelFor(BUDGET_OPTIONS, budget)
      : "Not provided";

    // Notification to the MBR Studio inbox.
    await resend.emails.send({
      from: `MBR Studio Website <notifications@mbrstudio.dev>`,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `New inquiry: ${serviceLabel} — ${name}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">New contact form submission</h2>
          <p style="color: #667085; margin-top: 0;">via mbrstudio.dev</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #667085; width: 140px;">Name</td><td style="padding: 8px 0;">${safeName}</td></tr>
            <tr><td style="padding: 8px 0; color: #667085;">Email</td><td style="padding: 8px 0;">${safeEmail}</td></tr>
            <tr><td style="padding: 8px 0; color: #667085;">Company</td><td style="padding: 8px 0;">${safeCompany || "—"}</td></tr>
            <tr><td style="padding: 8px 0; color: #667085;">Phone</td><td style="padding: 8px 0;">${safePhone || "—"}</td></tr>
            <tr><td style="padding: 8px 0; color: #667085;">Service</td><td style="padding: 8px 0;">${serviceLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #667085;">Budget</td><td style="padding: 8px 0;">${budgetLabel}</td></tr>
          </table>
          <p style="color: #667085; margin-bottom: 4px;">Message</p>
          <p style="white-space: pre-wrap; line-height: 1.6;">${safeMessage}</p>
        </div>
      `,
    });

    // Auto-reply to the visitor.
    await resend.emails.send({
      from: `MBR Studio <notifications@mbrstudio.dev>`,
      to: email,
      replyTo: CONTACT_EMAIL,
      subject: "We've received your message — MBR Studio",
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
          <p>Hi ${safeName.split(" ")[0]},</p>
          <p>
            Thanks for reaching out to MBR Studio. We've received your message
            about <strong>${serviceLabel}</strong> and will follow up within
            1–2 business days.
          </p>
          <p>If it's urgent, you can also reach us on WhatsApp at ${WHATSAPP_DISPLAY}.</p>
          <p>— MBR Studio</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
