-- 050 - Prontuario longitudinal do paciente

create extension if not exists "uuid-ossp";

create table if not exists public.prontuarios (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (paciente_id)
);

create table if not exists public.prontuario_eventos (
  id uuid primary key default uuid_generate_v4(),
  prontuario_id uuid not null references public.prontuarios(id) on delete cascade,
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  tipo text not null default 'avaliacao',
  titulo text not null,
  data_evento date not null default current_date,
  status text not null default 'registrado',
  resumo text,
  achados jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  conclusao text,
  plano_acao jsonb,
  origem text not null default 'sistema',
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prontuario_eventos
  drop constraint if exists prontuario_eventos_tipo_check;
alter table public.prontuario_eventos
  add constraint prontuario_eventos_tipo_check
  check (tipo in ('avaliacao','servico','observacao','retorno','documento'));

alter table public.prontuario_eventos
  drop constraint if exists prontuario_eventos_status_check;
alter table public.prontuario_eventos
  add constraint prontuario_eventos_status_check
  check (status in ('registrado','finalizado','reaberto','arquivado'));

create index if not exists idx_prontuarios_clinica_paciente
  on public.prontuarios(clinica_id, paciente_id);

create index if not exists idx_prontuario_eventos_paciente_data
  on public.prontuario_eventos(paciente_id, data_evento desc, created_at desc);

create unique index if not exists prontuario_eventos_avaliacao_tipo_uidx
  on public.prontuario_eventos(avaliacao_id, tipo);

alter table public.prontuarios enable row level security;
alter table public.prontuario_eventos enable row level security;

drop policy if exists "prontuarios_clinica_select" on public.prontuarios;
create policy "prontuarios_clinica_select" on public.prontuarios
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "prontuarios_clinica_insert" on public.prontuarios;
create policy "prontuarios_clinica_insert" on public.prontuarios
  for insert with check (public.is_membro_clinica(clinica_id));

drop policy if exists "prontuarios_clinica_update" on public.prontuarios;
create policy "prontuarios_clinica_update" on public.prontuarios
  for update using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

drop policy if exists "prontuario_eventos_clinica_select" on public.prontuario_eventos;
create policy "prontuario_eventos_clinica_select" on public.prontuario_eventos
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "prontuario_eventos_clinica_insert" on public.prontuario_eventos;
create policy "prontuario_eventos_clinica_insert" on public.prontuario_eventos
  for insert with check (public.is_membro_clinica(clinica_id));

drop policy if exists "prontuario_eventos_clinica_update" on public.prontuario_eventos;
create policy "prontuario_eventos_clinica_update" on public.prontuario_eventos
  for update using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

drop policy if exists "prontuario_eventos_clinica_delete" on public.prontuario_eventos;
create policy "prontuario_eventos_clinica_delete" on public.prontuario_eventos
  for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

create or replace function public.garantir_prontuario_paciente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.clinica_id is not null then
    insert into public.prontuarios (clinica_id, paciente_id)
    values (new.clinica_id, new.id)
    on conflict (paciente_id) do update
      set clinica_id = excluded.clinica_id,
          updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_garantir_prontuario_paciente on public.pacientes;
create trigger trg_garantir_prontuario_paciente
after insert or update of clinica_id on public.pacientes
for each row
execute function public.garantir_prontuario_paciente();

insert into public.prontuarios (clinica_id, paciente_id)
select p.clinica_id, p.id
from public.pacientes p
where p.clinica_id is not null
on conflict (paciente_id) do nothing;
