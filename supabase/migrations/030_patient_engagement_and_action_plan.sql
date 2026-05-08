-- 030 - Engajamento do paciente, plano de acao e produtos flexiveis

-- Produtos livres e imagem ilustrativa
alter table if exists public.produtos
  add column if not exists produto_livre boolean not null default false,
  add column if not exists anamnese_obrigatoria boolean not null default true,
  add column if not exists imagem_url text;

-- Analises com duas linguagens e plano de acao estruturado
alter table if exists public.analises_ia
  add column if not exists conteudo_paciente jsonb,
  add column if not exists texto_paciente_editado text,
  add column if not exists plano_acao jsonb;

-- Checklist de seguranca da revisao/finalizacao
alter table if exists public.avaliacoes
  add column if not exists checklist_finalizacao jsonb default '{}'::jsonb,
  add column if not exists checklist_alertas_confirmados boolean not null default false;

-- Modelos de consentimento e TCLE
create table if not exists public.consentimento_modelos (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  tipo text not null check (tipo in ('consentimento_informado','tcle')),
  nome text not null,
  descricao text,
  texto text not null,
  ativo boolean not null default true,
  padrao boolean not null default false,
  versao int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_consentimento_modelos_clinica on public.consentimento_modelos(clinica_id);

create table if not exists public.consentimento_aceites (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  modelo_id uuid not null references public.consentimento_modelos(id) on delete restrict,
  modelo_nome text not null,
  modelo_tipo text not null,
  texto_versao int not null,
  texto_aceito text not null,
  aceito_em timestamptz not null default now(),
  ip text,
  user_agent text,
  token text,
  created_at timestamptz default now()
);
create index if not exists idx_consentimento_aceites_paciente on public.consentimento_aceites(paciente_id, aceito_em desc);

-- Biblioteca de protocolos e historico de envio
create table if not exists public.protocolo_recomendacoes (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  modulo text not null check (modulo in (
    'anamnese','sinais_vitais','posturografia','bioimpedancia','antropometria',
    'flexibilidade','forca','rml','cardiorrespiratorio','biomecanica_corrida'
  )),
  titulo text not null,
  texto text not null,
  ativo boolean not null default true,
  padrao boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_protocolos_clinica_modulo on public.protocolo_recomendacoes(clinica_id, modulo);

create table if not exists public.protocolo_envios (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  recomendacoes_ids uuid[] not null default '{}',
  canal text not null default 'email' check (canal in ('email','whatsapp','manual')),
  destino text,
  status text not null default 'registrado' check (status in ('registrado','enviado','erro','revogado')),
  enviado_por uuid references auth.users(id),
  enviado_em timestamptz default now(),
  observacao text
);
create index if not exists idx_protocolo_envios_paciente on public.protocolo_envios(paciente_id, enviado_em desc);

-- Anamnese pre-atendimento por link seguro
create table if not exists public.paciente_anamnese_links (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  template_id uuid references public.anamnese_templates(id) on delete set null,
  token text not null unique,
  expira_em timestamptz not null default (now() + interval '30 days'),
  revogado boolean not null default false,
  respondido_em timestamptz,
  criado_por uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_anamnese_links_paciente on public.paciente_anamnese_links(paciente_id, created_at desc);

create table if not exists public.paciente_anamnese_respostas (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  link_id uuid references public.paciente_anamnese_links(id) on delete set null,
  template_id uuid references public.anamnese_templates(id) on delete set null,
  respostas jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  enviado_em timestamptz not null default now()
);
create index if not exists idx_anamnese_respostas_paciente on public.paciente_anamnese_respostas(paciente_id, enviado_em desc);

-- Buckets
insert into storage.buckets (id, name, public)
values ('produto-imagens', 'produto-imagens', true)
on conflict (id) do nothing;

-- updated_at triggers
do $$
declare t text;
begin
  for t in select unnest(array[
    'consentimento_modelos',
    'protocolo_recomendacoes'
  ]) loop
    execute format('drop trigger if exists trg_%1$s_upd on public.%1$s;', t);
    execute format('create trigger trg_%1$s_upd before update on public.%1$s for each row execute procedure public.set_updated_at();', t);
  end loop;
end $$;

-- RLS
alter table public.consentimento_modelos enable row level security;
alter table public.consentimento_aceites enable row level security;
alter table public.protocolo_recomendacoes enable row level security;
alter table public.protocolo_envios enable row level security;
alter table public.paciente_anamnese_links enable row level security;
alter table public.paciente_anamnese_respostas enable row level security;

drop policy if exists "consentimento_modelos_clinica_select" on public.consentimento_modelos;
create policy "consentimento_modelos_clinica_select" on public.consentimento_modelos
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "consentimento_modelos_admin_insert" on public.consentimento_modelos;
create policy "consentimento_modelos_admin_insert" on public.consentimento_modelos
  for insert with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "consentimento_modelos_admin_update" on public.consentimento_modelos;
create policy "consentimento_modelos_admin_update" on public.consentimento_modelos
  for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
  with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "consentimento_modelos_admin_delete" on public.consentimento_modelos;
create policy "consentimento_modelos_admin_delete" on public.consentimento_modelos
  for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "consentimento_aceites_clinica_select" on public.consentimento_aceites;
create policy "consentimento_aceites_clinica_select" on public.consentimento_aceites
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "consentimento_aceites_clinica_insert" on public.consentimento_aceites;
create policy "consentimento_aceites_clinica_insert" on public.consentimento_aceites
  for insert with check (public.is_membro_clinica(clinica_id));

drop policy if exists "protocolos_clinica_select" on public.protocolo_recomendacoes;
create policy "protocolos_clinica_select" on public.protocolo_recomendacoes
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "protocolos_admin_insert" on public.protocolo_recomendacoes;
create policy "protocolos_admin_insert" on public.protocolo_recomendacoes
  for insert with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "protocolos_admin_update" on public.protocolo_recomendacoes;
create policy "protocolos_admin_update" on public.protocolo_recomendacoes
  for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
  with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "protocolos_admin_delete" on public.protocolo_recomendacoes;
create policy "protocolos_admin_delete" on public.protocolo_recomendacoes
  for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "protocolo_envios_clinica_all" on public.protocolo_envios;
create policy "protocolo_envios_clinica_all" on public.protocolo_envios
  for all using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

drop policy if exists "anamnese_links_clinica_all" on public.paciente_anamnese_links;
create policy "anamnese_links_clinica_all" on public.paciente_anamnese_links
  for all using (public.is_membro_clinica(clinica_id))
  with check (public.is_membro_clinica(clinica_id));

drop policy if exists "anamnese_respostas_clinica_select" on public.paciente_anamnese_respostas;
create policy "anamnese_respostas_clinica_select" on public.paciente_anamnese_respostas
  for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "anamnese_respostas_clinica_insert" on public.paciente_anamnese_respostas;
create policy "anamnese_respostas_clinica_insert" on public.paciente_anamnese_respostas
  for insert with check (public.is_membro_clinica(clinica_id));

drop policy if exists "produto_imagens_public_select" on storage.objects;
create policy "produto_imagens_public_select" on storage.objects
  for select using (bucket_id = 'produto-imagens');

drop policy if exists "produto_imagens_member_insert" on storage.objects;
create policy "produto_imagens_member_insert" on storage.objects
  for insert with check (
    bucket_id = 'produto-imagens'
    and auth.uid() is not null
  );

drop policy if exists "produto_imagens_member_update" on storage.objects;
create policy "produto_imagens_member_update" on storage.objects
  for update using (
    bucket_id = 'produto-imagens'
    and auth.uid() is not null
  )
  with check (
    bucket_id = 'produto-imagens'
    and auth.uid() is not null
  );

drop policy if exists "produto_imagens_member_delete" on storage.objects;
create policy "produto_imagens_member_delete" on storage.objects
  for delete using (
    bucket_id = 'produto-imagens'
    and auth.uid() is not null
  );
