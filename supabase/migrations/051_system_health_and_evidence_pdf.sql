-- 051 - Painel de saude do sistema e rastreio de migrations aplicadas

create table if not exists public.sistema_migrations_aplicadas (
  nome text primary key,
  checksum text,
  origem text not null default 'manual',
  aplicada_em timestamptz not null default now(),
  observacao text
);

alter table public.sistema_migrations_aplicadas enable row level security;

drop policy if exists "sistema_migrations_admin_select" on public.sistema_migrations_aplicadas;
create policy "sistema_migrations_admin_select" on public.sistema_migrations_aplicadas
  for select using (public.current_papel() in ('owner', 'admin'));

drop policy if exists "sistema_migrations_admin_insert" on public.sistema_migrations_aplicadas;
create policy "sistema_migrations_admin_insert" on public.sistema_migrations_aplicadas
  for insert with check (public.current_papel() in ('owner', 'admin'));

drop policy if exists "sistema_migrations_admin_update" on public.sistema_migrations_aplicadas;
create policy "sistema_migrations_admin_update" on public.sistema_migrations_aplicadas
  for update using (public.current_papel() in ('owner', 'admin'))
  with check (public.current_papel() in ('owner', 'admin'));

drop policy if exists "sistema_migrations_admin_delete" on public.sistema_migrations_aplicadas;
create policy "sistema_migrations_admin_delete" on public.sistema_migrations_aplicadas
  for delete using (public.current_papel() in ('owner', 'admin'));

insert into public.sistema_migrations_aplicadas (nome, origem, observacao)
values
  ('001_schema.sql', 'backfill', 'Registro criado pela migration 051'),
  ('002_policies.sql', 'backfill', 'Registro criado pela migration 051'),
  ('003_storage.sql', 'backfill', 'Registro criado pela migration 051'),
  ('004_ajustes.sql', 'backfill', 'Registro criado pela migration 051'),
  ('005_portal_paciente.sql', 'backfill', 'Registro criado pela migration 051'),
  ('006_saas_ia.sql', 'backfill', 'Registro criado pela migration 051'),
  ('007_bucket_publico.sql', 'backfill', 'Registro criado pela migration 051'),
  ('008_flexibilidade_dinamometria.sql', 'backfill', 'Registro criado pela migration 051'),
  ('009_bioimpedancia.sql', 'backfill', 'Registro criado pela migration 051'),
  ('010_sptech_dinamometria.sql', 'backfill', 'Registro criado pela migration 051'),
  ('011_ventilometria.sql', 'backfill', 'Registro criado pela migration 051'),
  ('012_cpf_paciente.sql', 'backfill', 'Registro criado pela migration 051'),
  ('013_pdf_config.sql', 'backfill', 'Registro criado pela migration 051'),
  ('014_portal_todos_modulos.sql', 'backfill', 'Registro criado pela migration 051'),
  ('015_biomecanica_anamnese_templates.sql', 'backfill', 'Registro criado pela migration 051'),
  ('016_rml_fixes.sql', 'backfill', 'Registro criado pela migration 051'),
  ('017_bucket_branding.sql', 'backfill', 'Registro criado pela migration 051'),
  ('018_anamnese_template_trigger.sql', 'backfill', 'Registro criado pela migration 051'),
  ('019_drop_bioimpedancia_impedancias.sql', 'backfill', 'Registro criado pela migration 051'),
  ('020_bucket_biomecanica.sql', 'backfill', 'Registro criado pela migration 051'),
  ('021_forca_dinamometria_tracao.sql', 'backfill', 'Registro criado pela migration 051'),
  ('022_forca_preensao_opcional_e_tipo.sql', 'backfill', 'Registro criado pela migration 051'),
  ('023_biomecanica_comentarios_graficos.sql', 'backfill', 'Registro criado pela migration 051'),
  ('024_schema_alignment_for_deploy.sql', 'backfill', 'Registro criado pela migration 051'),
  ('025_internal_access_and_evaluator_profile.sql', 'backfill', 'Registro criado pela migration 051'),
  ('026_paciente_tokens_clinica_policies.sql', 'backfill', 'Registro criado pela migration 051'),
  ('027_clinica_membership_rls_fix.sql', 'backfill', 'Registro criado pela migration 051'),
  ('028_clinica_instagram.sql', 'backfill', 'Registro criado pela migration 051'),
  ('029_biomecanica_video_posterior.sql', 'backfill', 'Registro criado pela migration 051'),
  ('030_patient_engagement_and_action_plan.sql', 'backfill', 'Registro criado pela migration 051'),
  ('031_consentimento_links.sql', 'backfill', 'Registro criado pela migration 051'),
  ('032_configuracoes_anamnese_termos_protocolos_fix.sql', 'backfill', 'Registro criado pela migration 051'),
  ('033_planos_acao_alimentar.sql', 'backfill', 'Registro criado pela migration 051'),
  ('034_ia_revisao_schema_alignment.sql', 'backfill', 'Registro criado pela migration 051'),
  ('035_fix_medfit_site_domain.sql', 'backfill', 'Registro criado pela migration 051'),
  ('036_pre_atendimento_tables_repair.sql', 'backfill', 'Registro criado pela migration 051'),
  ('037_consentimento_revogacao_e_anamnese_respostas.sql', 'backfill', 'Registro criado pela migration 051'),
  ('038_anamnese_historia_familiar_historico_medico.sql', 'backfill', 'Registro criado pela migration 051'),
  ('039_forca_contexto_esportivo_medeor.sql', 'backfill', 'Registro criado pela migration 051'),
  ('040_forca_tracao_whc06_metricas.sql', 'backfill', 'Registro criado pela migration 051'),
  ('041_paciente_dados_corporais_base.sql', 'backfill', 'Registro criado pela migration 051'),
  ('042_normalize_text_integrity.sql', 'backfill', 'Registro criado pela migration 051'),
  ('043_produtos_schema_alignment.sql', 'backfill', 'Registro criado pela migration 051'),
  ('044_produtos_catalogo_comercial.sql', 'backfill', 'Registro criado pela migration 051'),
  ('045_fonte_gordura_relatorio.sql', 'backfill', 'Registro criado pela migration 051'),
  ('046_catalogo_textos_clinica.sql', 'backfill', 'Registro criado pela migration 051'),
  ('047_central_evidencias_legais.sql', 'backfill', 'Registro criado pela migration 051'),
  ('048_produto_imagens_bucket_hardening.sql', 'backfill', 'Registro criado pela migration 051'),
  ('049_planos_alimentares_templates_padrao.sql', 'backfill', 'Registro criado pela migration 051'),
  ('050_prontuario_paciente.sql', 'backfill', 'Registro criado pela migration 051'),
  ('051_system_health_and_evidence_pdf.sql', 'manual', 'Painel de saude do sistema e evidencias legais em PDF')
on conflict (nome) do update
set observacao = excluded.observacao,
    origem = excluded.origem;
