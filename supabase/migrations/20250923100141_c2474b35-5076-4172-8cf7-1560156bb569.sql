-- Make 'loan-documents' bucket public for easy preview links
update storage.buckets set public = true where id = 'loan-documents';

-- Allow anonymous (non-Supabase-auth) clients to work during demo
create policy if not exists "Public can upload to loan-documents"
  on storage.objects for insert to public
  with check (bucket_id = 'loan-documents');

create policy if not exists "Public can view loan-documents"
  on storage.objects for select to public
  using (bucket_id = 'loan-documents');

-- Optional for demo: allow edits/deletes (recommended to tighten when auth is added)
create policy if not exists "Public can update loan-documents"
  on storage.objects for update to public
  using (bucket_id = 'loan-documents');

create policy if not exists "Public can delete loan-documents"
  on storage.objects for delete to public
  using (bucket_id = 'loan-documents');