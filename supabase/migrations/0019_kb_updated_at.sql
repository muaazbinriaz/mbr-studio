-- Prompt 18: Knowledge Base redesign needs a genuine "most recently
-- updated" sort (not just created_at) — re-indexing, refreshing from
-- source, and inline-editing a document should all bump it to the top
-- of the list. A trigger keeps this correct automatically across every
-- existing update path (reindex/refresh/edit) without having to
-- remember to set it manually in every server action.

alter table knowledge_base_documents
  add column if not exists updated_at timestamptz not null default now();

create or replace function set_kb_document_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_kb_documents_updated_at on knowledge_base_documents;
create trigger trg_kb_documents_updated_at
before update on knowledge_base_documents
for each row execute function set_kb_document_updated_at();