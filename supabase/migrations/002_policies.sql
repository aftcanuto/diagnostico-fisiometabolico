-- ============================================================
--  002 - RLS POLICIES
-- ============================================================

alter table public.avaliadores           enable row level security;
alter table public.pacientes             enable row level security;
alter table public.avaliacoes            enable row level security;
alter table public.anamnese              enable row level security;
alter table public.sinais_vitais         enable row level security;
alter table public.posturografia         enable row level security;
alter table public.antropometria         enable row level security;
alter table public.forca                 enable row level security;
alter table public.cardiorrespiratorio   enable row level security;
alter table public.scores                enable row level security;

-- Avaliadores: cada um vê só o próprio perfil
drop policy if exists "avaliador_self" on public.avaliadores;
create policy "avaliador_self" on public.avaliadores
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Pacientes
drop policy if exists "pac_owner" on public.pacientes;
create policy "pac_owner" on public.pacientes
  for all using (avaliador_id = auth.uid()) with check (avaliador_id = auth.uid());

-- Avaliações
drop policy if exists "aval_owner" on public.avaliacoes;
create policy "aval_owner" on public.avaliacoes
  for all using (avaliador_id = auth.uid()) with check (avaliador_id = auth.uid());

-- Helper: sub-tabelas seguem a avaliação
create or replace function public.user_owns_avaliacao(aval uuid) returns boolean
language sql stable as $$
  select exists (select 1 from public.avaliacoes a where a.id = aval and a.avaliador_id = auth.uid())
$$;

do $$ declare t text; begin
  for t in select unnest(array[
    'anamnese','sinais_vitais','posturografia','antropometria',
    'forca','cardiorrespiratorio','scores'
  ]) loop
    execute format('drop policy if exists "sub_owner" on public.%1$s;', t);
    execute format($p$
      create policy "sub_owner" on public.%1$s
        for all
        using (public.user_owns_avaliacao(avaliacao_id))
        with check (public.user_owns_avaliacao(avaliacao_id));
    $p$, t);
  end loop;
end $$;

-- Trigger para criar registro em avaliadores ao signup
create or replace function public.handle_new_user() returns trigger
security definer set search_path = public
language plpgsql as $$
begin
  insert into public.avaliadores (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
