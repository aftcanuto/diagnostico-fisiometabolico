-- ============================================================
--  DIAGNÓSTICO FISIOMETABÓLICO - SCHEMA 001
-- ============================================================
-- Supõe auth.users (Supabase Auth) já ativo.
-- Cada avaliador = um auth.users. Paciente pertence a avaliador.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- PERFIL DO AVALIADOR ----------
create table if not exists public.avaliadores (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  crefito_crm text,
  created_at timestamptz default now()
);

-- ---------- PACIENTES ----------
create table if not exists public.pacientes (
  id uuid primary key default uuid_generate_v4(),
  avaliador_id uuid not null references public.avaliadores(id) on delete cascade,
  nome text not null,
  sexo text not null check (sexo in ('M','F')),
  data_nascimento date not null,
  telefone text,
  email text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_pacientes_avaliador on public.pacientes(avaliador_id);

-- ---------- AVALIAÇÕES ----------
create table if not exists public.avaliacoes (
  id uuid primary key default uuid_generate_v4(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliador_id uuid not null references public.avaliadores(id) on delete cascade,
  data date not null default current_date,
  tipo text not null default 'completo' check (tipo in ('completo','personalizado')),
  status text not null default 'em_andamento' check (status in ('em_andamento','finalizada','arquivada')),
  modulos_selecionados jsonb not null default '{
    "anamnese":true,
    "sinais_vitais":false,
    "posturografia":false,
    "antropometria":false,
    "forca":false,
    "cardiorrespiratorio":false
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_aval_paciente on public.avaliacoes(paciente_id);

-- ---------- ANAMNESE ----------
create table if not exists public.anamnese (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  queixa_principal text,
  historia_doenca_atual text,
  historico_medico jsonb default '{}'::jsonb,      -- {hipertensao, diabetes, ...}
  medicamentos text,
  cirurgias text,
  alergias text,
  habitos jsonb default '{}'::jsonb,               -- {tabagismo, alcool, sono, ...}
  atividade_fisica jsonb default '{}'::jsonb,      -- {frequencia, tipo, tempo_semana}
  historia_familiar text,
  objetivos text,
  updated_at timestamptz default now()
);

-- ---------- SINAIS VITAIS ----------
create table if not exists public.sinais_vitais (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  pa_sistolica int,
  pa_diastolica int,
  fc_repouso int,
  spo2 numeric(4,1),
  temperatura numeric(3,1),
  freq_respiratoria int,
  updated_at timestamptz default now()
);

-- ---------- POSTUROGRAFIA ----------
create table if not exists public.posturografia (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  foto_anterior text,         -- URL storage
  foto_posterior text,
  foto_lateral_dir text,
  foto_lateral_esq text,
  alinhamentos jsonb default '{}'::jsonb,
  /* ex: {
     cabeca_anteriorizada: true, ombros_protrusos: false,
     hiperlordose_lombar: false, joelhos_valgo: false, pe_plano: false ...
  } */
  observacoes text,
  updated_at timestamptz default now()
);

-- ---------- ANTROPOMETRIA ----------
create table if not exists public.antropometria (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  peso numeric(5,2),
  estatura numeric(5,2),              -- cm
  -- Dobras (mm) — cada dobra tem medida1, medida2, medida3 (opcional)
  dobras jsonb default '{}'::jsonb,
  /* formato:
     {
       "triceps":        {"m1":12, "m2":12.4, "m3": null, "media": 12.2},
       "subescapular":   {...},
       "peitoral":       {...},
       "axilar_media":   {...},
       "supra_iliaca":   {...},
       "abdominal":      {...},
       "coxa":           {...}
     }
  */
  circunferencias jsonb default '{}'::jsonb,
  /* { braco_relaxado, braco_contraido, antebraco, cintura, abdome,
       quadril, coxa_proximal, coxa_medial, panturrilha, torax } em cm */
  diametros jsonb default '{}'::jsonb,
  /* { umero, femur, biacromial, biiliocristal } em cm */
  -- Resultados calculados
  percentual_gordura numeric(5,2),
  massa_magra numeric(5,2),
  massa_ossea numeric(5,2),
  imc numeric(5,2),
  somatotipo jsonb,    -- {endo, meso, ecto, classificacao}
  updated_at timestamptz default now()
);

-- ---------- FORÇA ----------
create table if not exists public.forca (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  tipo_avaliacao text not null default 'clinica' check (tipo_avaliacao in ('clinica','campo')),
  -- Preensão palmar (OBRIGATÓRIA)
  preensao_dir_kgf numeric(5,2) not null,
  preensao_esq_kgf numeric(5,2) not null,
  -- Testes adicionais (opcionais)
  testes jsonb default '[]'::jsonb,
  /* ex: [{"nome":"1RM Supino","valor":80,"unidade":"kg"}, ...] */
  -- Resultados
  forca_relativa_dir numeric(5,3),
  forca_relativa_esq numeric(5,3),
  assimetria_percent numeric(5,2),
  updated_at timestamptz default now()
);

-- ---------- CARDIORRESPIRATÓRIO ----------
create table if not exists public.cardiorrespiratorio (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  vo2max numeric(5,2),
  l2 numeric(5,2),              -- limiar 2 (km/h)
  vam numeric(5,2),             -- velocidade aeróbica máxima (km/h)
  fc_max int,
  fc_repouso int,
  zonas jsonb,
  /* { z1:{min,max}, z2:{...}, z3:{...}, z4:{...}, z5:{...} } */
  updated_at timestamptz default now()
);

-- ---------- SCORES ----------
create table if not exists public.scores (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  postura int,
  composicao_corporal int,
  forca int,
  cardiorrespiratorio int,
  global int,
  detalhes jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ---------- TRIGGER updated_at ----------
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

do $$ declare t text; begin
  for t in select unnest(array[
    'pacientes','avaliacoes','anamnese','sinais_vitais','posturografia',
    'antropometria','forca','cardiorrespiratorio','scores'
  ]) loop
    execute format('drop trigger if exists trg_%1$s_upd on public.%1$s;', t);
    execute format('create trigger trg_%1$s_upd before update on public.%1$s for each row execute procedure public.set_updated_at();', t);
  end loop;
end $$;
