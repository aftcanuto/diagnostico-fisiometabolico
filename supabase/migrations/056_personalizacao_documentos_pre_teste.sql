alter table if exists public.documentos_pre_teste_avulsos
  add column if not exists titulo_personalizado text,
  add column if not exists mensagem_personalizada text,
  add column if not exists cor_primaria text,
  add column if not exists fonte text,
  add column if not exists tamanho_texto text;

alter table if exists public.documentos_pre_teste_avulsos
  drop constraint if exists documentos_pre_teste_avulsos_fonte_check;

alter table if exists public.documentos_pre_teste_avulsos
  add constraint documentos_pre_teste_avulsos_fonte_check
  check (fonte is null or fonte in ('inter','arial','georgia'));

alter table if exists public.documentos_pre_teste_avulsos
  drop constraint if exists documentos_pre_teste_avulsos_tamanho_texto_check;

alter table if exists public.documentos_pre_teste_avulsos
  add constraint documentos_pre_teste_avulsos_tamanho_texto_check
  check (tamanho_texto is null or tamanho_texto in ('pequeno','medio','grande'));

notify pgrst, 'reload schema';
