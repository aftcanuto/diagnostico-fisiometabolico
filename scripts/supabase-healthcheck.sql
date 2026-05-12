-- Diagnóstico Fisiometabólico - Supabase healthcheck
-- Rode no Supabase Dashboard > SQL Editor.
-- Este script é somente leitura: não cria, altera ou apaga dados.

with expected_tables(table_name) as (
  values
    ('clinicas'), ('clinica_membros'), ('avaliadores'), ('pacientes'),
    ('avaliacoes'), ('produtos'), ('anamnese'), ('anamnese_templates'),
    ('sinais_vitais'), ('posturografia'), ('bioimpedancia'), ('antropometria'),
    ('flexibilidade'), ('forca'), ('rml'), ('cardiorrespiratorio'),
    ('biomecanica_corrida'), ('scores'), ('analises_ia'), ('ia_uso'),
    ('paciente_tokens'), ('pdf_config'), ('consentimento_modelos'),
    ('consentimento_links'), ('consentimento_aceites'),
    ('protocolo_recomendacoes'), ('protocolo_envios'),
    ('paciente_anamnese_links'), ('paciente_anamnese_respostas')
)
select
  '01_tabelas_esperadas' as check_name,
  e.table_name,
  case when t.table_name is null then 'FALTA' else 'OK' end as status
from expected_tables e
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = e.table_name
order by e.table_name;

with expected_tables(table_name) as (
  values
    ('clinicas'), ('clinica_membros'), ('avaliadores'), ('pacientes'),
    ('avaliacoes'), ('produtos'), ('anamnese'), ('anamnese_templates'),
    ('sinais_vitais'), ('posturografia'), ('bioimpedancia'), ('antropometria'),
    ('flexibilidade'), ('forca'), ('rml'), ('cardiorrespiratorio'),
    ('biomecanica_corrida'), ('scores'), ('analises_ia'), ('ia_uso'),
    ('paciente_tokens'), ('pdf_config'), ('consentimento_modelos'),
    ('consentimento_links'), ('consentimento_aceites'),
    ('protocolo_recomendacoes'), ('protocolo_envios'),
    ('paciente_anamnese_links'), ('paciente_anamnese_respostas')
)
select
  '02_rls_habilitado' as check_name,
  e.table_name,
  case when c.relrowsecurity then 'OK' else 'RLS_DESLIGADO' end as status
from expected_tables e
join pg_class c on c.relname = e.table_name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
where c.relkind = 'r'
order by e.table_name;

select
  '03_policies_por_tabela' as check_name,
  tablename as table_name,
  count(*) as policies
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;

select
  '04_funcoes_criticas' as check_name,
  p.proname as function_name,
  case when p.proname is null then 'FALTA' else 'OK' end as status
from (values
  ('current_clinica_id'),
  ('current_papel'),
  ('get_portal_avaliacao')
) as expected(function_name)
left join pg_proc p
  on p.proname = expected.function_name
left join pg_namespace n
  on n.oid = p.pronamespace and n.nspname = 'public'
order by expected.function_name;

select
  '05_buckets_storage' as check_name,
  id as bucket_id,
  public,
  file_size_limit
from storage.buckets
where id in ('posturografia', 'branding', 'biomecanica')
order by id;

select
  '05b_bucket_produto_imagens' as check_name,
  id as bucket_id,
  public,
  file_size_limit
from storage.buckets
where id = 'produto-imagens';

select
  '06_storage_policies' as check_name,
  policyname,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

select
  '07_colunas_json_forca' as check_name,
  expected.column_name,
  c.data_type,
  case when c.column_name is null then 'FALTA' else 'OK' end as status
from (values
  ('modelo_dinamometria'),
  ('sptech_testes'),
  ('sptech_relacoes'),
  ('tracao_testes'),
  ('testes')
) as expected(column_name)
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'forca'
 and c.column_name = expected.column_name
order by expected.column_name;

select
  '08_colunas_biomecanica' as check_name,
  expected.column_name,
  c.data_type,
  case when c.column_name is null then 'FALTA' else 'OK' end as status
from (values
  ('link_video'),
  ('foto_frame_url'),
  ('angulos'),
  ('comentarios_angulos'),
  ('graficos'),
  ('comentarios_graficos'),
  ('achados')
) as expected(column_name)
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'biomecanica_corrida'
 and c.column_name = expected.column_name
order by expected.column_name;

select
  '09_bioimpedancia_sem_impedancias_z' as check_name,
  case
    when exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'bioimpedancia'
        and column_name in ('impedancias', 'impedancia_z', 'z')
    )
    then 'FALHA_COLUNA_Z_EXISTE'
    else 'OK'
  end as status;

select
  '10_tipos_ia_permitidos' as check_name,
  pg_get_constraintdef(oid) as constraint_def
from pg_constraint
where conrelid = 'public.analises_ia'::regclass
  and contype = 'c';

select
  '11_colunas_fluxo_publico' as check_name,
  expected.table_name,
  expected.column_name,
  case when c.column_name is null then 'FALTA' else 'OK' end as status
from (values
  ('paciente_anamnese_links', 'respondido_em'),
  ('consentimento_links', 'aceito_em'),
  ('consentimento_modelos', 'versao'),
  ('protocolo_envios', 'status')
) as expected(table_name, column_name)
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = expected.table_name
 and c.column_name = expected.column_name
order by expected.table_name, expected.column_name;
