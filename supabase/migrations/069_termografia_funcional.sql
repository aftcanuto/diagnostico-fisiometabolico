-- 069 - Modulo de termografia funcional
create table if not exists public.termografia_config (
  clinica_id uuid primary key references public.clinicas(id) on delete cascade,
  fabricante text not null default 'HIKMICRO',
  modelo text not null default 'Pocket2',
  software text not null default 'HIKMICRO Analyzer',
  updated_at timestamptz not null default now()
);

create table if not exists public.termografia (
  avaliacao_id uuid primary key references public.avaliacoes(id) on delete cascade,
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  momento text not null default 'basal',
  temperatura_ambiente numeric(4,1), umidade_relativa numeric(5,1),
  tempo_aclimatacao_min integer, distancia_cm numeric(6,1),
  emissividade numeric(3,2) not null default 0.98 check (emissividade = 0.98),
  capturado_em timestamptz, recomendacoes_seguidas boolean,
  recomendacoes_observacao text, ambiente_estavel boolean,
  sem_corrente_ar boolean, sem_sol_direto boolean,
  sem_fonte_calor boolean, regiao_exposta boolean,
  condicoes_observacao text,
  equipamento_fabricante text not null default 'HIKMICRO',
  equipamento_modelo text not null default 'Pocket2',
  equipamento_software text not null default 'HIKMICRO Analyzer',
  foto_anterior text, foto_posterior text,
  foto_lateral_dir text, foto_lateral_esq text,
  rois jsonb not null default '[]'::jsonb,
  imagens_complementares jsonb not null default '[]'::jsonb,
  achados_termicos text, assimetrias_relevantes text,
  correlacao_clinica text, limitacoes text, recomendacoes text,
  encaminhamento text, conclusao_funcional text, observacoes text,
  updated_at timestamptz not null default now()
);
create index if not exists termografia_clinica_idx on public.termografia(clinica_id);

alter table public.termografia_config enable row level security;
alter table public.termografia enable row level security;
drop policy if exists "termografia_config_select" on public.termografia_config;
create policy "termografia_config_select" on public.termografia_config
  for select using (public.is_membro_clinica(clinica_id));
drop policy if exists "termografia_config_admin" on public.termografia_config;
create policy "termografia_config_admin" on public.termografia_config
  for all using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
  with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));
drop policy if exists "termografia_clinica" on public.termografia;
create policy "termografia_clinica" on public.termografia
  for all using (public.user_owns_avaliacao(avaliacao_id))
  with check (public.user_owns_avaliacao(avaliacao_id) and public.is_membro_clinica(clinica_id));

drop trigger if exists trg_termografia_config_updated_at on public.termografia_config;
create trigger trg_termografia_config_updated_at before update on public.termografia_config
  for each row execute function public.set_updated_at();
drop trigger if exists trg_termografia_updated_at on public.termografia;
create trigger trg_termografia_updated_at before update on public.termografia
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public) values ('termografia','termografia',false)
on conflict (id) do update set public=false;
drop policy if exists "termografia_storage_select" on storage.objects;
create policy "termografia_storage_select" on storage.objects for select using
  (bucket_id='termografia' and public.is_membro_clinica(((storage.foldername(name))[1])::uuid));
drop policy if exists "termografia_storage_insert" on storage.objects;
create policy "termografia_storage_insert" on storage.objects for insert with check
  (bucket_id='termografia' and public.is_membro_clinica(((storage.foldername(name))[1])::uuid));
drop policy if exists "termografia_storage_update" on storage.objects;
create policy "termografia_storage_update" on storage.objects for update using
  (bucket_id='termografia' and public.is_membro_clinica(((storage.foldername(name))[1])::uuid));
drop policy if exists "termografia_storage_delete" on storage.objects;
create policy "termografia_storage_delete" on storage.objects for delete using
  (bucket_id='termografia' and public.is_membro_clinica(((storage.foldername(name))[1])::uuid));

alter table public.analises_ia drop constraint if exists analises_ia_tipo_check;
alter table public.analises_ia add constraint analises_ia_tipo_check check (tipo in (
  'anamnese','sinais_vitais','posturografia','termografia','antropometria',
  'bioimpedancia','forca','flexibilidade','rml','cardiorrespiratorio',
  'biomecanica_corrida','conclusao_global','evolucao'
));
notify pgrst, 'reload schema';
