alter table if exists public.catalogo_produtos
  add column if not exists pacote_itens text[] not null default '{}',
  add column if not exists cupom_codigo text,
  add column if not exists cupom_tipo text not null default 'percentual',
  add column if not exists cupom_valor numeric(10,2) not null default 0,
  add column if not exists cupom_ativo boolean not null default false,
  add column if not exists cupom_validade date,
  add column if not exists cupom_limite_usos integer,
  add column if not exists cupom_usos integer not null default 0;

alter table if exists public.catalogo_produtos
  drop constraint if exists catalogo_produtos_cupom_tipo_check;

alter table if exists public.catalogo_produtos
  add constraint catalogo_produtos_cupom_tipo_check
  check (cupom_tipo in ('percentual','valor'));

alter table if exists public.catalogo_produtos
  drop constraint if exists catalogo_produtos_cupom_valor_check;

alter table if exists public.catalogo_produtos
  add constraint catalogo_produtos_cupom_valor_check
  check (cupom_valor >= 0);

alter table if exists public.catalogo_produtos
  drop constraint if exists catalogo_produtos_cupom_limite_check;

alter table if exists public.catalogo_produtos
  add constraint catalogo_produtos_cupom_limite_check
  check (cupom_limite_usos is null or cupom_limite_usos >= 0);

alter table if exists public.catalogo_agendamentos
  add column if not exists valor_original_sinal numeric(10,2),
  add column if not exists desconto_valor numeric(10,2) not null default 0,
  add column if not exists cupom_codigo text;

update public.catalogo_agendamentos
set valor_original_sinal = valor_sinal
where valor_original_sinal is null;

notify pgrst, 'reload schema';
