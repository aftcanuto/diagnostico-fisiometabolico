-- 026 - Links do portal do paciente por escopo da clínica

alter table if exists public.paciente_tokens enable row level security;

drop policy if exists "tokens_owner" on public.paciente_tokens;
drop policy if exists "tokens_clinica_select" on public.paciente_tokens;
drop policy if exists "tokens_clinica_insert" on public.paciente_tokens;
drop policy if exists "tokens_clinica_update" on public.paciente_tokens;
drop policy if exists "tokens_clinica_delete" on public.paciente_tokens;

drop policy if exists "tokens_clinica_select" on public.paciente_tokens;
create policy "tokens_clinica_select" on public.paciente_tokens
  for select using (
    exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and p.clinica_id = public.current_clinica_id()
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
        and p.clinica_id = public.current_clinica_id()
    )
  );

drop policy if exists "tokens_clinica_update" on public.paciente_tokens;
create policy "tokens_clinica_update" on public.paciente_tokens
  for update using (
    exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and p.clinica_id = public.current_clinica_id()
    )
  )
  with check (
    exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and p.clinica_id = public.current_clinica_id()
    )
  );

drop policy if exists "tokens_clinica_delete" on public.paciente_tokens;
create policy "tokens_clinica_delete" on public.paciente_tokens
  for delete using (
    exists (
      select 1
      from public.pacientes p
      where p.id = paciente_tokens.paciente_id
        and p.clinica_id = public.current_clinica_id()
    )
  );
