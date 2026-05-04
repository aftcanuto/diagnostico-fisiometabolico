-- ============================================================
--  017 - Bucket 'branding' para logos de clínicas e assets
-- ============================================================
-- O bucket 'posturografia' existe mas o código de upload de logo
-- usa o bucket 'branding'. Esta migration cria e configura esse bucket.

-- Criar bucket branding (público para leitura — URLs diretas no PDF)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  5242880,  -- 5 MB máximo por arquivo
  array['image/png','image/jpeg','image/jpg','image/webp','image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/jpg','image/webp','image/svg+xml'];

-- Policy: qualquer authenticated pode fazer upload na própria pasta {clinica_id}/
drop policy if exists "branding_insert" on storage.objects;
create policy "branding_insert" on storage.objects
  for insert with check (
    bucket_id = 'branding'
    and auth.role() = 'authenticated'
  );

-- Policy: dono pode atualizar (upsert)
drop policy if exists "branding_update" on storage.objects;
create policy "branding_update" on storage.objects
  for update using (
    bucket_id = 'branding'
    and auth.role() = 'authenticated'
  );

-- Policy: dono pode deletar
drop policy if exists "branding_delete" on storage.objects;
create policy "branding_delete" on storage.objects
  for delete using (
    bucket_id = 'branding'
    and auth.role() = 'authenticated'
  );

-- Policy: leitura pública (para PDF e portal)
drop policy if exists "branding_public_select" on storage.objects;
create policy "branding_public_select" on storage.objects
  for select using (bucket_id = 'branding');
