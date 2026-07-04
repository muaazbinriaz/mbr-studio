# Prompt 02 — Knowledge Base Ingestion & Embeddable Widget

Addendum to `docs/platform-setup.md`. Append this content there once you've
copied these files into the repo — kept as a separate file here only
because I don't have the original `platform-setup.md` on disk to append to
directly.

## 1. Embeddings model choice (Section 3)

OpenRouter (already used for chat completions) does **not** expose a free
embeddings endpoint — it only routes LLM chat completions, so Option A
wasn't available. Went with **Option B**: the Hugging Face Inference API's
free tier, calling `sentence-transformers/all-MiniLM-L6-v2` (384-dim
output).

- Single call site: `lib/knowledge-base/embed.ts` → `embedText(text)`.
  Prompt 03's re-indexing and Prompt 04's multi-channel ingestion should
  both call this function, not a copy of it.
- The `knowledge_base_chunks.embedding` column was declared `vector(1536)`
  in `0001_platform_core.sql` as a placeholder. `0003_knowledge_base_vector_search.sql`
  alters it to `vector(384)` to match this model's real output — no
  truncation/padding hacks.
- `embedText()` throws (rather than silently truncating/padding) if the
  API ever returns a vector of unexpected length, so a model swap can't
  silently corrupt search results.

### Environment variable

Add to `.env.local` (and `.env.example`):

```
HF_API_KEY=
```

Generate a free access token at
[huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
(read-only scope is enough).

## 2. Migrations

Run, in order, after `0001_platform_core.sql` and `0002_rls_policies.sql`:

```
supabase/migrations/0003_knowledge_base_vector_search.sql
```

This migration:
- Alters `knowledge_base_chunks.embedding` from `vector(1536)` to `vector(384)`.
- Adds `knowledge_base_documents.error_message` (surfaced in the dashboard
  next to the "error" status badge).
- Creates `match_knowledge_base_chunks(query_embedding, target_agent_id, match_count)`,
  called via the **service-role client** from the public widget chat route
  (that route has no `auth.uid()`).

## 3. Where things live

| Concern | File |
|---|---|
| Chunking | `lib/knowledge-base/chunk.ts` |
| Embeddings | `lib/knowledge-base/embed.ts` |
| Ingestion pipeline | `lib/knowledge-base/ingest.ts` (`ingestDocument(documentId)`) |
| Widget system prompt builder | `lib/chat/agent-system-prompt.ts` (`buildAgentSystemPrompt`) — **this is the exact function Prompt 03 extends** for guardrails; the two marked extension points (`GUARDRAILS_INJECTION_POINT`, `LEAD_CAPTURE_TRIGGER_POINT`) live inside it |
| Shared rate limiter | `lib/rate-limit.ts` (`checkRateLimitFor(key, opts)`) — `lib/chat/rate-limit.ts` now delegates to it, keeping `app/api/chat/route.ts`'s existing import working unchanged |
| Dashboard KB management | `app/(platform-client)/dashboard/knowledge-base/{page.tsx,actions.ts,KnowledgeBaseClient.tsx}` |
| Public widget config API | `app/api/widget/config/route.ts` |
| Public widget chat API | `app/api/widget/chat/route.ts` (implements the 12-step order from Prompt 02 Section 6.2 exactly, in order, with inline `// Step N` comments) |
| Widget script | `lib/widget/chatbot-widget-source.js` (raw vanilla JS, no bundler) |
| Widget delivery route | `app/chatbot.js/route.ts` |

## 4. Bundle size

`lib/widget/chatbot-widget-source.js` is hand-written vanilla JS (no
React/Preact shipped to the host page) — raw size is a few KB, comfortably
under the 60kb-gzipped budget. Verify with:

```bash
curl -s http://localhost:3000/chatbot.js | gzip -c | wc -c
```

## 5. Testing end to end (Section 7)

1. **Get a test agent.** Either reuse the org/agent from Prompt 01's setup,
   or create a fresh one at `/admin/organizations`. Grab its `public_key`
   from the SQL query at the bottom of `docs/platform-setup.md`.

2. **Add a knowledge base document.** Log in as a user attached to that
   org (via `organization_members`), go to `/dashboard/knowledge-base`,
   and add a manual-text document with a few FAQ-style facts about a
   fake business (e.g. hours, delivery policy, pricing).

3. **Confirm ingestion worked.** In the Supabase SQL editor:

   ```sql
   select id, status, error_message from knowledge_base_documents
   order by created_at desc limit 1;

   select count(*), count(embedding) from knowledge_base_chunks
   where document_id = '<the id above>';
   ```

   `status` should be `ready`, and `count(embedding)` should equal
   `count(*)` (every chunk has a non-null embedding).

4. **Test the widget.** Open `test/widget-test.html` directly in a browser
   (edit `data-client` to your real public key first, and make sure
   `npm run dev` is running on `localhost:3000`). Click the launcher
   bubble, ask a question that's covered by the document you added, and
   confirm the answer is correct. Then ask something unrelated and confirm
   it deflects gracefully instead of guessing.

5. **Confirm data was recorded.**

   ```sql
   select * from conversations order by started_at desc limit 1;
   select * from messages order by created_at desc limit 5;
   select * from agent_daily_analytics where date = current_date;
   ```

   You should see a real conversation, both a `user` and `assistant`
   message row, and `agent_daily_analytics` incremented for today —
   not just schema-present-but-empty.

## 6. Handoff to Prompt 03

- **System prompt builder**: `lib/chat/agent-system-prompt.ts`,
  `buildAgentSystemPrompt()`. Extend this function's body (it already has
  `GUARDRAILS_INJECTION_POINT` and `LEAD_CAPTURE_TRIGGER_POINT` comments
  marking exactly where) — don't replace it, and don't change its input
  shape without updating the one call site in
  `app/api/widget/chat/route.ts`.
- **Lead capture trigger**: same file, `LEAD_CAPTURE_TRIGGER_POINT` — the
  actual redirect-to-lead-capture logic (fallback-detection regex, etc.)
  belongs in `app/api/widget/chat/route.ts` right after step 7/before
  step 8, referencing that marker.
- **Analytics**: `agent_daily_analytics` is genuinely being incremented
  from real conversations now (see `bumpDailyAnalytics()` in
  `app/api/widget/chat/route.ts`), not just schema-present-but-empty —
  confirmed via the SQL in step 5 above.
- **Domain verification**: the current allowlist check in
  `app/api/widget/chat/route.ts` (step 3) is a simple array match against
  `organizations.allowed_domains`. Full TXT-record domain-ownership
  verification is explicitly out of scope here and belongs in Prompt 03.

## 7. Known limitations (by design, for this prompt's scope)

- PDF upload and URL scraping are UI-only "coming soon" states — no
  backend wiring, per Section 4.4.
- Ingestion runs synchronously inside the server action. Fine for
  short FAQ documents; `ingestDocument()` takes only a document ID and
  does its own data access, so it can move to a background queue later
  without changing its internals.
- `bumpDailyAnalytics()` is a read-then-write increment, not atomic under
  heavy concurrent traffic. Acceptable for MVP volumes; noted in code for
  a future atomic-upsert replacement.
