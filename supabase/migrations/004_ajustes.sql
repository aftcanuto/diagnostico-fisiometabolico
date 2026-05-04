-- ============================================================
--  004 - Ajustes pós-MVP
-- ============================================================

-- Coluna população de referência em força
alter table public.forca
  add column if not exists populacao_ref text not null default 'geral'
  check (populacao_ref in ('geral','ativa','atleta'));
