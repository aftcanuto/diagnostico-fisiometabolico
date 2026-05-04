-- ============================================================
--  006 - SaaS Multi-tenant + IA
-- ============================================================
-- Transforma o sistema em SaaS:
--   - clínicas (tenants)
--   - membros da clínica (papéis: owner/admin/avaliador)
--   - produtos (diagnósticos com módulos pré-configurados)
--   - análises de IA por módulo
--   - planos de assinatura
-- ============================================================

-- ---------- CLÍNICAS (TENANTS) ----------
create table if not exists public.clinicas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  slug text unique,
  -- branding
  logo_url text,
  cor_primaria text default '#1854ed',
  cor_secundaria text default '#0b1f5b',
  cor_gradient_1 text default '#0b1f5b',
  cor_gradient_2 text default '#1854ed',
  cor_gradient_3 text default '#2f72ff',
  -- contato
  cnpj text,
  telefone text,
  email text,
  endereco text,
  site text,
  -- plano
  plano text not null default 'starter' check (plano in ('starter','pro','enterprise')),
  limite_avaliacoes_mes int not null default 50,
  limite_avaliadores int not null default 3,
  ia_habilitada boolean not null default true,
  trial_expira timestamptz default (now() + interval '14 days'),
  ativa boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- MEMBROS DA CLÍNICA ----------
create table if not exists public.clinica_membros (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'avaliador' check (papel in ('owner','admin','avaliador')),
  ativo boolean not null default true,
  created_at timestamptz default now(),
  unique(clinica_id, user_id)
);
create index if not exists idx_membros_user on public.clinica_membros(user_id);

-- ---------- ADICIONAR clinica_id NAS TABELAS EXISTENTES ----------
alter table public.pacientes  add column if not exists clinica_id uuid references public.clinicas(id) on delete cascade;
alter table public.avaliacoes add column if not exists clinica_id uuid references public.clinicas(id) on delete cascade;

create index if not exists idx_pacientes_clinica on public.pacientes(clinica_id);
create index if not exists idx_avaliacoes_clinica on public.avaliacoes(clinica_id);

-- ---------- PRODUTOS (DIAGNÓSTICOS CONFIGURÁVEIS) ----------
create table if not exists public.produtos (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  nome text not null,                          -- ex: "Check-up Executivo", "Avaliação Atleta"
  descricao text,
  modulos jsonb not null default '{
    "anamnese":true,
    "sinais_vitais":true,
    "posturografia":true,
    "antropometria":true,
    "forca":true,
    "cardiorrespiratorio":true
  }'::jsonb,
  duracao_minutos int,                         -- estimativa
  preco numeric(10,2),
  ativo boolean not null default true,
  padrao boolean not null default false,       -- marca o produto default
  created_at timestamptz default now()
);
create index if not exists idx_produtos_clinica on public.produtos(clinica_id);

-- vincular produto à avaliação (opcional)
alter table public.avaliacoes add column if not exists produto_id uuid references public.produtos(id);

-- ---------- ANÁLISES DE IA ----------
create table if not exists public.analises_ia (
  id uuid primary key default uuid_generate_v4(),
  avaliacao_id uuid not null references public.avaliacoes(id) on delete cascade,
  tipo text not null check (tipo in (
    'anamnese','sinais_vitais','posturografia','antropometria',
    'forca','cardiorrespiratorio','conclusao_global','evolucao'
  )),
  -- Conteúdo estruturado da análise
  conteudo jsonb not null default '{}'::jsonb,
  /*
     { achados: [...], interpretacao: "...", riscos: [...],
       beneficios: [...], recomendacoes: [...], alertas: [...] }
  */
  texto_editado text,                          -- profissional pode sobrescrever
  gerado_em timestamptz default now(),
  gerado_por text default 'ia' check (gerado_por in ('ia','manual')),
  modelo_ia text,                              -- ex: 'claude-sonnet-4.5', 'gpt-4o'
  revisado_por uuid references auth.users(id),
  revisado_em timestamptz,
  unique(avaliacao_id, tipo)
);
create index if not exists idx_analises_aval on public.analises_ia(avaliacao_id);

-- ---------- USO DE IA (tracking para cobrança/limites) ----------
create table if not exists public.ia_uso (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  user_id uuid references auth.users(id),
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  tipo text,
  tokens_input int,
  tokens_output int,
  custo_usd numeric(10,6),
  modelo text,
  created_at timestamptz default now()
);
create index if not exists idx_uso_clinica_data on public.ia_uso(clinica_id, created_at desc);

-- ============================================================
-- POLICIES (RLS)
-- ============================================================
alter table public.clinicas         enable row level security;
alter table public.clinica_membros  enable row level security;
alter table public.produtos         enable row level security;
alter table public.analises_ia      enable row level security;
alter table public.ia_uso           enable row level security;

-- Helper: retorna a clinica_id do usuário autenticado
create or replace function public.current_clinica_id() returns uuid
language sql stable security definer set search_path=public as $$
  select clinica_id from public.clinica_membros
  where user_id = auth.uid() and ativo = true
  limit 1
$$;

create or replace function public.current_papel() returns text
language sql stable security definer set search_path=public as $$
  select papel from public.clinica_membros
  where user_id = auth.uid() and ativo = true
  limit 1
