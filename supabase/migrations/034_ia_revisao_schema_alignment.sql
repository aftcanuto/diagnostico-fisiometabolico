-- 034 - Alinhamento de IA e finalizacao para revisao

alter table if exists public.analises_ia
  add column if not exists conteudo_paciente jsonb,
  add column if not exists texto_paciente_editado text,
  add column if not exists plano_acao jsonb,
  add column if not exists revisado_por uuid references auth.users(id),
  add column if not exists revisado_em timestamptz;

alter table if exists public.avaliacoes
  add column if not exists checklist_finalizacao jsonb default '{}'::jsonb,
  add column if not exists checklist_alertas_confirmados boolean not null default false;

delete from public.analises_ia a
using public.analises_ia b
where a.ctid < b.ctid
  and a.avaliacao_id = b.avaliacao_id
  and a.tipo = b.tipo;

create unique index if not exists analises_ia_avaliacao_tipo_uidx
  on public.analises_ia(avaliacao_id, tipo);
