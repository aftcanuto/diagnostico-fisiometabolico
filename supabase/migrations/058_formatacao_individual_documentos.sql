alter table if exists public.consentimento_modelos
  add column if not exists texto_html text,
  add column if not exists cor_destaque text,
  add column if not exists fonte text,
  add column if not exists tamanho_texto text;

alter table if exists public.protocolo_recomendacoes
  add column if not exists texto_html text,
  add column if not exists cor_destaque text,
  add column if not exists fonte text,
  add column if not exists tamanho_texto text;

alter table if exists public.consentimento_modelos
  drop constraint if exists consentimento_modelos_fonte_check;
alter table if exists public.consentimento_modelos
  add constraint consentimento_modelos_fonte_check
  check (fonte is null or fonte in ('inter','arial','georgia'));

alter table if exists public.protocolo_recomendacoes
  drop constraint if exists protocolo_recomendacoes_fonte_check;
alter table if exists public.protocolo_recomendacoes
  add constraint protocolo_recomendacoes_fonte_check
  check (fonte is null or fonte in ('inter','arial','georgia'));

alter table if exists public.consentimento_modelos
  drop constraint if exists consentimento_modelos_tamanho_check;
alter table if exists public.consentimento_modelos
  add constraint consentimento_modelos_tamanho_check
  check (tamanho_texto is null or tamanho_texto in ('pequeno','medio','grande'));

alter table if exists public.protocolo_recomendacoes
  drop constraint if exists protocolo_recomendacoes_tamanho_check;
alter table if exists public.protocolo_recomendacoes
  add constraint protocolo_recomendacoes_tamanho_check
  check (tamanho_texto is null or tamanho_texto in ('pequeno','medio','grande'));

notify pgrst, 'reload schema';
