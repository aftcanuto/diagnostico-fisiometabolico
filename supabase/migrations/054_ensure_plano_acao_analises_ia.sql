-- Garante o armazenamento estruturado do plano de acao nas analises de IA.
alter table if exists public.analises_ia
  add column if not exists plano_acao jsonb;

create unique index if not exists analises_ia_avaliacao_tipo_uidx
  on public.analises_ia(avaliacao_id, tipo);

notify pgrst, 'reload schema';
