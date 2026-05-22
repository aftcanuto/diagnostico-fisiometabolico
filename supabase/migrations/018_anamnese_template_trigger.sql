-- ============================================================
-- 018 - Trigger para criar template padrao de anamnese ao criar clinica
-- ============================================================

-- Garante que novas clinicas ganham um template de anamnese padrao automaticamente
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
    'Template padrao gerado automaticamente',
    '[
      {"id":"queixa","tipo":"texto_longo","label":"Queixa principal","obrigatorio":true},
      {"id":"sec_medico","tipo":"secao","label":"Historico medico","obrigatorio":false},
      {"id":"historia_familiar","tipo":"texto_longo","label":"Historico de doenca na familia","obrigatorio":false},
      {"id":"hipertensao","tipo":"boolean","label":"Hipertensao arterial","obrigatorio":false},
      {"id":"diabetes","tipo":"boolean","label":"Diabetes","obrigatorio":false},
      {"id":"cardiopatia","tipo":"boolean","label":"Cardiopatia","obrigatorio":false},
      {"id":"medicamentos","tipo":"texto_longo","label":"Medicamentos em uso","obrigatorio":false},
      {"id":"cirurgias","tipo":"texto","label":"Cirurgias anteriores","obrigatorio":false},
      {"id":"alergias","tipo":"texto","label":"Alergias","obrigatorio":false},
      {"id":"sec_habitos","tipo":"secao","label":"Habitos de vida","obrigatorio":false},
      {"id":"tabagismo","tipo":"boolean","label":"Tabagismo","obrigatorio":false},
      {"id":"alcool","tipo":"selecao","label":"Consumo de alcool","obrigatorio":false,"opcoes":["Nao consome","Social (1-2x/semana)","Regular (3-4x/semana)","Diario"]},
      {"id":"sono","tipo":"numero","label":"Horas de sono por noite","obrigatorio":false,"unidade":"h"},
      {"id":"estresse","tipo":"escala","label":"Nivel de estresse","obrigatorio":false},
      {"id":"hidratacao","tipo":"numero","label":"Consumo de agua por dia","obrigatorio":false,"unidade":"L"},
      {"id":"sec_atividade","tipo":"secao","label":"Atividade fisica","obrigatorio":false},
      {"id":"tipo_exercicio","tipo":"texto","label":"Tipo de exercicio praticado","obrigatorio":false},
      {"id":"freq_semanal","tipo":"numero","label":"Frequencia semanal","obrigatorio":false,"unidade":"dias/sem"},
      {"id":"tempo_sessao","tipo":"numero","label":"Duracao da sessao","obrigatorio":false,"unidade":"min"},
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

-- Para clinicas existentes sem template, criar agora
insert into public.anamnese_templates (clinica_id, nome, descricao, campos, padrao, ativo)
select
  c.id,
  'Geral',
  'Template padrao',
  '[
    {"id":"queixa","tipo":"texto_longo","label":"Queixa principal","obrigatorio":true},
    {"id":"sec_medico","tipo":"secao","label":"Historico medico","obrigatorio":false},
    {"id":"historia_familiar","tipo":"texto_longo","label":"Historico de doenca na familia","obrigatorio":false},
    {"id":"hipertensao","tipo":"boolean","label":"Hipertensao arterial","obrigatorio":false},
    {"id":"diabetes","tipo":"boolean","label":"Diabetes","obrigatorio":false},
    {"id":"medicamentos","tipo":"texto_longo","label":"Medicamentos em uso","obrigatorio":false},
    {"id":"cirurgias","tipo":"texto","label":"Cirurgias anteriores","obrigatorio":false},
    {"id":"sec_habitos","tipo":"secao","label":"Habitos de vida","obrigatorio":false},
    {"id":"tabagismo","tipo":"boolean","label":"Tabagismo","obrigatorio":false},
    {"id":"alcool","tipo":"selecao","label":"Consumo de alcool","obrigatorio":false,"opcoes":["Nao consome","Social (1-2x/semana)","Regular (3-4x/semana)","Diario"]},
    {"id":"sono","tipo":"numero","label":"Horas de sono por noite","obrigatorio":false,"unidade":"h"},
    {"id":"sec_atividade","tipo":"secao","label":"Atividade fisica","obrigatorio":false},
    {"id":"tipo_exercicio","tipo":"texto","label":"Tipo de exercicio praticado","obrigatorio":false},
    {"id":"freq_semanal","tipo":"numero","label":"Frequencia semanal","obrigatorio":false,"unidade":"dias/sem"},
    {"id":"objetivos","tipo":"texto_longo","label":"Objetivos","obrigatorio":true}
  ]'::jsonb,
  true,
  true
from public.clinicas c
where not exists (
  select 1 from public.anamnese_templates t where t.clinica_id = c.id
);

