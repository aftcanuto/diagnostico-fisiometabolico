create table if not exists public.documentos_pre_teste_config (
  clinica_id uuid primary key references public.clinicas(id) on delete cascade,
  titulo_padrao text,
  mensagem_html text,
  cor_primaria text not null default '#047857',
  fonte text not null default 'inter',
  tamanho_texto text not null default 'medio',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.documentos_pre_teste_config
  drop constraint if exists documentos_pre_teste_config_fonte_check;
alter table public.documentos_pre_teste_config
  add constraint documentos_pre_teste_config_fonte_check
  check (fonte in ('inter','arial','georgia'));

alter table public.documentos_pre_teste_config
  drop constraint if exists documentos_pre_teste_config_tamanho_check;
alter table public.documentos_pre_teste_config
  add constraint documentos_pre_teste_config_tamanho_check
  check (tamanho_texto in ('pequeno','medio','grande'));

alter table public.documentos_pre_teste_config enable row level security;

drop policy if exists "documentos_pre_teste_config_clinica_all"
  on public.documentos_pre_teste_config;
create policy "documentos_pre_teste_config_clinica_all"
  on public.documentos_pre_teste_config
  for all
  using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

notify pgrst, 'reload schema';
