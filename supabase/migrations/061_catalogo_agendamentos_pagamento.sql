create table if not exists public.catalogo_agendamentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  catalogo_produto_id uuid not null references public.catalogo_produtos(id) on delete restrict,
  produto_nome text not null,
  cliente_nome text not null,
  cliente_email text,
  cliente_telefone text not null,
  data_preferida date,
  periodo_preferido text,
  observacoes text,
  preco_total numeric(10,2),
  sinal_percentual numeric(5,2) not null default 0,
  valor_sinal numeric(10,2) not null default 0,
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento','pagamento_recebido','confirmado','cancelado','expirado')),
  mercado_pago_preference_id text,
  mercado_pago_payment_id text,
  pagamento_url text,
  pago_em timestamptz,
  confirmado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalogo_agendamentos_clinica_status
  on public.catalogo_agendamentos(clinica_id, status, created_at desc);

alter table public.catalogo_agendamentos enable row level security;

drop policy if exists "catalogo_agendamentos_admin_select" on public.catalogo_agendamentos;
create policy "catalogo_agendamentos_admin_select" on public.catalogo_agendamentos
for select using (public.is_membro_clinica(clinica_id));

drop policy if exists "catalogo_agendamentos_admin_update" on public.catalogo_agendamentos;
create policy "catalogo_agendamentos_admin_update" on public.catalogo_agendamentos
for update using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'))
with check (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

drop policy if exists "catalogo_agendamentos_admin_delete" on public.catalogo_agendamentos;
create policy "catalogo_agendamentos_admin_delete" on public.catalogo_agendamentos
for delete using (public.is_membro_clinica(clinica_id) and public.current_papel() in ('owner','admin'));

notify pgrst, 'reload schema';
