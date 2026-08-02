alter table if exists public.catalogo_produtos
  add column if not exists agenda_dias_semana integer[] not null default array[1,2,3,4,5],
  add column if not exists agenda_periodos text[] not null default array['manha','tarde'];

alter table if exists public.catalogo_produtos
  drop constraint if exists catalogo_produtos_agenda_dias_check;

alter table if exists public.catalogo_produtos
  add constraint catalogo_produtos_agenda_dias_check
  check (agenda_dias_semana <@ array[0,1,2,3,4,5,6]);

alter table if exists public.catalogo_produtos
  drop constraint if exists catalogo_produtos_agenda_periodos_check;

alter table if exists public.catalogo_produtos
  add constraint catalogo_produtos_agenda_periodos_check
  check (agenda_periodos <@ array['manha','tarde','noite']);

notify pgrst, 'reload schema';
