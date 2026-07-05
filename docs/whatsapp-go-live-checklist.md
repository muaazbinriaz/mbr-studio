# WhatsApp Go-Live Checklist — First Real Client

Your `docs/platform-setup.md` already documents the underlying setup and
two real gotchas from Prompt 04. This is the condensed, ordered checklist
to run through before demoing/launching with an actual paying client —
skipping any step here is the #1 cause of "webhook says verified but real
messages never arrive."

## Before the client call

- [ ] Meta Developer App created (Business type), WhatsApp product added
- [ ] `META_APP_ID` / `META_APP_SECRET` in your env
- [ ] `CHANNEL_TOKEN_ENCRYPTION_KEY` generated and set (32-byte hex)
- [ ] `META_WEBHOOK_VERIFY_TOKEN` set, and matches what you'll enter in Meta's dashboard

## Per-client setup (repeat for every new WhatsApp connection)

1. [ ] Get a permanent access token via a System User (Business Settings) with `whatsapp_business_management` + `whatsapp_business_messaging` — not the 24h temporary token from API Setup.
2. [ ] **Subscribe the app to the client's specific WABA** — this is the step that's easy to miss:
   ```
   POST https://graph.facebook.com/v21.0/{waba-id}/subscribed_apps
   Authorization: Bearer {token}
   ```
   Verify with GET on the same endpoint → expect `{"success": true}`.
3. [ ] Configure the webhook once (shared across all clients, same callback URL):
   - Callback URL: `https://<your-domain>/api/channels/webhook`
   - Verify token: matches `META_WEBHOOK_VERIFY_TOKEN`
   - **Subscribe to the `messages` field explicitly** — not on by default.
4. [ ] Check phone number verification status — the silent failure mode:
   ```
   GET https://graph.facebook.com/v25.0/{waba-id}/phone_numbers
   ```
   If `code_verification_status` is `NOT_VERIFIED`, real customer messages will never reach your webhook, even though Meta's dashboard "Test" button will still succeed. Verify via `request_code` → `verify_code` before telling the client it's live.
5. [ ] Connect the channel from `/dashboard/channels` in your app (WABA ID, Phone Number ID, access token) — this writes the encrypted `channel_connections` row your webhook route actually reads from.
6. [ ] Confirm the client's plan includes WhatsApp (`Growth` or `Pro` — `Starter` is website-only). If they're on Starter, either upgrade them first or expect the connect action to block with the plan-gate error message.

## End-to-end test (do this yourself, not just Meta's dashboard test button)

- [ ] Send a real WhatsApp message from your own phone to the client's business number
- [ ] Confirm it appears in `/dashboard/inbox` within a few seconds
- [ ] Confirm the AI reply actually sends back to WhatsApp (check for delivery, not just that a row was inserted)
- [ ] Take over the conversation from the inbox, reply as a human, confirm it arrives on WhatsApp
- [ ] Hand back to AI, send another message, confirm the AI resumes

## Common failure → cause

| Symptom                                               | Likely cause                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Dashboard "Test" succeeds, real messages never arrive | Phone number `NOT_VERIFIED`, or `subscribed_apps` never called     |
| Webhook returns 401                                   | `META_APP_SECRET` mismatch or signature verification bug           |
| AI replies logged in DB but never arrive on WhatsApp  | Wrong/expired access token, or `phone_number_id` mismatch          |
| "Your plan doesn't include whatsapp" error on connect | Org plan is `starter` — approve a Growth/Pro billing request first |

Once this passes for your first client end-to-end, it's safe to repeat
steps 1–6 for every subsequent WhatsApp client without re-reading the
full Prompt 04 notes each time.
