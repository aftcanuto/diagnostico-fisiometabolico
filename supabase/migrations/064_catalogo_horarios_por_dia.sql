alter table if exists public.catalogo_produtos
  add column if not exists agenda_horarios jsonb not null default '{}'::jsonb;

alter table if exists public.catalogo_agendamentos
  add column if not exists horario_preferido text;

notify pgrst, 'reload schema';
