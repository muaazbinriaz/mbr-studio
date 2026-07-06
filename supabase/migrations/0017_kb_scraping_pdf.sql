-- 0017_kb_scraping_pdf.sql
-- Storage bucket for PDF knowledge-base uploads (private, scoped by
-- organization_id path prefix), plus a last_refreshed_at column for
-- URL-sourced documents' "Refresh from source" action.

insert into storage.buckets (id, name, public)
values ('knowledge-base-pdfs', 'knowledge-base-pdfs', false)
on conflict (id) do nothing;

-- Path convention: knowledge-base-pdfs/<organization_id>/<filename>.pdf
-- storage.foldername(name) splits the object path into folder segments;
-- [1] is the first one, i.e. the organization_id — reuses the same
-- is_org_accessible() function every other table's RLS already relies on.
create policy "org members can read their own kb pdfs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'knowledge-base-pdfs'
  and public.is_org_accessible((storage.foldername(name))[1]::uuid)
);

create policy "org members can upload their own kb pdfs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'knowledge-base-pdfs'
  and public.is_org_accessible((storage.foldername(name))[1]::uuid)
);

create policy "org members can delete their own kb pdfs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'knowledge-base-pdfs'
  and public.is_org_accessible((storage.foldername(name))[1]::uuid)
);

alter table knowledge_base_documents
  add column if not exists last_refreshed_at timestamptz;