-- 036 - Reparo das tabelas de pre-atendimento e comprovantes

create extension if not exists "uuid-ossp";

create table if not exists public.paciente_anamnese_links (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  template_id uuid references public.anamnese_templates(id) on delete set null,
  token text not null unique,
  expira_em timestamptz not null default (now() + interval '30 days'),
  revogado boolean not null default false,
  respondido_em timestamptz,
  criado_por uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_anamnese_links_paciente
  on public.paciente_anamnese_links(paciente_id, created_at desc);

create table if not exists public.paciente_anamnese_respostas (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  link_id uuid references public.paciente_anamnese_links(id) on delete set null,
  template_id uuid references public.anamnese_templates(id) on delete set null,
  respostas jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  enviado_em timestamptz not null default now()
);

create index if not exists idx_anamnese_respostas_paciente
  on public.paciente_anamnese_respostas(paciente_id, enviado_em desc);

create table if not exists public.consentimento_aceites (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  modelo_id uuid references public.consentimento_modelos(id) on delete restrict,
  modelo_nome text not null,
  modelo_tipo text not null,
  texto_versao int not null,
  texto_aceito text not null,
  aceito_em timestamptz not null default now(),
  ip text,
  user_agent text,
  token text,
  created_at timestamptz default now()
);

alter table public.consentimento_aceites
  add column if not exists token text;
alter table public.consentimento_aceites
  add column if not exists ip text;
alter table public.consentimento_aceites
  add column if not exists user_agent text;
alter table public.consentimento_aceites
  add column if not exists texto_aceito text;
alter table public.consentimento_aceites
  add column if not exists texto_versao int;

create index if not exists idx_consentimento_aceites_paciente
  on public.consentimento_aceites(paciente_id, aceito_em desc);
create index if not exists idx_consentimento_aceites_token
  on public.consentimento_aceites(token);

alter table public.paciente_anamnese_links enable row level security;
alter table public.paciente_anamnese_respostas enable row level security;
alter table public.consentimento_aceites enable row level security;

drop policy if exists "anamnese_links_clinica_all" on public.paciente_anamnese_links;
create policy "anamnese_links_clinica_all" on public.paciente_anamnese_links
  for all using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

drop policy if exists "anamnese_respostas_clinica_select" on public.paciente_anamnese_respostas;
create policy "anamnese_respostas_clinica_select" on public.paciente_anamnese_respostas
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "anamnese_respostas_clinica_insert" on public.paciente_anamnese_respostas;
create policy "anamnese_respostas_clinica_insert" on public.paciente_anamnese_respostas
  for insert with check (public.is_membro_clinica(clinica_id));

drop policy if exists "consentimento_aceites_clinica_select" on public.consentimento_aceites;
create policy "consentimento_aceites_clinica_select" on public.consentimento_aceites
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "consentimento_aceites_clinica_insert" on public.consentimento_aceites;
create policy "consentimento_aceites_clinica_insert" on public.consentimento_aceites
  for insert with check (public.is_membro_clinica(clinica_id));
