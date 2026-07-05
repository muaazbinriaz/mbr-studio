-- 0008_gemini_embeddings_768.sql
-- Switching embeddings from @xenova/transformers (local, 384-dim,
-- broken in Vercel's serverless runtime) to Google's Gemini
-- text-embedding-004 API (HTTP-based, 768-dim, no native binaries).

alter table knowledge_base_chunks
  alter column embedding type vector(768);

create or replace function match_knowledge_base_chunks(
  query_embedding vector(768),
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

grant execute on function match_knowledge_base_chunks(vector(768), uuid, int)
  to anon, authenticated, service_role;