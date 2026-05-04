-- 021 - Dinamometria isometrica por tracao

alter table public.forca
  add column if not exists modelo_dinamometria text not null default 'medeor'
    check (modelo_dinamometria in ('medeor','tracao')),
  add column if not exists tracao_testes jsonb default '[]'::jsonb;

comment on column public.forca.modelo_dinamometria is
  'Modelo usado na dinamometria isometrica manual: medeor/sptech ou tracao.';

comment on column public.forca.tracao_testes is
  'Lista de testes de tracao com FIM, fator operacional, 1RM estimado, assimetria e RFD.';
