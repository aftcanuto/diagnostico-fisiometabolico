begin;
alter table public.pacientes enable row level security;
alter table public.avaliacoes enable row level security;
alter table public.avaliadores enable row level security;
revoke all on public.pacientes, public.avaliacoes, public.avaliadores from anon;
revoke all on public.avaliadores from authenticated;
grant select, insert, update on public.avaliadores to authenticated;
grant select, insert, update, delete on public.pacientes, public.avaliacoes to authenticated;

drop policy if exists pac_owner on public.pacientes;
create policy pac_owner on public.pacientes for all to authenticated
using (public.is_membro_clinica(clinica_id)) with check (public.is_membro_clinica(clinica_id));
drop policy if exists aval_owner on public.avaliacoes;
create policy aval_owner on public.avaliacoes for all to authenticated
using (public.is_membro_clinica(clinica_id)) with check (public.is_membro_clinica(clinica_id));

drop policy if exists avaliador_read on public.avaliadores;
create policy avaliador_read on public.avaliadores for select to authenticated using (
  id = (select auth.uid()) or exists (
    select 1 from public.clinica_membros cm where cm.user_id = avaliadores.id
      and cm.ativo and public.is_membro_clinica(cm.clinica_id)
  )
);
drop policy if exists avaliador_insert on public.avaliadores;
create policy avaliador_insert on public.avaliadores for insert to authenticated
with check (id = (select auth.uid()));
drop policy if exists avaliador_update on public.avaliadores;
create policy avaliador_update on public.avaliadores for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
notify pgrst, 'reload schema';
commit;
