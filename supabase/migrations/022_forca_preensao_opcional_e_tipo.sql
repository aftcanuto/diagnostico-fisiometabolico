-- 022 - Ajustes de forca para dinamometria por tracao

alter table public.forca
  alter column preensao_dir_kgf drop not null,
  alter column preensao_esq_kgf drop not null;

alter table public.forca
  drop constraint if exists forca_tipo_avaliacao_check;

alter table public.forca
  add constraint forca_tipo_avaliacao_check
  check (tipo_avaliacao in ('clinica','esportiva','campo'));
