begin;

alter table public.catalogo_produtos
  add column if not exists imagem_zoom smallint not null default 100;

alter table public.catalogo_produtos
  drop constraint if exists catalogo_produtos_imagem_zoom_check;

alter table public.catalogo_produtos
  add constraint catalogo_produtos_imagem_zoom_check
    check (imagem_zoom between 60 and 180);

comment on column public.catalogo_produtos.imagem_zoom is
  'Escala percentual da imagem na vitrine, de 60% a 180%, com padrao em 100%.';

insert into public.sistema_migrations_aplicadas(nome, origem, observacao)
values (
  '20261005034529_catalogo_imagem_zoom.sql',
  'migration',
  'Zoom configuravel das imagens da vitrine entre 60% e 180%'
)
on conflict (nome) do nothing;

notify pgrst, 'reload schema';
commit;
