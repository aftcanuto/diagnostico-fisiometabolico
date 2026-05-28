-- 048 - Garante bucket e policies para imagens comerciais dos produtos

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'produto-imagens',
  'produto-imagens',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "produto_imagens_public_select" on storage.objects;
create policy "produto_imagens_public_select" on storage.objects
  for select using (bucket_id = 'produto-imagens');

drop policy if exists "produto_imagens_member_insert" on storage.objects;
create policy "produto_imagens_member_insert" on storage.objects
  for insert with check (
    bucket_id = 'produto-imagens'
    and auth.uid() is not null
    and coalesce((storage.foldername(name))[1], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.is_membro_clinica(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "produto_imagens_member_update" on storage.objects;
create policy "produto_imagens_member_update" on storage.objects
  for update using (
    bucket_id = 'produto-imagens'
    and auth.uid() is not null
    and coalesce((storage.foldername(name))[1], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.is_membro_clinica(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'produto-imagens'
    and auth.uid() is not null
    and coalesce((storage.foldername(name))[1], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.is_membro_clinica(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "produto_imagens_member_delete" on storage.objects;
create policy "produto_imagens_member_delete" on storage.objects
  for delete using (
    bucket_id = 'produto-imagens'
    and auth.uid() is not null
    and coalesce((storage.foldername(name))[1], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.is_membro_clinica(((storage.foldername(name))[1])::uuid)
  );
