-- ============================================================
-- 0003_knowledge_base_vector_search.sql
-- Prompt 02 — Knowledge Base Ingestion & Embeddable Widget
-- Run this AFTER 0001_platform_core.sql and 0002_rls_policies.sql
-- ============================================================

-- ------------------------------------------------------------
-- Embedding dimension adjustment.
--
-- 0001_platform_core.sql declared knowledge_base_chunks.embedding as
-- vector(1536) as a placeholder. This project uses the Hugging Face
-- Inference API's free tier with sentence-transformers/all-MiniLM-L6-v2
-- (see lib/knowledge-base/embed.ts), which outputs 384-dim vectors —
-- not 1536. The table has no real rows yet at this point in the
-- project, so this is a straight type change rather than a backfill.
-- If you later swap embedding models, add a new migration that
-- re-embeds existing chunks rather than just changing this column —
-- an existing 384-dim vector is NOT comparable to a differently-sized
-- model's output.
-- ------------------------------------------------------------
alter table knowledge_base_chunks
  alter column embedding type vector(384);

-- ------------------------------------------------------------
-- Track why ingestion failed, not just that it failed. Referenced by
-- ingestDocument() (lib/knowledge-base/ingest.ts) and surfaced in the
-- /dashboard/knowledge-base UI next to the "error" status badge.
-- ------------------------------------------------------------
alter table knowledge_base_documents
  add column if not exists error_message text;

-- ------------------------------------------------------------
-- Vector similarity search, scoped to a single agent.
--
-- Called via supabase.rpc('match_knowledge_base_chunks', {...}) using
-- the SERVICE-ROLE client from app/api/widget/chat/route.ts, since
-- that route has no auth.uid() (it's public, gated by embed_keys
-- instead). target_agent_id must always come from a verified
-- embed_keys lookup — never from a client-supplied value — see
-- Section 8, rule #2 of this prompt and lib/supabase/admin.ts's
-- header comment.
-- ------------------------------------------------------------
create or replace function match_knowledge_base_chunks(
  query_embedding vector(384),
  target_agent_id uuid,
  match_count int default 5
)
returns table (id uuid, content text, similarity float)
language sql stable
as $$
  select
    knowledge_base_chunks.id,
    knowledge_base_chunks.content,
    1 - (knowledge_base_chunks.embedding <=> query_embedding) as similarity
  from knowledge_base_chunks
  where knowledge_base_chunks.agent_id = target_agent_id
  order by knowledge_base_chunks.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function match_knowledge_base_chunks(vector(384), uuid, int)
  to anon, authenticated, service_role;
