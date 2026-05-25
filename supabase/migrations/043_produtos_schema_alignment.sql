-- 043 - Alinhamento de produtos flexiveis em producao

alter table if exists public.produtos
  add column if not exists produto_livre boolean not null default false,
  add column if not exists tipo_produto text not null default 'modular',
  add column if not exists anamnese_obrigatoria boolean not null default true,
  add column if not exists imagem_url text;

alter table if exists public.produtos
  drop constraint if exists produtos_tipo_produto_check;

alter table if exists public.produtos
  add constraint produtos_tipo_produto_check
  check (tipo_produto in ('modular','livre'));

update public.produtos
set tipo_produto = coalesce(tipo_produto, 'modular'),
    produto_livre = coalesce(produto_livre, false),
    anamnese_obrigatoria = coalesce(anamnese_obrigatoria, true)
where tipo_produto is null
   or produto_livre is null
   or anamnese_obrigatoria is null;
