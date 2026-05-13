-- 033 - Modelos de plano de acao, plano alimentar e central do paciente

create extension if not exists "uuid-ossp";

create table if not exists public.plano_acao_modelos (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  objetivo text not null default 'personalizado',
  nome text not null,
  descricao text,
  prioridades text,
  metas_30_dias text,
  metas_60_dias text,
  metas_90_dias text,
  recomendacoes jsonb not null default '{}'::jsonb,
  alertas_encaminhamento text,
  ativo boolean not null default true,
  padrao boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.plano_acao_modelos
  drop constraint if exists plano_acao_modelos_objetivo_check;

alter table public.plano_acao_modelos
  add constraint plano_acao_modelos_objetivo_check
  check (objetivo in ('emagrecimento','corrida','hipertrofia','dor','performance','saude','recomposicao','personalizado'));

create index if not exists idx_plano_acao_modelos_clinica_objetivo
  on public.plano_acao_modelos(clinica_id, objetivo);

create table if not exists public.plano_alimentar_modelos (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  objetivo text not null default 'personalizado',
  nome text not null,
  descricao text,
  fator_atividade numeric(4,2) not null default 1.40,
  ajuste_calorico_kcal integer not null default 0,
  proteina_g_kg numeric(4,2) not null default 1.60,
  gordura_pct numeric(5,2) not null default 30,
  agua_ml_kg integer not null default 35,
  fibras_g integer not null default 25,
  refeicoes jsonb not null default '[]'::jsonb,
  observacoes text,
  referencias text,
  ativo boolean not null default true,
  padrao boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.plano_alimentar_modelos
  drop constraint if exists plano_alimentar_modelos_objetivo_check;

alter table public.plano_alimentar_modelos
  add constraint plano_alimentar_modelos_objetivo_check
  check (objetivo in ('emagrecimento','corrida','hipertrofia','dor','performance','saude','recomposicao','personalizado'));

alter table public.plano_alimentar_modelos
  drop constraint if exists plano_alimentar_modelos_ranges_check;

alter table public.plano_alimentar_modelos
  add constraint plano_alimentar_modelos_ranges_check
  check (
    fator_atividade between 1.0 and 2.5
    and proteina_g_kg between 0.6 and 4.0
    and gordura_pct between 10 and 50
    and agua_ml_kg between 15 and 80
    and fibras_g between 0 and 80
  );

create index if not exists idx_plano_alimentar_modelos_clinica_objetivo
  on public.plano_alimentar_modelos(clinica_id, objetivo);

create table if not exists public.plano_alimentar_avaliacoes (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid not null references public.avaliacoes(id) on delete cascade,
  modelo_id uuid references public.plano_alimentar_modelos(id) on delete set null,
  objetivo text,
  tmb_origem text,
  tmb_kcal numeric(8,2),
  fator_atividade numeric(4,2),
  vet_kcal numeric(8,2),
  proteina_g numeric(8,2),
  carboidrato_g numeric(8,2),
  gordura_g numeric(8,2),
  agua_ml numeric(8,2),
  fibras_g numeric(8,2),
  observacoes text,
  calculo jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(avaliacao_id)
);

create index if not exists idx_plano_alimentar_avaliacoes_paciente
  on public.plano_alimentar_avaliacoes(paciente_id, created_at desc);

alter table public.plano_acao_modelos enable row level security;
alter table public.plano_alimentar_modelos enable row level security;
alter table public.plano_alimentar_avaliacoes enable row level security;

drop policy if exists "plano_acao_modelos_clinica_select" on public.plano_acao_modelos;
create policy "plano_acao_modelos_clinica_select" on public.plano_acao_modelos
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "plano_acao_modelos_admin_insert" on public.plano_acao_modelos;
create policy "plano_acao_modelos_admin_insert" on public.plano_acao_modelos
  for insert with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "plano_acao_modelos_admin_update" on public.plano_acao_modelos;
create policy "plano_acao_modelos_admin_update" on public.plano_acao_modelos
  for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
  with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "plano_acao_modelos_admin_delete" on public.plano_acao_modelos;
create policy "plano_acao_modelos_admin_delete" on public.plano_acao_modelos
  for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "plano_alimentar_modelos_clinica_select" on public.plano_alimentar_modelos;
create policy "plano_alimentar_modelos_clinica_select" on public.plano_alimentar_modelos
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "plano_alimentar_modelos_admin_insert" on public.plano_alimentar_modelos;
create policy "plano_alimentar_modelos_admin_insert" on public.plano_alimentar_modelos
  for insert with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "plano_alimentar_modelos_admin_update" on public.plano_alimentar_modelos;
create policy "plano_alimentar_modelos_admin_update" on public.plano_alimentar_modelos
  for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
  with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "plano_alimentar_modelos_admin_delete" on public.plano_alimentar_modelos;
create policy "plano_alimentar_modelos_admin_delete" on public.plano_alimentar_modelos
  for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "plano_alimentar_avaliacoes_clinica_all" on public.plano_alimentar_avaliacoes;
create policy "plano_alimentar_avaliacoes_clinica_all" on public.plano_alimentar_avaliacoes
  for all using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));
