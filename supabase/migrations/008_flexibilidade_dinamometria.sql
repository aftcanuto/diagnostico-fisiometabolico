-- ============================================================
--  008 - Módulo de Flexibilidade + Ajustes Força
-- ============================================================

-- ---------- FLEXIBILIDADE (Banco de Wells) ----------
create table if not exists public.flexibilidade (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  -- Banco de Wells (sit and reach) em cm
  tentativa_1 numeric(5,1),
  tentativa_2 numeric(5,1),
  tentativa_3 numeric(5,1),
  melhor_resultado numeric(5,1),   -- maior das 3 tentativas
  classificacao text,               -- excelente/bom/médio/regular/fraco
  -- Outros testes opcionais
  testes_adicionais jsonb default '[]'::jsonb,
  -- Ex: [{ "nome": "Thomas test", "resultado": "positivo", "lado": "D", "obs": "..." }]
  observacoes text,
  updated_at timestamptz default now()
);

alter table public.flexibilidade enable row level security;
drop policy if exists "flex_aval_clinica" on public.flexibilidade;
create policy "flex_aval_clinica" on public.flexibilidade
  for all using (
    exists (select 1 from public.avaliacoes a where a.id = avaliacao_id and a.clinica_id = public.current_clinica_id())
  )
  with check (
    exists (select 1 from public.avaliacoes a where a.id = avaliacao_id and a.clinica_id = public.current_clinica_id())
  );

-- ---------- AJUSTES NA TABELA FORCA ----------
-- Adicionar campos de dinamometria isométrica
alter table public.forca add column if not exists dinamometria jsonb default '[]'::jsonb;
-- Estrutura: [{ "grupo_muscular": "Extensores de joelho D", "valor_kgf": 45, "valor_nm": null, "observacao": "" }]

-- ---------- ADICIONAR FLEXIBILIDADE NOS MÓDULOS ----------
-- Atualizar o jsonb default de modulos_selecionados
-- (não precisa alterar existentes, flexibilidade é opt-in)

-- ---------- SCORES: adicionar coluna flexibilidade ----------
alter table public.scores add column if not exists flexibilidade numeric(5,1);
