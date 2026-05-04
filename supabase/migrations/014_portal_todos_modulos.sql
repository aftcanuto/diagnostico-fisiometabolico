-- Migration 014 — Atualizar portal do paciente com todos os módulos
-- Adiciona bioimpedancia, flexibilidade e anamnese à RPC do portal público

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

  if not found then return null; end if;

  select * into pac from public.pacientes where id = t.paciente_id;
  if not found then return null; end if;

  select jsonb_build_object(
    'paciente', to_jsonb(pac) - 'avaliador_id',
    'avaliacoes', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',                   a.id,
          'data',                 a.data,
          'tipo',                 a.tipo,
          'status',               a.status,
          'modulos_selecionados', a.modulos_selecionados,
          'scores', (
            select to_jsonb(s) - 'avaliacao_id' - 'updated_at'
            from public.scores s where s.avaliacao_id = a.id
          ),
          'antropometria', (
            select to_jsonb(an) - 'avaliacao_id' - 'updated_at'
            from public.antropometria an where an.avaliacao_id = a.id
          ),
          'bioimpedancia', (
            select to_jsonb(bi) - 'avaliacao_id' - 'updated_at'
            from public.bioimpedancia bi where bi.avaliacao_id = a.id
          ),
          'forca', (
            select to_jsonb(f) - 'avaliacao_id' - 'updated_at'
            from public.forca f where f.avaliacao_id = a.id
          ),
          'flexibilidade', (
            select to_jsonb(fl) - 'avaliacao_id' - 'updated_at'
            from public.flexibilidade fl where fl.avaliacao_id = a.id
          ),
          'cardiorrespiratorio', (
            select to_jsonb(c) - 'avaliacao_id' - 'updated_at'
            from public.cardiorrespiratorio c where c.avaliacao_id = a.id
          ),
          'posturografia', (
            select to_jsonb(po) - 'avaliacao_id' - 'updated_at'
            from public.posturografia po where po.avaliacao_id = a.id
          ),
          'sinais_vitais', (
            select to_jsonb(sv) - 'avaliacao_id' - 'updated_at'
            from public.sinais_vitais sv where sv.avaliacao_id = a.id
          ),
          'anamnese', (
            select to_jsonb(am) - 'avaliacao_id' - 'updated_at'
            from public.anamnese am where am.avaliacao_id = a.id
          )
        ) order by a.data desc
      )
      from public.avaliacoes a
      where a.paciente_id = t.paciente_id
        and a.status = 'finalizada'
    ), '[]'::jsonb),
    'avaliador', (
      select jsonb_build_object('nome', nome, 'conselho', crefito_crm)
      from public.avaliadores where id = t.avaliador_id
    )
  ) into resultado;

  return resultado;
end $$;

grant execute on function public.paciente_dashboard_por_token(uuid) to anon, authenticated;
