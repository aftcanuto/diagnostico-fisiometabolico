-- 045 - Fonte unica de percentual de gordura no laudo

alter table public.avaliacoes
  add column if not exists fonte_gordura_relatorio text,
  add column if not exists percentual_gordura_relatorio numeric(5,2);

alter table public.avaliacoes
  drop constraint if exists avaliacoes_fonte_gordura_relatorio_check;

alter table public.avaliacoes
  add constraint avaliacoes_fonte_gordura_relatorio_check
  check (
    fonte_gordura_relatorio is null
    or fonte_gordura_relatorio in ('antropometria','bioimpedancia')
  );
