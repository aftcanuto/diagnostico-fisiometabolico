-- 027 - RLS por vinculo real com a clinica do paciente/avaliacao
-- Evita bloqueios quando um usuario tem mais de uma clinica ou quando a avaliacao
-- foi criada por outro membro da mesma clinica.

create or replace function public.is_membro_clinica(p_clinica uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists (
    select 1
    from public.clinica_membros cm
    where cm.clinica_id = p_clinica
      and cm.user_id = auth.uid()
      and cm.ativo = true
  )
$$;

create or replace function public.user_owns_avaliacao(aval uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists (
    select 1
    from public.avaliacoes a
    join public.clinica_membros cm
      on cm.clinica_id = a.clinica_id
     and cm.user_id = auth.uid()
     and cm.ativo = true
    where a.id = aval
  )
$$;

create or replace function public.avaliacao_na_minha_clinica(aval uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select public.user_owns_avaliacao(aval)
$$;

drop policy if exists "pac_owner" on public.pacientes;
create policy "pac_owner" on public.pacientes
  for all
  using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

drop policy if exists "aval_owner" on public.avaliacoes;
create policy "aval_owner" on public.avaliacoes
  for all
  using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'anamnese',
    'sinais_vitais',
    'posturografia',
    'bioimpedancia',
    'antropometria',
    'flexibilidade',
    'forca',
    'rml',
    'cardiorrespiratorio',
    'biomecanica_corrida',
    'scores'
  ]) loop
    execute format('drop policy if exists "sub_owner" on public.%I;', t);
    execute format($p$
      create policy "sub_owner" on public.%I
        for all
        using (public.user_owns_avaliacao(avaliacao_id))
        with check (public.user_owns_avaliacao(avaliacao_id));
    $p$, t);
  end loop;
end $$;

drop policy if exists "tokens_owner" on public.paciente_tokens;
drop policy if exists "tokens_clinica_select" on public.paciente_tokens;
create policy "tokens_clinica_select" on public.paciente_tokens
  for select using (
    exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and public.is_membro_clinica(p.clinica_id)
    )
  );

drop policy if exists "tokens_clinica_insert" on public.paciente_tokens;
create policy "tokens_clinica_insert" on public.paciente_tokens
  for insert with check (
    avaliador_id = auth.uid()
    and exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and public.is_membro_clinica(p.clinica_id)
    )
  );

drop policy if exists "tokens_clinica_update" on public.paciente_tokens;
create policy "tokens_clinica_update" on public.paciente_tokens
  for update using (
    exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and public.is_membro_clinica(p.clinica_id)
    )
  )
  with check (
    exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and public.is_membro_clinica(p.clinica_id)
    )
  );

drop policy if exists "tokens_clinica_delete" on public.paciente_tokens;
create policy "tokens_clinica_delete" on public.paciente_tokens
  for delete using (
    exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and public.is_membro_clinica(p.clinica_id)
    )
  );
