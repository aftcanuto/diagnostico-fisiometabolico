-- ══════════════════════════════════════════════════════════════════
-- Migration 016: RML + Correções gerais de completude
-- ══════════════════════════════════════════════════════════════════

-- 1. Tabela RML (Resistência Muscular Localizada)
create table if not exists public.rml (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,

  -- Categoria
  categoria text not null default 'jovem_ativo'
    check (categoria in ('jovem_ativo', 'idoso')),

  -- MMSS – Flexão de braço
  mmss_modalidade          text,   -- 'tradicional' | 'modificada'
  mmss_reps                int,
  mmss_classificacao       text,

  -- Abdominal – opção 1: 1 minuto
  abd_1min_reps            int,
  abd_1min_classificacao   text,

  -- Abdominal – opção 2: Prancha ventral
  abd_prancha_seg          int,
  abd_prancha_classificacao text,

  -- MMII – opção 1: Agachamento 1 min
  mmii_agach_reps          int,
  mmii_agach_classificacao text,

  -- MMII – opção 2: Wall Sit
  mmii_wallsit_seg         int,
  mmii_wallsit_classificacao text,

  -- Testes de idoso (≥ 60 anos) — Rikli & Jones
  idoso_sl_reps            int,    -- Sentar e Levantar 30 s
  idoso_sl_classificacao   text,
  idoso_armcurl_reps       int,    -- Arm Curl Test 30 s
  idoso_armcurl_classificacao text,

  -- Score global RML (0–100)
  score                    numeric(5,1),

  observacoes              text,
  updated_at               timestamptz default now()
);

alter table public.rml enable row level security;

drop policy if exists "rml_clinica" on public.rml;
create policy "rml_clinica" on public.rml
  for all using (
    exists (
      select 1 from public.avaliacoes a
      where a.id = avaliacao_id
        and a.clinica_id = public.current_clinica_id()
    )
  )
  with check (
    exists (
      select 1 from public.avaliacoes a
      where a.id = avaliacao_id
        and a.clinica_id = public.current_clinica_id()
    )
  );

-- Trigger updated_at
drop trigger if exists trg_rml_upd on public.rml;
create trigger trg_rml_upd
  before update on public.rml
  for each row execute procedure public.set_updated_at();

-- 2. Coluna rml na tabela scores
alter table public.scores add column if not exists rml numeric(5,1);

-- 3. Tipo 'rml' em analises_ia
-- Atualizar constraint para incluir 'rml'
alter table public.analises_ia drop constraint if exists analises_ia_tipo_check;
alter table public.analises_ia add constraint analises_ia_tipo_check
  check (tipo in (
    'anamnese','sinais_vitais','posturografia','antropometria','bioimpedancia',
    'forca','flexibilidade','rml','cardiorrespiratorio','biomecanica_corrida',
    'conclusao_global','evolucao'
  ));

-- 4. Garantir que modulos_selecionados suporta todos os módulos actuais
-- (É JSONB, não precisa alterar estrutura, mas vamos registrar os campos esperados
--  atualizando o padrão dos produtos criados automaticamente — apenas documentação)

-- 5. Garantir que biomecanica_corrida e rml estão na RPC do portal
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
  select * into t from public.paciente_tokens
  where token = p_token and revogado = false and expira_em > now() limit 1;
  if not found then return null; end if;

  select * into pac from public.pacientes where id = t.paciente_id;
  if not found then return null; end if;

  select jsonb_build_object(
    'paciente', to_jsonb(pac) - 'avaliador_id',
    'avaliacoes', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', a.id, 'data', a.data, 'tipo', a.tipo,
          'status', a.status, 'modulos_selecionados', a.modulos_selecionados,
          'scores',              (select to_jsonb(s)  - 'avaliacao_id' - 'updated_at' from public.scores s               where s.avaliacao_id = a.id),
          'antropometria',       (select to_jsonb(an) - 'avaliacao_id' - 'updated_at' from public.antropometria an        where an.avaliacao_id = a.id),
          'bioimpedancia',       (select to_jsonb(bi) - 'avaliacao_id' - 'updated_at' from public.bioimpedancia bi        where bi.avaliacao_id = a.id),
          'forca',               (select to_jsonb(f)  - 'avaliacao_id' - 'updated_at' from public.forca f                where f.avaliacao_id = a.id),
          'flexibilidade',       (select to_jsonb(fl) - 'avaliacao_id' - 'updated_at' from public.flexibilidade fl        where fl.avaliacao_id = a.id),
          'rml',                 (select to_jsonb(r)  - 'avaliacao_id' - 'updated_at' from public.rml r                  where r.avaliacao_id = a.id),
          'cardiorrespiratorio', (select to_jsonb(c)  - 'avaliacao_id' - 'updated_at' from public.cardiorrespiratorio c   where c.avaliacao_id = a.id),
          'posturografia',       (select to_jsonb(po) - 'avaliacao_id' - 'updated_at'
                                       - 'foto_anterior' - 'foto_posterior' - 'foto_lateral_dir' - 'foto_lateral_esq'
                                  from public.posturografia po where po.avaliacao_id = a.id),
          'sinais_vitais',       (select to_jsonb(sv) - 'avaliacao_id' - 'updated_at' from public.sinais_vitais sv        where sv.avaliacao_id = a.id),
          'anamnese',            (select to_jsonb(am) - 'avaliacao_id' - 'updated_at' from public.anamnese am             where am.avaliacao_id = a.id),
          'biomecanica_corrida', (select to_jsonb(bc) - 'avaliacao_id' - 'updated_at' from public.biomecanica_corrida bc  where bc.avaliacao_id = a.id),
          'analises_ia', (
            select coalesce(
              jsonb_object_agg(
                ai.tipo,
                jsonb_build_object(
                  'conteudo', ai.conteudo,
                  'texto_editado', ai.texto_editado,
                  'gerado_em', ai.gerado_em
                )
              ),
              '{}'::jsonb
            )
            from public.analises_ia ai where ai.avaliacao_id = a.id
          )
        ) order by a.data desc
      )
      from public.avaliacoes a
      where a.paciente_id = t.paciente_id and a.status = 'finalizada'
    ), '[]'::jsonb),
    'avaliador', (
      select jsonb_build_object('nome', nome, 'conselho', crefito_crm)
      from public.avaliadores where id = t.avaliador_id
    )
  ) into resultado;

  return resultado;
end $$;

grant execute on function public.paciente_dashboard_por_token(uuid) to anon, authenticated;

-- 6. Garantir que handle_new_user está registrado como trigger
-- (muitas vezes esquece de criar o trigger em si)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
