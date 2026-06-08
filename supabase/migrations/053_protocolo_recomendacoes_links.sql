-- 053 - Links publicos para recomendacoes pre-teste

alter table public.protocolo_envios
  add column if not exists token text,
  add column if not exists expira_em timestamptz,
  add column if not exists revogado boolean not null default false,
  add column if not exists visualizado_em timestamptz;

create unique index if not exists idx_protocolo_envios_token
  on public.protocolo_envios(token)
  where token is not null;

create index if not exists idx_protocolo_envios_ativos
  on public.protocolo_envios(paciente_id, expira_em desc)
  where revogado = false;

notify pgrst, 'reload schema';
