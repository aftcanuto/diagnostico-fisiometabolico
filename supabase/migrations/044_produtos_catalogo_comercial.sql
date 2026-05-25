-- 044 - Catalogo comercial de produtos

alter table if exists public.produtos
  add column if not exists beneficios jsonb not null default '[]'::jsonb,
  add column if not exists cta_texto text,
  add column if not exists cta_url text,
  add column if not exists destaque_comercial boolean not null default false;

update public.produtos
set beneficios = '[]'::jsonb
where beneficios is null;
