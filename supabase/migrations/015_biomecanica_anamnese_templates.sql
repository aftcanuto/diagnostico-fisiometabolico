-- ══════════════════════════════════════════════════════════════════
-- Migration 015: Biomecânica da corrida + Templates de anamnese
-- ══════════════════════════════════════════════════════════════════

-- 1. Templates de anamnese personalizáveis por clínica
create table if not exists public.anamnese_templates (
  id          uuid primary key default uuid_generate_v4(),
  clinica_id  uuid not null references public.clinicas(id) on delete cascade,
  nome        text not null,
  descricao   text,
  campos      jsonb not null default '[]'::jsonb,
  -- Cada campo: { id, tipo, label, obrigatorio, opcoes?, unidade?, min?, max? }
  -- tipos: texto | texto_longo | boolean | numero | escala | selecao | data | secao
  padrao      boolean not null default false,
  ativo       boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Inserir template padrão será feito via código ao criar clínica

-- 2. Adicionar referência de template na tabela anamnese
alter table public.anamnese
  add column if not exists template_id uuid references public.anamnese_templates(id) on delete set null,
  add column if not exists respostas   jsonb default '{}'::jsonb;
-- respostas: { campo_id: valor, ... }

-- 3. Biomecânica da corrida (cinemática 2D)
create table if not exists public.biomecanica_corrida (
  avaliacao_id       uuid primary key references public.avaliacoes(id) on delete cascade,

  -- Dados gerais
  velocidade_kmh     numeric(5,2),
  movimento          text default 'Corrida em esteira',
  metodologia        text default 'Cinemática computacional bidimensional (2D) no plano sagital',
  link_video         text,           -- URL Drive/YouTube
  foto_frame_url     text,           -- URL imagem com ângulos anotados

  -- Métricas temporais da passada
  metricas jsonb default '{}'::jsonb,
  /* {
    tempo_voo_s: 0.45,
    tempo_contato_solo_s: 0.24,
    frequencia_passos_ppm: 171,
    comprimento_passo_m: 0.58,
    comprimento_passada_m: 1.16,
    fator_esforco_pct: 65,
    fator_esforco_tipo: "Aéreo"
  } */

  -- Ângulos cinemáticos medidos
  angulos jsonb default '{}'::jsonb,
  /* {
    cabeca:           { valor: -11, ideal_min: -13, ideal_max: -3, classificacao: "ideal" },
    tronco:           { valor: 4,   ideal_min: 8,   ideal_max: 14, classificacao: "fora" },
    cotovelo:         { valor: 94,  ideal_min: 77,  ideal_max: 87, classificacao: "aberto" },
    joelho_posterior: { valor: 122, ideal_min: 0,   ideal_max: 97, classificacao: "aberto" },
    joelho_impacto:   { valor: 165, ideal_min: 160, ideal_max: 175, classificacao: "ideal" },
    overstride:       { valor: 28,  ideal_min: 0,   ideal_max: 10, classificacao: "alto" }
  } */

  -- Achados clínicos
  achados jsonb default '{}'::jsonb,
  /* {
    mecanica_frenagem: true,
    sobrecarga_articular: true,
    deslocamento_cg: true,
    ineficiencia_propulsiva: true,
    observacoes: "texto livre"
  } */

  -- Recomendações
  recomendacoes jsonb default '{}'::jsonb,
  /* {
    correcao_postura: "Ativar abdominais...",
    ajuste_passada: "Reduzir comprimento...",
    exercicios_dinamicos: "Introduzir sprints...",
    complementos: "Mobilidade e propriocepção..."
  } */

  -- Gráficos cinemáticos (URLs das imagens)
  graficos jsonb default '{}'::jsonb,
  /* {
    ombros_url: "https://...",
    cotovelos_url: "https://...",
    quadril_url: "https://...",
    joelhos_url: "https://...",
    tornozelos_url: "https://..."
  } */

  updated_at timestamptz default now()
);

-- 4. Adicionar biomecânica ao modulos_selecionados padrão das avaliações
-- (não é breaking change — campo jsonb, simplesmente adicionamos a chave quando selecionada)

-- 5. RLS policies para as novas tabelas
alter table public.anamnese_templates enable row level security;
alter table public.biomecanica_corrida enable row level security;

-- anamnese_templates: membros da clínica podem ver/editar
drop policy if exists "templates_clinica" on public.anamnese_templates;
create policy "templates_clinica" on public.anamnese_templates
  for all using (clinica_id = public.current_clinica_id())
  with check (clinica_id = public.current_clinica_id());

-- biomecanica: mesmo padrão das outras tabelas de avaliação
drop policy if exists "bio_corrida_clinica" on public.biomecanica_corrida;
create policy "bio_corrida_clinica" on public.biomecanica_corrida
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

-- 6. Atualizar RPC do portal para incluir biomecanica
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
          'scores',              (select to_jsonb(s)  - 'avaliacao_id' - 'updated_at' from public.scores s            where s.avaliacao_id = a.id),
          'antropometria',       (select to_jsonb(an) - 'avaliacao_id' - 'updated_at' from public.antropometria an   where an.avaliacao_id = a.id),
          'bioimpedancia',       (select to_jsonb(bi) - 'avaliacao_id' - 'updated_at' from public.bioimpedancia bi   where bi.avaliacao_id = a.id),
          'forca',               (select to_jsonb(f)  - 'avaliacao_id' - 'updated_at' from public.forca f            where f.avaliacao_id = a.id),
          'flexibilidade',       (select to_jsonb(fl) - 'avaliacao_id' - 'updated_at' from public.flexibilidade fl   where fl.avaliacao_id = a.id),
          'cardiorrespiratorio', (select to_jsonb(c)  - 'avaliacao_id' - 'updated_at' from public.cardiorrespiratorio c where c.avaliacao_id = a.id),
          'posturografia',       (select to_jsonb(po) - 'avaliacao_id' - 'updated_at' - 'foto_anterior' - 'foto_posterior' - 'foto_lateral_dir' - 'foto_lateral_esq' from public.posturografia po where po.avaliacao_id = a.id),
          'sinais_vitais',       (select to_jsonb(sv) - 'avaliacao_id' - 'updated_at' from public.sinais_vitais sv   where sv.avaliacao_id = a.id),
          'biomecanica_corrida', (select to_jsonb(bc) - 'avaliacao_id' - 'updated_at' from public.biomecanica_corrida bc where bc.avaliacao_id = a.id),
          'analises_ia', (
            select coalesce(jsonb_object_agg(ai.tipo, ai.texto_editado), '{}'::jsonb)
            from public.analises_ia ai where ai.avaliacao_id = a.id and ai.texto_editado is not null
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

-- 7. Atualizar constraint de tipos de análises IA para incluir novos módulos
alter table public.analises_ia drop constraint if exists analises_ia_tipo_check;
alter table public.analises_ia add constraint analises_ia_tipo_check
  check (tipo in (
    'anamnese','sinais_vitais','posturografia','antropometria','bioimpedancia',
    'forca','flexibilidade','cardiorrespiratorio','biomecanica_corrida',
    'conclusao_global','evolucao'
  ));
