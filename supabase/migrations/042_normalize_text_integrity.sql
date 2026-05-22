-- 042 - Normalizacao de textos legados em templates de anamnese
-- Objetivo: corrigir rotulos que possam ter sido salvos com caracteres corrompidos
-- e padronizar o campo historia_familiar como historico de doenca na familia.

update public.anamnese_templates
set
  nome = replace(replace(replace(coalesce(nome, ''), 'HistÃ³rico', 'Historico'), 'Anamnese padrÃ£o', 'Anamnese padrao'), 'clÃ­nica', 'clinica'),
  descricao = nullif(
    replace(
      replace(
        replace(
          replace(coalesce(descricao, ''), 'HistÃ³rico', 'Historico'),
          'padrÃ£o',
          'padrao'
        ),
        'clÃ­nica',
        'clinica'
      ),
      'mÃ©dico',
      'medico'
    ),
    ''
  ),
  campos = replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(
    replace(campos::text,
      'HistÃ³rico de doenÃ§a na famÃ­lia', 'Historico de doenca na familia'),
      'HistÃ³ria familiar', 'Historico de doenca na familia'),
      'Historia familiar', 'Historico de doenca na familia'),
      'HistÃ³rico mÃ©dico', 'Historico medico'),
      'NÃ£o', 'Nao'),
      'HipertensÃ£o arterial', 'Hipertensao arterial'),
      'HÃ¡bitos de vida', 'Habitos de vida'),
      'Consumo de Ã¡lcool', 'Consumo de alcool'),
      'NÃ£o consome', 'Nao consome'),
      'DiÃ¡rio', 'Diario'),
      'NÃ­vel de estresse', 'Nivel de estresse'),
      'Consumo de Ã¡gua por dia', 'Consumo de agua por dia'),
      'Atividade fÃ­sica', 'Atividade fisica'),
      'Tipo de exercÃ­cio praticado', 'Tipo de exercicio praticado'),
      'FrequÃªncia semanal', 'Frequencia semanal'),
      'DuraÃ§Ã£o da sessÃ£o', 'Duracao da sessao'),
      'ObservaÃ§Ãµes', 'Observacoes'),
      'seÃ§Ã£o', 'secao')::jsonb,
  updated_at = now()
where
  campos::text like '%Ã%'
  or campos::text like '%Â%'
  or coalesce(nome, '') like '%Ã%'
  or coalesce(descricao, '') like '%Ã%';

update public.anamnese_templates t
set campos = normalized.campos,
    updated_at = now()
from (
  select
    id,
    jsonb_agg(
      case
        when campo->>'id' = 'historia_familiar'
          then campo || jsonb_build_object(
            'label', 'Historico de doenca na familia',
            'secao', 'Historico medico'
          )
        else campo
      end
      order by ord
    ) as campos
  from public.anamnese_templates,
       jsonb_array_elements(campos) with ordinality as item(campo, ord)
  where jsonb_typeof(campos) = 'array'
  group by id
) normalized
where t.id = normalized.id;
