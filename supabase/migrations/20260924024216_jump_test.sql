-- Jump Test MedFit. Executar integralmente no SQL Editor apos migrations 001-069.
-- Nao altera resultados existentes nem ativa o modulo em avaliacoes antigas.
begin;
create table if not exists public.jump_test (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  versao integer not null default 1 check (versao = 1),
  peso_kg numeric check (peso_kg > 0 and peso_kg <= 500),
  esporte text not null default '', nivel text not null default '',
  equipamento text not null default 'JumpTest - 2 placas', software text not null default '',
  metodo_potencia text not null default '',
  altura_queda_cm numeric not null default 30 check (altura_queda_cm between 5 and 100),
  duracao_s integer not null default 15 check (duracao_s = 15),
  bracos text not null default 'cintura' check (bracos in ('cintura','livres')),
  descanso_s integer not null default 60 check (descanso_s between 0 and 600),
  familiarizacao boolean not null default false, apto boolean not null default false,
  repetidos_serie_completa boolean not null default false,
  protocolos jsonb not null default '[]'::jsonb check (jsonb_typeof(protocolos) = 'array'),
  tentativas jsonb not null default '[]'::jsonb check (jsonb_typeof(tentativas) = 'array'),
  observacoes text not null default '', conclusao text not null default '',
  referencia text not null default 'nenhuma' check (referencia in ('nenhuma','futebol_cadete','futebol_juvenil')),
  referencia_justificativa text not null default '',
  documento_path text check (documento_path is null or split_part(documento_path, '/', 1) = avaliacao_id::text),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.jump_test enable row level security;
revoke all on public.jump_test from anon, authenticated;
grant select, insert, update, delete on public.jump_test to authenticated;
grant all on public.jump_test to service_role;
drop policy if exists jump_test_access on public.jump_test;
create policy jump_test_access on public.jump_test for all to authenticated
  using (public.user_owns_avaliacao(avaliacao_id))
  with check (public.user_owns_avaliacao(avaliacao_id));
drop trigger if exists trg_jump_test_updated_at on public.jump_test;
create trigger trg_jump_test_updated_at before update on public.jump_test
  for each row execute function public.set_updated_at();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('jump-test', 'jump-test', false, 10485760, array['application/pdf'])
on conflict (id) do update set public=false, file_size_limit=10485760, allowed_mime_types=array['application/pdf'];
drop policy if exists jump_test_document_select on storage.objects;
create policy jump_test_document_select on storage.objects for select to authenticated using (
  bucket_id='jump-test' and exists (select 1 from public.avaliacoes a
    where a.id::text = (storage.foldername(name))[1] and public.user_owns_avaliacao(a.id))
);
drop policy if exists jump_test_document_insert on storage.objects;
create policy jump_test_document_insert on storage.objects for insert to authenticated with check (
  bucket_id='jump-test' and exists (select 1 from public.avaliacoes a
    where a.id::text = (storage.foldername(name))[1] and public.user_owns_avaliacao(a.id))
);
-- Originals are immutable from the UI; replacements create new objects.
alter table public.analises_ia drop constraint if exists analises_ia_tipo_check;
alter table public.analises_ia add constraint analises_ia_tipo_check check (tipo in (
  'anamnese','sinais_vitais','posturografia','termografia','jump_test','antropometria',
  'bioimpedancia','forca','flexibilidade','rml','cardiorrespiratorio',
  'biomecanica_corrida','conclusao_global','evolucao'
));
notify pgrst, 'reload schema';
commit;
