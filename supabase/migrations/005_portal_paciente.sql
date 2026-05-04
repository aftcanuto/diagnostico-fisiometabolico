-- ============================================================
--  005 - Portal do paciente (link público com token)
-- ============================================================

-- Tokens de acesso público do paciente ao próprio dashboard
create table if not exists public.paciente_tokens (
  token uuid primary key default uuid_generate_v4(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliador_id uuid not null references public.avaliadores(id) on delete cascade,
  criado_em timestamptz default now(),
  expira_em timestamptz not null default (now() + interval '90 days'),
  revogado boolean not null default false
);

create index if not exists idx_tokens_paciente on public.paciente_tokens(paciente_id);

-- Avaliador controla seus próprios tokens
alter table public.paciente_tokens enable row level security;
drop policy if exists "tokens_owner" on public.paciente_tokens;
create policy "tokens_owner" on public.paciente_tokens
  for all using (avaliador_id = auth.uid()) with check (avaliador_id = auth.uid());

-- Função RPC pública (SECURITY DEFINER) para o paciente ler seus dados via token
-- Retorna jsonb compacto com tudo necessário ao dashboard.
create or replace function public.paciente_dashboard_por_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  pac record;
  resultado jsonb;
begin
  select * into t
  from public.paciente_tokens
  where token = p_token
    and revogado = false
    and expira_em > now()
  limit 1;

  if not found then
    return null;
  end if;

  select * into pac from public.pacientes where id = t.paciente_id;
  if not found then return null; end if;

  select jsonb_build_object(
    'paciente', to_jsonb(pac) - 'avaliador_id',
    'avaliacoes', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'data', a.data,
          'tipo', a.tipo,
          'status', a.status,
          'modulos_selecionados', a.modulos_selecionados,
          'scores', (select to_jsonb(s) - 'avaliacao_id' - 'updated_at'
                     from public.scores s where s.avaliacao_id = a.id),
          'antropometria', (select to_jsonb(an) - 'avaliacao_id' - 'updated_at'
                            from public.antropometria an where an.avaliacao_id = a.id),
          'forca', (select to_jsonb(f) - 'avaliacao_id' - 'updated_at'
                    from public.forca f where f.avaliacao_id = a.id),
          'cardiorrespiratorio', (select to_jsonb(c) - 'avaliacao_id' - 'updated_at'
                                  from public.cardiorrespiratorio c where c.avaliacao_id = a.id),
          'posturografia', (select to_jsonb(p) - 'avaliacao_id' - 'updated_at'
                            from public.posturografia p where p.avaliacao_id = a.id),
          'sinais_vitais', (select to_jsonb(sv) - 'avaliacao_id' - 'updated_at'
                            from public.sinais_vitais sv where sv.avaliacao_id = a.id)
        ) order by a.data desc
      )
      from public.avaliacoes a
      where a.paciente_id = t.paciente_id
        and a.status = 'finalizada'
    ), '[]'::jsonb),
    'avaliador', (select jsonb_build_object('nome', nome) from public.avaliadores where id = t.avaliador_id)
  ) into resultado;

  return resultado;
end $$;

-- Permitir execução pública dessa função via anon
grant execute on function public.paciente_dashboard_por_token(uuid) to anon, authenticated;
