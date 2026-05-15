-- ============================================================
-- 018 â€” Trigger para criar template padrÃ£o de anamnese ao criar clÃ­nica
-- ============================================================

-- Garante que novas clÃ­nicas ganham um template de anamnese padrÃ£o automaticamente
create or replace function public.criar_template_anamnese_padrao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.anamnese_templates (clinica_id, nome, descricao, campos, padrao, ativo)
  values (
    NEW.id,
    'Geral',
    'Template padrÃ£o gerado automaticamente',
    '[
      {"id":"queixa","tipo":"texto_longo","label":"Queixa principal","obrigatorio":true},
      {"id":"sec_medico","tipo":"secao","label":"HistÃ³rico mÃ©dico","obrigatorio":false},
      {"id":"historia_familiar","tipo":"texto_longo","label":"HistÃ³rico de doenÃ§a na famÃ­lia","obrigatorio":false},
      {"id":"hipertensao","tipo":"boolean","label":"HipertensÃ£o arterial","obrigatorio":false},
      {"id":"diabetes","tipo":"boolean","label":"Diabetes","obrigatorio":false},
      {"id":"cardiopatia","tipo":"boolean","label":"Cardiopatia","obrigatorio":false},
      {"id":"medicamentos","tipo":"texto_longo","label":"Medicamentos em uso","obrigatorio":false},
      {"id":"cirurgias","tipo":"texto","label":"Cirurgias anteriores","obrigatorio":false},
      {"id":"alergias","tipo":"texto","label":"Alergias","obrigatorio":false},
      {"id":"sec_habitos","tipo":"secao","label":"HÃ¡bitos de vida","obrigatorio":false},
      {"id":"tabagismo","tipo":"boolean","label":"Tabagismo","obrigatorio":false},
      {"id":"alcool","tipo":"selecao","label":"Consumo de Ã¡lcool","obrigatorio":false,"opcoes":["NÃ£o consome","Social (1-2x/semana)","Regular (3-4x/semana)","DiÃ¡rio"]},
      {"id":"sono","tipo":"numero","label":"Horas de sono por noite","obrigatorio":false,"unidade":"h"},
      {"id":"estresse","tipo":"escala","label":"NÃ­vel de estresse","obrigatorio":false},
      {"id":"hidratacao","tipo":"numero","label":"Consumo de Ã¡gua por dia","obrigatorio":false,"unidade":"L"},
      {"id":"sec_atividade","tipo":"secao","label":"Atividade fÃ­sica","obrigatorio":false},
      {"id":"tipo_exercicio","tipo":"texto","label":"Tipo de exercÃ­cio praticado","obrigatorio":false},
      {"id":"freq_semanal","tipo":"numero","label":"FrequÃªncia semanal","obrigatorio":false,"unidade":"dias/sem"},
      {"id":"tempo_sessao","tipo":"numero","label":"DuraÃ§Ã£o da sessÃ£o","obrigatorio":false,"unidade":"min"},
      {"id":"objetivos","tipo":"texto_longo","label":"Objetivos","obrigatorio":true}
    ]'::jsonb,
    true,
    true
  )
  on conflict do nothing;
  return NEW;
end $$;

drop trigger if exists trg_template_anamnese_padrao on public.clinicas;
create trigger trg_template_anamnese_padrao
  after insert on public.clinicas
  for each row execute procedure public.criar_template_anamnese_padrao();

-- Para clÃ­nicas existentes sem template, criar agora
insert into public.anamnese_templates (clinica_id, nome, descricao, campos, padrao, ativo)
select
  c.id,
  'Geral',
  'Template padrÃ£o',
  '[
    {"id":"queixa","tipo":"texto_longo","label":"Queixa principal","obrigatorio":true},
    {"id":"sec_medico","tipo":"secao","label":"HistÃ³rico mÃ©dico","obrigatorio":false},
    {"id":"historia_familiar","tipo":"texto_longo","label":"HistÃ³rico de doenÃ§a na famÃ­lia","obrigatorio":false},
    {"id":"hipertensao","tipo":"boolean","label":"HipertensÃ£o arterial","obrigatorio":false},
    {"id":"diabetes","tipo":"boolean","label":"Diabetes","obrigatorio":false},
    {"id":"medicamentos","tipo":"texto_longo","label":"Medicamentos em uso","obrigatorio":false},
    {"id":"cirurgias","tipo":"texto","label":"Cirurgias anteriores","obrigatorio":false},
    {"id":"sec_habitos","tipo":"secao","label":"HÃ¡bitos de vida","obrigatorio":false},
    {"id":"tabagismo","tipo":"boolean","label":"Tabagismo","obrigatorio":false},
    {"id":"alcool","tipo":"selecao","label":"Consumo de Ã¡lcool","obrigatorio":false,"opcoes":["NÃ£o consome","Social (1-2x/semana)","Regular (3-4x/semana)","DiÃ¡rio"]},
    {"id":"sono","tipo":"numero","label":"Horas de sono por noite","obrigatorio":false,"unidade":"h"},
    {"id":"sec_atividade","tipo":"secao","label":"Atividade fÃ­sica","obrigatorio":false},
    {"id":"tipo_exercicio","tipo":"texto","label":"Tipo de exercÃ­cio praticado","obrigatorio":false},
    {"id":"freq_semanal","tipo":"numero","label":"FrequÃªncia semanal","obrigatorio":false,"unidade":"dias/sem"},
    {"id":"objetivos","tipo":"texto_longo","label":"Objetivos","obrigatorio":true}
  ]'::jsonb,
  true,
  true
from public.clinicas c
where not exists (
  select 1 from public.anamnese_templates t where t.clinica_id = c.id
);

