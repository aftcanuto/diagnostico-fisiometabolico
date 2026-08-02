create table if not exists public.catalogo_produtos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  nome text not null,
  subtitulo text,
  descricao text,
  selo text,
  imagem_url text,
  itens_inclusos text[] not null default '{}',
  beneficios text[] not null default '{}',
  duracao_minutos integer,
  preco numeric(10,2),
  sinal_percentual numeric(5,2) not null default 0,
  whatsapp_texto text,
  ativo boolean not null default true,
  destaque boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalogo_produtos_sinal_percentual_check check (sinal_percentual >= 0 and sinal_percentual <= 100),
  constraint catalogo_produtos_preco_check check (preco is null or preco >= 0),
  constraint catalogo_produtos_duracao_check check (duracao_minutos is null or duracao_minutos > 0)
);

create index if not exists idx_catalogo_produtos_clinica_ordem
  on public.catalogo_produtos(clinica_id, ativo, destaque desc, ordem, nome);

alter table public.catalogo_produtos enable row level security;

drop policy if exists "catalogo_produtos_select" on public.catalogo_produtos;
create policy "catalogo_produtos_select" on public.catalogo_produtos
for select using (
  ativo = true
  or exists (
    select 1 from public.clinica_membros m
    where m.clinica_id = catalogo_produtos.clinica_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "catalogo_produtos_admin_insert" on public.catalogo_produtos;
create policy "catalogo_produtos_admin_insert" on public.catalogo_produtos
for insert with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "catalogo_produtos_admin_update" on public.catalogo_produtos;
create policy "catalogo_produtos_admin_update" on public.catalogo_produtos
for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "catalogo_produtos_admin_delete" on public.catalogo_produtos;
create policy "catalogo_produtos_admin_delete" on public.catalogo_produtos
for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

notify pgrst, 'reload schema';
