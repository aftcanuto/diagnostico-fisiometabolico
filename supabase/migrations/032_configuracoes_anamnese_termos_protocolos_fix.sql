-- 032 - Alinhamento de configuracoes: anamnese, termos e protocolos
-- Corrige constraints divergentes em bancos ja atualizados manualmente e garante
-- que as tabelas de engajamento existam antes do deploy.

create extension if not exists "uuid-ossp";

-- Modelos de consentimento e TCLE
create table if not exists public.consentimento_modelos (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  tipo text not null,
  nome text not null,
  descricao text,
  texto text not null,
  ativo boolean not null default true,
  padrao boolean not null default false,
  versao int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.consentimento_modelos
  drop constraint if exists consentimento_modelos_tipo_check;

alter table public.consentimento_modelos
  add constraint consentimento_modelos_tipo_check
  check (tipo in (
    'consentimento_informado',
    'consentimento',
    'uso_imagem',
    'tcle'
  ));

create index if not exists idx_consentimento_modelos_clinica
  on public.consentimento_modelos(clinica_id);

-- Biblioteca de protocolos
create table if not exists public.protocolo_recomendacoes (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  modulo text not null,
  titulo text not null,
  texto text not null,
  ativo boolean not null default true,
  padrao boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.protocolo_recomendacoes
  drop constraint if exists protocolo_recomendacoes_modulo_check;

alter table public.protocolo_recomendacoes
  add constraint protocolo_recomendacoes_modulo_check
  check (modulo in (
    'anamnese',
    'sinais_vitais',
    'posturografia',
    'bioimpedancia',
    'antropometria',
    'flexibilidade',
    'forca',
    'rml',
    'cardiorrespiratorio',
    'biomecanica_corrida',
    'biomecanica'
  ));

create index if not exists idx_protocolos_clinica_modulo
  on public.protocolo_recomendacoes(clinica_id, modulo);

create table if not exists public.protocolo_envios (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  recomendacoes_ids uuid[] not null default '{}',
  canal text not null default 'email',
  destino text,
  status text not null default 'registrado',
  enviado_por uuid references auth.users(id),
  enviado_em timestamptz default now(),
  observacao text
);

alter table public.protocolo_envios
  drop constraint if exists protocolo_envios_canal_check;
alter table public.protocolo_envios
  add constraint protocolo_envios_canal_check
  check (canal in ('email','whatsapp','manual'));

alter table public.protocolo_envios
  drop constraint if exists protocolo_envios_status_check;
alter table public.protocolo_envios
  add constraint protocolo_envios_status_check
  check (status in ('registrado','enviado','erro','revogado'));

create index if not exists idx_protocolo_envios_paciente
  on public.protocolo_envios(paciente_id, enviado_em desc);

-- Links publicos de consentimento
create table if not exists public.consentimento_links (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  modelo_id uuid not null references public.consentimento_modelos(id) on delete restrict,
  token text not null unique,
  expira_em timestamptz not null default (now() + interval '30 days'),
  revogado boolean not null default false,
  aceito_em timestamptz,
  criado_por uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_consentimento_links_paciente
  on public.consentimento_links(paciente_id, created_at desc);

-- RLS e policies
alter table public.consentimento_modelos enable row level security;
alter table public.protocolo_recomendacoes enable row level security;
alter table public.protocolo_envios enable row level security;
alter table public.consentimento_links enable row level security;

drop policy if exists "consentimento_modelos_clinica_select" on public.consentimento_modelos;
create policy "consentimento_modelos_clinica_select" on public.consentimento_modelos
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "consentimento_modelos_admin_insert" on public.consentimento_modelos;
create policy "consentimento_modelos_admin_insert" on public.consentimento_modelos
  for insert with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "consentimento_modelos_admin_update" on public.consentimento_modelos;
create policy "consentimento_modelos_admin_update" on public.consentimento_modelos
  for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
  with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "consentimento_modelos_admin_delete" on public.consentimento_modelos;
create policy "consentimento_modelos_admin_delete" on public.consentimento_modelos
  for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "protocolos_clinica_select" on public.protocolo_recomendacoes;
create policy "protocolos_clinica_select" on public.protocolo_recomendacoes
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "protocolos_admin_insert" on public.protocolo_recomendacoes;
create policy "protocolos_admin_insert" on public.protocolo_recomendacoes
  for insert with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "protocolos_admin_update" on public.protocolo_recomendacoes;
create policy "protocolos_admin_update" on public.protocolo_recomendacoes
  for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
  with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "protocolos_admin_delete" on public.protocolo_recomendacoes;
create policy "protocolos_admin_delete" on public.protocolo_recomendacoes
  for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "protocolo_envios_clinica_all" on public.protocolo_envios;
create policy "protocolo_envios_clinica_all" on public.protocolo_envios
  for all using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

drop policy if exists "consentimento_links_clinica_select" on public.consentimento_links;
create policy "consentimento_links_clinica_select" on public.consentimento_links
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "consentimento_links_clinica_insert" on public.consentimento_links;
create policy "consentimento_links_clinica_insert" on public.consentimento_links
  for insert with check (public.is_membro_clinica(clinica_id));

drop policy if exists "consentimento_links_clinica_update" on public.consentimento_links;
create policy "consentimento_links_clinica_update" on public.consentimento_links
  for update using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));
