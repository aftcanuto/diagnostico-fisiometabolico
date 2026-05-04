-- 024 - Alinhamento final do schema para deploy
-- Corrige colunas esperadas pelo app e remove campos antigos de impedancia Z.

alter table if exists public.forca
  add column if not exists modelo_dinamometria text not null default 'medeor',
  add column if not exists tracao_testes jsonb default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'forca_modelo_dinamometria_check'
      and conrelid = 'public.forca'::regclass
  ) then
    alter table public.forca
      add constraint forca_modelo_dinamometria_check
      check (modelo_dinamometria in ('medeor', 'tracao'));
  end if;
end $$;

alter table if exists public.biomecanica_corrida
  add column if not exists comentarios_angulos jsonb default '{}'::jsonb,
  add column if not exists comentarios_graficos jsonb default '{}'::jsonb;

alter table if exists public.bioimpedancia
  drop column if exists impedancias,
  drop column if exists impedancia_z,
  drop column if exists z;
