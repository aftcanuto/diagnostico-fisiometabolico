-- ============================================================
--  009 - Módulo Bioimpedância (Avabio 380 + outros aparelhos)
-- ============================================================

create table if not exists public.bioimpedancia (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,

  -- Identificação
  aparelho   text default 'Avabio 380',
  data_exame date,

  -- Análise global
  peso_kg            numeric(5,2),
  percentual_gordura numeric(5,2),
  massa_gordura_kg   numeric(5,2),
  massa_livre_gordura_kg numeric(5,2),   -- Massa Livre de Gordura (MLG / LBM)
  agua_corporal_kg   numeric(5,2),
  imc                numeric(5,2),

  -- Dados adicionais
  taxa_metabolica_basal_kcal int,
  indice_apendicular         numeric(5,2),  -- Índice Apendicular (ASMI)
  idade_metabolica           int,
  gordura_visceral_nivel     numeric(5,1),  -- escala Avabio

  -- Análise segmentar de MASSA MAGRA (kg e %)
  -- Avabio: braço D/E, tronco, perna D/E
  segmentar_magra jsonb default '{}'::jsonb,
  /*
    {
      "braco_dir":  { "kg": 3.2, "pct": 78 },
      "braco_esq":  { "kg": 3.1, "pct": 77 },
      "tronco":     { "kg": 28.5, "pct": 68 },
      "perna_dir":  { "kg": 10.2, "pct": 72 },
      "perna_esq":  { "kg": 10.0, "pct": 71 }
    }
  */

  -- Análise segmentar de GORDURA (kg e %)
  segmentar_gordura jsonb default '{}'::jsonb,
  /*
    {
      "braco_dir":  { "kg": 0.8, "pct": 22 },
      "braco_esq":  { "kg": 0.9, "pct": 23 },
      "tronco":     { "kg": 12.1, "pct": 32 },
      "perna_dir":  { "kg": 3.1, "pct": 28 },
      "perna_esq":  { "kg": 3.2, "pct": 29 }
    }
  */
  observacoes text,
  updated_at  timestamptz default now()
);

alter table public.bioimpedancia enable row level security;
drop policy if exists "bio_aval_clinica" on public.bioimpedancia;
create policy "bio_aval_clinica" on public.bioimpedancia
  for all using (
    exists (select 1 from public.avaliacoes a
            where a.id = avaliacao_id and a.clinica_id = public.current_clinica_id())
  )
  with check (
    exists (select 1 from public.avaliacoes a
            where a.id = avaliacao_id and a.clinica_id = public.current_clinica_id())
  );
