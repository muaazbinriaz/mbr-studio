# MBR Studio

Portfolio site + AI agent SaaS platform for MBR Studio — websites, AI-powered automation, and digital products for growing businesses.

## Route groups

- `app/(marketing)` — public site: home, services, ai-agent, portfolio, about, blog, case studies, contact, legal pages.
- `app/(platform-client)` — logged-in client dashboard (agent config, guardrails, billing, etc.).
- `app/(platform-admin)` — internal admin console (org management, billing requests, settings).
- `app/(platform-auth)` — login/signup flows, isolated layout from the rest of the app.

## Getting started

```bash
npm install
npm run dev
```

App runs at http://localhost:3000.

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `RESEND_API_KEY` — transactional email
- `OPENROUTER_API_KEY`, `GOOGLE_AI_API_KEY` — AI provider keys for the chat widget/agent
- `NEXT_PUBLIC_SITE_URL` — canonical site URL (used for SEO metadata/OG images)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase project (auth + DB)
- `META_APP_ID`, `META_APP_SECRET`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_ACCESS_TOKEN` — WhatsApp Cloud API integration
- `META_WEBHOOK_VERIFY_TOKEN` — WhatsApp webhook verification
- `CHANNEL_TOKEN_ENCRYPTION_KEY` — encrypts stored channel access tokens at rest
- `NEXT_PUBLIC_GA_ID` — optional, enables Google Analytics after cookie consent

## Design system

UI follows the **Blueprint** convention documented inline throughout the codebase (see comments in `app/layout.tsx`, component files, etc.) — a token-based design system (`.glass-card`, `.animated-border`, theme tokens) that all new UI should extend rather than bypass. Check existing components in `components/` before introducing a new pattern.
