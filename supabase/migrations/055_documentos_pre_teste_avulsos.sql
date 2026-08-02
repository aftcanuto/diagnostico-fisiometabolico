create table if not exists public.documentos_pre_teste_avulsos (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  tipo text not null check (tipo in ('anamnese','consentimento','recomendacoes')),
  token text not null unique,
  destinatario_nome text,
  destinatario_contato text,
  modelo_id uuid,
  recomendacoes_ids uuid[] not null default '{}',
  respostas jsonb not null default '{}'::jsonb,
  aceito_em timestamptz,
  respondido_em timestamptz,
  visualizado_em timestamptz,
  expira_em timestamptz not null default (now() + interval '30 days'),
  revogado boolean not null default false,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_documentos_pre_teste_avulsos_clinica
  on public.documentos_pre_teste_avulsos(clinica_id, created_at desc);

alter table public.documentos_pre_teste_avulsos enable row level security;

drop policy if exists "documentos_pre_teste_avulsos_clinica_all" on public.documentos_pre_teste_avulsos;
create policy "documentos_pre_teste_avulsos_clinica_all"
  on public.documentos_pre_teste_avulsos
  for all
  using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

notify pgrst, 'reload schema';
