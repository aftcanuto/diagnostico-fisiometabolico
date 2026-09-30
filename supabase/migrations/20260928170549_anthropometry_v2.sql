-- Additive migration. Legacy measurements/results are deliberately left untouched.
begin;

alter table public.antropometria
  add column if not exists registro_v2 jsonb,
  add column if not exists resultados_v2 jsonb,
  add column if not exists revision_v2 integer;

alter table public.antropometria drop constraint if exists antropometria_v2_consistente;
alter table public.antropometria add constraint antropometria_v2_consistente check (
  (registro_v2 is null and resultados_v2 is null and revision_v2 is null)
  or (registro_v2 is not null and resultados_v2 is not null and revision_v2 is not null
      and jsonb_typeof(registro_v2) = 'object' and registro_v2 @> '{"version":2}'::jsonb
      and jsonb_typeof(resultados_v2) = 'object' and resultados_v2 @> '{"version":2}'::jsonb and revision_v2 > 0)
);

alter table public.avaliadores add column if not exists qualificacao_isak jsonb;
alter table public.avaliadores drop constraint if exists avaliadores_isak_objeto;
alter table public.avaliadores add constraint avaliadores_isak_objeto check (
  qualificacao_isak is null or jsonb_typeof(qualificacao_isak) = 'object'
);

comment on column public.antropometria.registro_v2 is 'Coleta ISAK versionada. Sem conversao automatica dos pontos legados.';
comment on column public.antropometria.resultados_v2 is 'Resultados e referencias do motor, calculados no servidor na mesma gravacao da coleta.';
comment on column public.antropometria.revision_v2 is 'Controle otimista de edicoes concorrentes; nao e versao do metodo cientifico.';
comment on column public.avaliadores.qualificacao_isak is 'Nivel ISAK informado pelo profissional; certificacao formal possui declaracao separada. Sem preenchimento retroativo.';

-- Existing RLS/policies remain in force. No new grants or bypass functions.
commit;

-- Rollback: revert application first and keep these nullable columns for preservation.
-- Do not drop populated columns or overwrite legacy data during rollback.
