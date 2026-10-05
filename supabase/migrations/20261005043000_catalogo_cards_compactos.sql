begin;

alter table public.catalogo_produtos
  add column if not exists preco_sob_consulta boolean not null default false,
  add column if not exists imagem_posicao_x smallint not null default 50,
  add column if not exists imagem_posicao_y smallint not null default 50;

alter table public.catalogo_produtos
  drop constraint if exists catalogo_produtos_imagem_posicao_x_check,
  drop constraint if exists catalogo_produtos_imagem_posicao_y_check;

alter table public.catalogo_produtos
  add constraint catalogo_produtos_imagem_posicao_x_check
    check (imagem_posicao_x between 0 and 100),
  add constraint catalogo_produtos_imagem_posicao_y_check
    check (imagem_posicao_y between 0 and 100);

comment on column public.catalogo_produtos.preco_sob_consulta is
  'Exibe Sob consulta na vitrine e impede o inicio do pagamento online.';
comment on column public.catalogo_produtos.imagem_posicao_x is
  'Posicao horizontal percentual usada no object-position da imagem compacta.';
comment on column public.catalogo_produtos.imagem_posicao_y is
  'Posicao vertical percentual usada no object-position da imagem compacta.';

insert into public.sistema_migrations_aplicadas(nome, origem, observacao)
values (
  '20261005043000_catalogo_cards_compactos.sql',
  'migration',
  'Cards compactos da vitrine, foco configuravel da imagem e preco sob consulta'
)
on conflict (nome) do nothing;

notify pgrst, 'reload schema';
commit;
