alter table if exists public.protocolo_recomendacoes
  add column if not exists titulo_documento text;

alter table if exists public.protocolo_recomendacoes
  alter column modulo drop not null;

alter table if exists public.protocolo_recomendacoes
  drop constraint if exists protocolo_recomendacoes_modulo_check;

notify pgrst, 'reload schema';
