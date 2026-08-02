create table if not exists public.modelos_interpretacao_modulos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  modulo text not null,
  titulo text not null,
  condicao_uso text,
  interpretacao text not null default '',
  riscos text not null default '',
  recomendacoes text not null default '',
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists modelos_interpretacao_modulos_clinica_modulo_idx
  on public.modelos_interpretacao_modulos (clinica_id, modulo, ativo, ordem);

alter table public.modelos_interpretacao_modulos enable row level security;

drop policy if exists "modelos_interpretacao_modulos_clinica_select" on public.modelos_interpretacao_modulos;
create policy "modelos_interpretacao_modulos_clinica_select" on public.modelos_interpretacao_modulos
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "modelos_interpretacao_modulos_admin_insert" on public.modelos_interpretacao_modulos;
create policy "modelos_interpretacao_modulos_admin_insert" on public.modelos_interpretacao_modulos
  for insert with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "modelos_interpretacao_modulos_admin_update" on public.modelos_interpretacao_modulos;
create policy "modelos_interpretacao_modulos_admin_update" on public.modelos_interpretacao_modulos
  for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
  with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "modelos_interpretacao_modulos_admin_delete" on public.modelos_interpretacao_modulos;
create policy "modelos_interpretacao_modulos_admin_delete" on public.modelos_interpretacao_modulos
  for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

create or replace function public.set_modelos_interpretacao_modulos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_modelos_interpretacao_modulos_updated_at on public.modelos_interpretacao_modulos;
create trigger trg_modelos_interpretacao_modulos_updated_at
  before update on public.modelos_interpretacao_modulos
  for each row execute function public.set_modelos_interpretacao_modulos_updated_at();

notify pgrst, 'reload schema';