$$;

-- Clínica: só membros veem/editam
drop policy if exists "clinica_membros_visible" on public.clinicas;
create policy "clinica_membros_visible" on public.clinicas
  for select using (id = public.current_clinica_id());

drop policy if exists "clinica_admin_update" on public.clinicas;
create policy "clinica_admin_update" on public.clinicas
  for update using (id = public.current_clinica_id() and public.current_papel() in ('owner','admin'));

-- Membros: owner/admin gerenciam; avaliador só se vê
drop policy if exists "membros_owner_all" on public.clinica_membros;
create policy "membros_owner_all" on public.clinica_membros
  for all using (
    clinica_id = public.current_clinica_id()
    and (public.current_papel() in ('owner','admin') or user_id = auth.uid())
  )
  with check (clinica_id = public.current_clinica_id() and public.current_papel() in ('owner','admin'));

-- Produtos: membros veem, admin edita
drop policy if exists "produtos_select" on public.produtos;
create policy "produtos_select" on public.produtos
  for select using (clinica_id = public.current_clinica_id());

drop policy if exists "produtos_admin" on public.produtos;
create policy "produtos_admin" on public.produtos
  for insert with check (clinica_id = public.current_clinica_id() and public.current_papel() in ('owner','admin'));
drop policy if exists "produtos_admin_upd" on public.produtos;
create policy "produtos_admin_upd" on public.produtos
  for update using (clinica_id = public.current_clinica_id() and public.current_papel() in ('owner','admin'));
drop policy if exists "produtos_admin_del" on public.produtos;
create policy "produtos_admin_del" on public.produtos
  for delete using (clinica_id = public.current_clinica_id() and public.current_papel() in ('owner','admin'));

-- Atualizar policies de pacientes/avaliações para escopo por clínica
drop policy if exists "pac_owner" on public.pacientes;
create policy "pac_owner" on public.pacientes
  for all using (clinica_id = public.current_clinica_id()) with check (clinica_id = public.current_clinica_id());

drop policy if exists "aval_owner" on public.avaliacoes;
create policy "aval_owner" on public.avaliacoes
  for all using (clinica_id = public.current_clinica_id()) with check (clinica_id = public.current_clinica_id());

-- Análises IA: qualquer membro da mesma clínica que seja dona da avaliação
create or replace function public.avaliacao_na_minha_clinica(aval uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.avaliacoes a
    where a.id = aval and a.clinica_id = public.current_clinica_id()
  )
$$;

drop policy if exists "analises_clinica" on public.analises_ia;
create policy "analises_clinica" on public.analises_ia
  for all using (public.avaliacao_na_minha_clinica(avaliacao_id))
  with check (public.avaliacao_na_minha_clinica(avaliacao_id));

drop policy if exists "uso_clinica_ro" on public.ia_uso;
create policy "uso_clinica_ro" on public.ia_uso
  for select using (clinica_id = public.current_clinica_id() and public.current_papel() in ('owner','admin'));

-- ============================================================
-- SIGNUP -> cria clínica solo automaticamente
-- ============================================================
create or replace function public.handle_new_user() returns trigger
security definer set search_path = public
language plpgsql as $$
declare
  nova_clinica uuid;
  nome_user text;
begin
  nome_user := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1));

  -- insere/atualiza avaliador
  insert into public.avaliadores (id, nome)
  values (new.id, nome_user)
  on conflict (id) do nothing;

  -- se ainda não pertence a nenhuma clínica, cria uma solo
  if not exists (select 1 from public.clinica_membros where user_id = new.id) then
    insert into public.clinicas (nome) values (coalesce(new.raw_user_meta_data->>'clinica', nome_user || ' — Clínica'))
    returning id into nova_clinica;

    insert into public.clinica_membros (clinica_id, user_id, papel)
    values (nova_clinica, new.id, 'owner');

    -- produto padrão
    insert into public.produtos (clinica_id, nome, descricao, padrao) values
    (nova_clinica, 'Diagnóstico Completo', 'Avaliação completa com todos os módulos.', true);
  end if;

  return new;
end $$;

-- Backfill: usuários/pacientes/avaliações existentes ganham uma clinica
do $$
declare
  u record;
  nova uuid;
begin
  for u in select id, email, raw_user_meta_data from auth.users where not exists (
    select 1 from public.clinica_membros where user_id = auth.users.id
  ) loop
    insert into public.clinicas (nome)
      values (coalesce(u.raw_user_meta_data->>'clinica', split_part(u.email,'@',1) || ' — Clínica'))
      returning id into nova;
    insert into public.clinica_membros (clinica_id, user_id, papel)
      values (nova, u.id, 'owner');
    insert into public.produtos (clinica_id, nome, descricao, padrao)
      values (nova, 'Diagnóstico Completo', 'Avaliação completa com todos os módulos.', true);

    -- migra pacientes/avaliações órfãos deste avaliador
    update public.pacientes  set clinica_id = nova where avaliador_id = u.id and clinica_id is null;
    update public.avaliacoes set clinica_id = nova where avaliador_id = u.id and clinica_id is null;
  end loop;
end $$;
