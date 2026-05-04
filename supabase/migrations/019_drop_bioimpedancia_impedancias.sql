-- ============================================================
-- 019 - Remove impedancias Z da bioimpedancia
-- ============================================================

alter table if exists public.bioimpedancia
  drop column if exists impedancias;
