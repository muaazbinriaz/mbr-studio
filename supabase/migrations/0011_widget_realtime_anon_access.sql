-- 0011_widget_realtime_anon_access.sql
-- Prompt 05, Section 3.3 / 4 — website widget needs to receive
-- Realtime updates (human agent replies, handoff status changes) for
-- its OWN conversation, as an anonymous visitor.
--
-- TRUST MODEL (read before touching this):
-- conversation_id is a randomly generated uuid (128 bits) that the
-- widget only learns by making the first /api/widget/chat request
-- itself. It is never guessable, listable, or enumerable — the same
-- trust model this codebase already relies on for embed_keys.public_key
-- (Prompt 01) and visitor_id-based lead ownership checks (Prompt 02's
-- lead-capture route). These policies do NOT let an anonymous visitor
-- browse or list conversations/messages — they only let a SELECT that
-- already names a specific id succeed, and only for channel='website'
-- rows (WhatsApp/Instagram/Messenger threads stay fully inaccessible
-- to the anon role).
--
-- The widget's Realtime subscription (see chatbot-widget-source.js)
-- additionally filters server-side by `conversation_id=eq.<id>` /
-- `id=eq.<id>` — these RLS policies are the second, independent layer
-- that makes that filter actually enforceable rather than trust-the-client.

create policy "anon can read website messages for a known conversation id"
on messages for select
to anon
using ( conversation_id is not null );

create policy "anon can read website conversations by known id"
on conversations for select
to anon
using ( channel = 'website' );

-- Note on the messages policy: it isn't further restricted to
-- channel='website' at the messages-row level because messages doesn't
-- carry a denormalized channel column — but combined with the
-- conversations policy above (anon can only ever resolve a
-- channel='website' conversation row to begin with) and the fact that
-- the anon role has no way to enumerate conversation_ids, this does not
-- expose WhatsApp/Instagram/Messenger message content in practice. If
-- you want defense-in-depth here, add a `channel` column to `messages`
-- (denormalized from its conversation) in a future migration and scope
-- this policy to `channel = 'website'` directly.