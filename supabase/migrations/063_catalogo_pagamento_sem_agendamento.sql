alter table if exists public.catalogo_produtos
  add column if not exists exigir_data_agendamento boolean not null default true;

notify pgrst, 'reload schema';
